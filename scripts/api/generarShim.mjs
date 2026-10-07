// Genera src/infrastructure/dataconnect.ts: una función por operación del conector «app»
// (dataconnect/connector/*.gql) con el mismo nombre camelCase y la misma firma que el SDK de
// Data Connect, que llama a la función RPC snake_case de Postgres (supabase.rpc).
//
// Se ejecutó durante la migración; el resultado está versionado. Para añadir una operación nueva,
// edita src/infrastructure/dataconnect.ts a mano siguiendo el mismo patrón.
//
//   node scripts/api/generarShim.mjs

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONNECTOR = join(ROOT, "dataconnect", "connector");
const TYPES = join(ROOT, "src", "infrastructure", "api", "types.ts");
const TARGET = join(ROOT, "src", "infrastructure", "dataconnect.ts");

const camel = (name) => name[0].toLowerCase() + name.slice(1);
const snake = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

// Una operación tiene variables si el SDK generó su interfaz <Op>Variables (las @retired no cuentan)
const typesText = readFileSync(TYPES, "utf8");
const hasVariables = (name) => new RegExp(`^export interface ${name}Variables `, "m").test(typesText);

// Solo se exponen las operaciones que la app importa: cada una debe tener su función RPC en db/migrations/1*.sql
function importedNames(dir, acc = new Set()) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) importedNames(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name) && full !== TARGET) {
      const text = readFileSync(full, "utf8");
      const re = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"[^"]*infrastructure\/dataconnect"/g;
      let m;
      while ((m = re.exec(text))) {
        for (const raw of m[1].split(",")) {
          const name = raw.replace(/^\s*type\s+/, "").trim().split(/\s+as\s+/)[0];
          if (name) acc.add(name);
        }
      }
    }
  }
  return acc;
}
const used = importedNames(join(ROOT, "src"));

const ops = [];
const skipped = [];
for (const file of readdirSync(CONNECTOR).filter((f) => f.endsWith(".gql")).sort()) {
  const text = readFileSync(join(CONNECTOR, file), "utf8");
  const re = /^(query|mutation)\s+(\w+)\s*[^{]*?@auth\(level:\s*(\w+)/gms;
  let m;
  while ((m = re.exec(text))) {
    const [, kind, name, level] = m;
    const op = { kind, name, hasVars: hasVariables(name), level, file };
    if (used.has(camel(name))) ops.push(op);
    else skipped.push(op);
  }
}
ops.sort((a, b) => a.name.localeCompare(b.name));

const helpers = new Set(ops.map((o) => (o.kind === "query" ? (o.hasVars ? "query" : "queryNoVars") : o.hasVars ? "mutation" : "mutationNoVars")));
const lines = [
  "// Operaciones de datos. Generado por scripts/api/generarShim.mjs a partir de dataconnect/connector/*.gql.",
  "// Cada export conserva el nombre y la firma del SDK de Data Connect (op(dataConnect, vars, opciones) -> { data })",
  "// y llama a la función RPC homónima en snake_case (db/migrations/1*.sql). Añade operaciones nuevas aquí a mano.",
  'import type * as T from "./api/types";',
  `import { ${[...helpers].sort().join(", ")} } from "./api/rpc";`,
  "",
  'export * from "./api/types";',
  'export { dataConnect, QueryFetchPolicy, RpcError } from "./api/rpc";',
  'export type { ExecuteQueryOptions, OperationResult } from "./api/rpc";',
  "",
];

let current = "";
for (const op of ops) {
  if (op.file !== current) {
    current = op.file;
    lines.push(`// ---- ${op.file} ----`);
  }
  const data = `T.${op.name}Data`;
  const vars = `T.${op.name}Variables`;
  const rpcName = JSON.stringify(snake(op.name));
  const comment = `/** ${op.kind} ${op.name} (${op.level}) */`;
  if (op.kind === "query") {
    lines.push(comment);
    lines.push(
      op.hasVars
        ? `export const ${camel(op.name)} = query<${vars}, ${data}>(${rpcName});`
        : `export const ${camel(op.name)} = queryNoVars<${data}>(${rpcName});`,
    );
  } else {
    lines.push(comment);
    lines.push(
      op.hasVars
        ? `export const ${camel(op.name)} = mutation<${vars}, ${data}>(${rpcName});`
        : `export const ${camel(op.name)} = mutationNoVars<${data}>(${rpcName});`,
    );
  }
}

writeFileSync(TARGET, `${lines.join("\n")}\n`, "utf8");
console.log(`Escrito ${TARGET}: ${ops.length} operaciones (${skipped.length} sin uso omitidas)`);
console.log(ops.map((o) => `${o.level.padEnd(6)} ${o.kind.padEnd(8)} ${o.name} -> ${snake(o.name)}`).join("\n"));
if (skipped.length) console.log(`\nOmitidas (nadie las importa): ${skipped.map((o) => o.name).join(", ")}`);
