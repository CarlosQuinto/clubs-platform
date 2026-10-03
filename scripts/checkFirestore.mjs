// Falla si vuelve a aparecer Firestore en el código, las dependencias o la configuración de Firebase.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "..");
const SOURCES = ["src", "functions/src", "dataconnect/connector", "dataconnect/functions", "dataconnect/schema"];
const FORBIDDEN = [
  /firebase\/firestore/,
  /firebase-admin\/firestore/,
  /@google-cloud\/firestore/,
  /\bgetFirestore\b/,
  /\bonDocument(?:Created|Updated|Deleted|Written)\b/,
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(m?[jt]sx?|gql)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const problems = [];
for (const file of SOURCES.flatMap((dir) => walk(path.join(root, dir)))) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (FORBIDDEN.some((re) => re.test(line))) {
      problems.push(`${path.relative(root, file)}:${index + 1}: ${line.trim()}`);
    }
  });
}

for (const manifest of ["package.json", "functions/package.json"]) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, manifest), "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const name of Object.keys(deps)) {
    if (/firestore/i.test(name)) problems.push(`${manifest}: dependencia ${name}`);
  }
}

const firebaseJson = JSON.parse(fs.readFileSync(path.join(root, "firebase.json"), "utf8"));
if ("firestore" in firebaseJson) problems.push("firebase.json: bloque firestore");
for (const file of ["firestore.rules", "firestore.indexes.json"]) {
  if (fs.existsSync(path.join(root, file))) problems.push(`${file} existe`);
}

if (problems.length) {
  console.error("Firestore no debe usarse:\n" + problems.join("\n"));
  process.exit(1);
}
console.log("Sin Firestore.");
