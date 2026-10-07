// Guarda de CI: falla si Firebase (o Firestore) vuelve a aparecer en el código, las dependencias o la configuración.
// La plataforma se autoaloja (Postgres + GoTrue + Storage + API propia); ver README.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = ["src", "api/src", "db", "scripts"];
const FORBIDDEN = [
  /from\s+["']firebase(?:\/|["'])/,
  /from\s+["']firebase-admin/,
  /from\s+["']firebase-functions/,
  /@google-cloud\/firestore/,
  /\bgetFirestore\b/,
  /\bonDocument(?:Created|Updated|Deleted|Written)\b/,
  /firebasestorage\.googleapis\.com/,
  /from\s+["'][^"']*dataconnect\/generated/,
];
const SELF = path.join(root, "scripts", "checkFirebase.mjs");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") walk(full, out);
    } else if (/\.(m?[jt]sx?|sql)$/.test(entry.name) && full !== SELF) out.push(full);
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

for (const manifest of ["package.json", "api/package.json"]) {
  const file = path.join(root, manifest);
  if (!fs.existsSync(file)) continue;
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const name of Object.keys(deps)) {
    if (/^firebase|firestore|^@firebase\//i.test(name)) problems.push(`${manifest}: dependencia ${name}`);
  }
}

for (const file of [
  "firebase.json",
  ".firebaserc",
  "firestore.rules",
  "firestore.indexes.json",
  "storage.rules",
  "functions/package.json",
  "dataconnect/dataconnect.yaml",
]) {
  if (fs.existsSync(path.join(root, file))) problems.push(`${file} existe`);
}

if (problems.length) {
  console.error("Firebase no debe usarse:\n" + problems.join("\n"));
  process.exit(1);
}
console.log("Sin Firebase.");
