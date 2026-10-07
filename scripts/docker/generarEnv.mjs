// Crea docker/.env a partir de docker/.env.example con secretos nuevos:
// contraseña de Postgres, JWT_SECRET, ANON_KEY y SERVICE_ROLE_KEY (JWT HS256 firmados con ese secreto),
// contraseña de Studio y clave de pg-meta. No sobrescribe un docker/.env existente (usa --force).
//
//   node scripts/docker/generarEnv.mjs [--force]

import { createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const EXAMPLE = join(ROOT, "docker", ".env.example");
const TARGET = join(ROOT, "docker", ".env");
const force = process.argv.includes("--force");

if (existsSync(TARGET) && !force) {
  console.error("docker/.env ya existe. Usa --force para regenerarlo (invalida las sesiones y claves actuales).");
  process.exit(1);
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const secret = (bytes) => randomBytes(bytes).toString("base64url").replace(/[^A-Za-z0-9]/g, "").slice(0, bytes);

function jwt(payload, key) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", key).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

const jwtSecret = secret(48);
const iat = Math.floor(Date.now() / 1000);
const exp = iat + 10 * 365 * 24 * 3600; // 10 años
const values = {
  POSTGRES_PASSWORD: secret(32),
  JWT_SECRET: jwtSecret,
  ANON_KEY: jwt({ role: "anon", iss: "supabase", iat, exp }, jwtSecret),
  SERVICE_ROLE_KEY: jwt({ role: "service_role", iss: "supabase", iat, exp }, jwtSecret),
  DASHBOARD_PASSWORD: secret(20),
  PG_META_CRYPTO_KEY: secret(32),
};

let out = readFileSync(EXAMPLE, "utf8");
for (const [key, value] of Object.entries(values)) {
  const re = new RegExp(`^${key}=__GENERAR__$`, "m");
  if (!re.test(out)) throw new Error(`Falta ${key}=__GENERAR__ en docker/.env.example`);
  out = out.replace(re, `${key}=${value}`);
}
writeFileSync(TARGET, out, "utf8");

const publicUrl = /^SUPABASE_PUBLIC_URL=(.*)$/m.exec(out)?.[1] ?? "http://localhost:8000";
console.log(`Escrito ${TARGET}`);
console.log("\nPega esto en el .env de la raíz (lo lee Vite):\n");
console.log(`VITE_SUPABASE_URL=${publicUrl}`);
console.log(`VITE_SUPABASE_ANON_KEY=${values.ANON_KEY}`);
console.log(`VITE_API_URL=${publicUrl}/fn`);
console.log(`\nStudio: ${publicUrl}  usuario admin  contraseña ${values.DASHBOARD_PASSWORD}`);
