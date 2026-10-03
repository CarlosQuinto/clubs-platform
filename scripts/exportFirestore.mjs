/**
 * Exporta toda la base de Firestore a un JSON.
 *
 * Credenciales, en este orden:
 * 1. GOOGLE_APPLICATION_CREDENTIALS
 * 2. serviceAccountKey.json en la raíz del repo
 * 3. Credenciales de aplicación por defecto (gcloud auth application-default login)
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(
  new URL("../functions/package.json", import.meta.url),
);
const admin = require("firebase-admin");

const PROJECT_ID = "clubs-platform-aem9u";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function authHelp() {
  console.error(`
No hay credenciales para leer Firestore.

Opciones:
1. Consola de Firebase → Configuración del proyecto → Cuentas de servicio → Generar clave nueva.
   Guarda el archivo como serviceAccountKey.json en la raíz del repo (ya está en .gitignore).
2. O define GOOGLE_APPLICATION_CREDENTIALS con la ruta a esa clave.
3. O ejecuta: gcloud auth application-default login
   con una cuenta que tenga acceso al proyecto ${PROJECT_ID}.
`);
}

function loadServiceAccount(path) {
  const json = JSON.parse(readFileSync(path, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(json),
    projectId: json.project_id || PROJECT_ID,
  });
  return json.project_id || PROJECT_ID;
}

async function init() {
  const envKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envKey) {
    if (!existsSync(envKey)) {
      console.error(`GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo que no existe: ${envKey}`);
      authHelp();
      process.exit(1);
    }
    return loadServiceAccount(envKey);
  }

  const localKey = resolve(root, "serviceAccountKey.json");
  if (existsSync(localKey)) return loadServiceAccount(localKey);

  try {
    const credential = admin.credential.applicationDefault();
    await credential.getAccessToken();
    admin.initializeApp({ credential, projectId: PROJECT_ID });
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    authHelp();
    process.exit(1);
  }
  return PROJECT_ID;
}

function typeName(value) {
  return value?.constructor?.name;
}

function serializeValue(value) {
  if (value == null || typeof value !== "object") return value;

  if (typeName(value) === "Timestamp" && typeof value.toDate === "function") {
    return { __type: "timestamp", value: value.toDate().toISOString() };
  }
  if (typeName(value) === "GeoPoint") {
    return {
      __type: "geopoint",
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }
  if (typeName(value) === "DocumentReference") {
    return { __type: "reference", path: value.path };
  }
  if (typeName(value) === "Bytes" && typeof value.toBase64 === "function") {
    return { __type: "bytes", value: value.toBase64() };
  }
  if (value instanceof Date) {
    return { __type: "timestamp", value: value.toISOString() };
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return { __type: "bytes", value: Buffer.from(value).toString("base64") };
  }
  if (Array.isArray(value)) return value.map(serializeValue);

  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    out[key] = serializeValue(nested);
  }
  return out;
}

async function dumpCollection(colRef) {
  const refs = await colRef.listDocuments();
  const docs = {};
  for (const ref of refs) {
    const snap = await ref.get();
    const data = snap.exists ? serializeValue(snap.data()) : {};
    const subcols = await ref.listCollections();
    if (subcols.length) {
      const nested = {};
      for (const sub of subcols) {
        nested[sub.id] = await dumpCollection(sub);
      }
      data.__collections = nested;
    }
    if (snap.exists || subcols.length) docs[ref.id] = data;
  }
  return docs;
}

async function main() {
  const projectId = await init();
  const db = admin.firestore();
  const roots = await db.listCollections();
  const collections = {};

  for (const col of roots) {
    process.stdout.write(`Exportando ${col.id}...\n`);
    collections[col.id] = await dumpCollection(col);
    process.stdout.write(
      `  ${Object.keys(collections[col.id]).length} documentos\n`,
    );
  }

  const exportedAt = new Date().toISOString();
  const day = exportedAt.slice(0, 10);
  const outDir = resolve(root, "exports");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `firestore-${day}.json`);
  writeFileSync(
    outPath,
    `${JSON.stringify({ exportedAt, projectId, collections }, null, 2)}\n`,
  );
  process.stdout.write(`Listo: ${outPath}\n`);
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  if (/credential|Could not load the default credentials|UNAUTHENTICATED|permission/i.test(message)) {
    authHelp();
  }
  process.exit(1);
});
