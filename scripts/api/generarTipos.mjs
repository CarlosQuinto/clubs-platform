// Extrae los tipos de datos del SDK generado de Data Connect (dataconnect/generated/index.d.ts)
// a src/infrastructure/api/types.ts, sin nada de Firebase: quedan los enums, los alias de escalares,
// las interfaces <Op>Data, <Op>Variables y <Tabla>_Key. Así los mappers y hooks compilan igual
// con las funciones RPC de Postgres.
//
// Se ejecutó una vez durante la migración; el resultado está versionado. Vuelve a lanzarlo solo si
// aún conservas dataconnect/generated.
//
//   node scripts/api/generarTipos.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SOURCE = join(ROOT, "dataconnect", "generated", "index.d.ts");
const TARGET = join(ROOT, "src", "infrastructure", "api", "types.ts");

const lines = readFileSync(SOURCE, "utf8").split(/\r?\n/);
const out = [];
let skipping = false;
for (const line of lines) {
  if (skipping) {
    if (/^}\s*$/.test(line)) skipping = false;
    continue;
  }
  if (/^import /.test(line)) continue;
  if (/^export const /.test(line)) continue;
  if (/^export function /.test(line)) continue;
  if (/^interface \w+Ref \{/.test(line)) {
    skipping = true;
    continue;
  }
  out.push(line);
}

// El SDK generado usaba estos enums sin declararlos (skipLibCheck lo ocultaba); se añaden desde schema.gql.
const MISSING_ENUMS = {
  EventType: ["PARTIDO", "ENTRENAMIENTO"],
  FriendlyMatchType: ["AMISTOSO"],
  CardColor: ["YELLOW", "RED"],
  TransactionType: ["INGRESO", "GASTO"],
  TransactionSource: ["MANUAL", "LEGACY_AMOUNT_PAID"],
  GoalStatus: ["ACTIVE", "COMPLETED"],
  InventoryCondition: ["BUENO", "MALO", "PERDIDO"],
};
const joined = out.join("\n");
const extraEnums = Object.entries(MISSING_ENUMS)
  .filter(([name]) => !new RegExp(`^export enum ${name} `, "m").test(joined))
  .map(([name, values]) => `export enum ${name} {\n${values.map((v) => `  ${v} = "${v}",`).join("\n")}\n}\n`)
  .join("\n");

const body = `${extraEnums}\n${joined}`
  .replace(/\n{3,}/g, "\n\n")
  .replace(/^};$/gm, "}")
  .trim();

const header = `// Tipos de las operaciones (antes dataconnect/generated). Generado por scripts/api/generarTipos.mjs: no lo edites a mano.
// Cada función RPC de db/migrations/1*.sql devuelve exactamente la forma de su <Op>Data.
/* eslint-disable */
`;

writeFileSync(TARGET, `${header}\n${body}\n`, "utf8");
console.log(`Escrito ${TARGET} (${body.split("\n").length} líneas)`);
