import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { initializeApp } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";
import { TABLE_ORDER, TABLE_TYPES, transformExport } from "./sqlConnect/transform.mjs";

const EXPORT_PATH = process.argv[2] || "exports/firestore-2026-10-02.json";
const REPORT_PATH = process.argv[3] || "exports/sql-migration-report.json";
const BATCH = 40;

const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT || "clubs-platform-aem9u" });
const dataConnect = getDataConnect(
  {
    location: "us-east4",
    serviceId: "clubs-platform-aem9u-service",
  },
  app,
);

function chunks(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i += BATCH) out.push(rows.slice(i, i + BATCH));
  return out;
}

const raw = JSON.parse(await readFile(EXPORT_PATH, "utf8"));
const { tables, issues } = transformExport(raw);
const counts = Object.fromEntries(TABLE_ORDER.map((name) => [name, tables[name].length]));

await mkdir(path.dirname(REPORT_PATH), { recursive: true });
await writeFile(
  REPORT_PATH,
  JSON.stringify({ exportedAt: raw.exportedAt, counts, issues }, null, 2),
);

console.log(`Informe: ${REPORT_PATH}`);
console.log(`Hallazgos: ${issues.length}`);
for (const name of TABLE_ORDER) {
  if (counts[name]) console.log(`  ${name}: ${counts[name]}`);
}

for (const name of TABLE_ORDER) {
  const rows = tables[name];
  if (!rows.length) continue;
  try {
    for (const batch of chunks(rows)) {
      await dataConnect.upsertMany(TABLE_TYPES[name], batch);
    }
  } catch (error) {
    const details = error?.cause?.httpResponse?.data?.errors?.[0]?.extensions?.debug_details;
    console.error(`Fallo al cargar ${name}.`);
    if (details) console.error(details);
    throw error;
  }
  console.log(`cargado ${name}: ${rows.length}`);
}
