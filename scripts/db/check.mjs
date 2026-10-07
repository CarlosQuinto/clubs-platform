// Comprueba las migraciones y la semilla sin Docker, con un Postgres embebido (PGlite).
//
//   npm run db:check              # migra, siembra y prueba cada función RPC con cada rol
//   npm run db:check -- --quiet   # solo errores
//
// Simula lo justo del entorno de Supabase: roles anon/authenticated/service_role, esquema auth
// (tablas users/identities y auth.uid()/auth.jwt() leyendo request.jwt.claims), esquema storage
// (buckets/objects/foldername) y pgcrypto en «extensions». Después ejecuta scripts/db/pruebas.mjs
// si existe (casos concretos por pantalla).

import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const quiet = process.argv.includes("--quiet");
const log = (...args) => { if (!quiet) console.log(...args); };

const STUB = `
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

CREATE SCHEMA extensions;
CREATE EXTENSION pgcrypto SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

CREATE SCHEMA auth;
CREATE TABLE auth.users (
  instance_id uuid, id uuid PRIMARY KEY, aud varchar(255), role varchar(255), email varchar(255),
  encrypted_password varchar(255), email_confirmed_at timestamptz,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz,
  confirmation_token varchar(255), recovery_token varchar(255), email_change varchar(255),
  email_change_token_new varchar(255), email_change_token_current varchar(255),
  reauthentication_token varchar(255), is_sso_user boolean NOT NULL DEFAULT false
);
CREATE TABLE auth.identities (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  provider_id text NOT NULL, provider text NOT NULL, identity_data jsonb NOT NULL,
  last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz,
  UNIQUE (provider_id, provider)
);
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid(), auth.jwt() TO anon, authenticated, service_role;

CREATE SCHEMA storage;
CREATE TABLE storage.buckets (
  id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false,
  file_size_limit bigint, allowed_mime_types text[]
);
CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text REFERENCES storage.buckets (id),
  name text, owner uuid, metadata jsonb
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE _parts text[];
BEGIN
  SELECT string_to_array(name, '/') INTO _parts;
  RETURN _parts[1:array_length(_parts, 1) - 1];
END
$$;
`;

function sqlFiles(dir, filter = () => true) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full).filter((f) => f.endsWith(".sql") && filter(f)).sort().map((f) => join(full, f));
}

/** Ejecuta un archivo SQL completo; sustituye las variables de psql. */
async function runFile(db, file) {
  const sql = readFileSync(file, "utf8").replace(/:'api_password'/g, "'api_password'");
  try {
    await db.exec(sql);
    log(`  ok  ${file.slice(ROOT.length + 1)}`);
  } catch (err) {
    console.error(`  FALLÓ ${file.slice(ROOT.length + 1)}\n  ${err.message}`);
    throw new Error(`Error en ${file.slice(ROOT.length + 1)}: ${err.message}`);
  }
}

export async function bootDatabase() {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(STUB);
  log("Migraciones:");
  for (const f of sqlFiles("db/migrations")) await runFile(db, f);
  log("Semilla:");
  for (const f of sqlFiles("db/seed", (f) => /^0/.test(f))) await runFile(db, f);
  const demo = join(ROOT, "scripts", "demo", "demo-seed.sql");
  if (existsSync(demo)) await runFile(db, demo);
  else log("  (sin scripts/demo/demo-seed.sql; ejecuta npm run demo:sql para probar con datos dummy)");
  for (const f of sqlFiles("db/seed", (f) => /^[1-9]/.test(f))) await runFile(db, f);
  return db;
}

/** Sesiones de prueba (db/seed/00_usuarios.sql). */
export const SESSIONS = {
  anon: { role: "anon", claims: null },
  usuario: { role: "authenticated", claims: { sub: "11111111-1111-4111-8111-111111111199", email: "nadie@demo.local" } },
  admin: { role: "authenticated", claims: { sub: "11111111-1111-4111-8111-111111111101", email: "admin@demo.local" } },
  presidente: { role: "authenticated", claims: { sub: "11111111-1111-4111-8111-111111111102", email: "presidente@demo.local" } },
  dt: { role: "authenticated", claims: { sub: "11111111-1111-4111-8111-111111111103", email: "dt@demo.local" } },
  tesorero: { role: "authenticated", claims: { sub: "11111111-1111-4111-8111-111111111104", email: "tesorero@demo.local" } },
  prensa: { role: "authenticated", claims: { sub: "11111111-1111-4111-8111-111111111105", email: "prensa@demo.local" } },
};

/** Llama a una función RPC como lo haría PostgREST para esa sesión. Devuelve { data } o { error }. */
export async function rpc(db, session, fn, vars = {}) {
  const s = typeof session === "string" ? SESSIONS[session] : session;
  try {
    return await db.transaction(async (tx) => {
      await tx.exec(`SET LOCAL ROLE ${s.role};`);
      if (s.claims) {
        await tx.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify(s.claims)]);
        await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [s.claims.sub]);
      }
      const r = await tx.query(`SELECT public.${fn}($1::jsonb) AS data`, [JSON.stringify(vars)]);
      return { data: r.rows[0]?.data };
    });
  } catch (err) {
    return { error: { code: err.code, message: err.message } };
  }
}

async function listRpcFunctions(db) {
  const r = await db.query(`
    SELECT p.proname AS name,
      bool_or(has_function_privilege('anon', p.oid, 'EXECUTE')) AS anon_ok,
      bool_or(has_function_privilege('authenticated', p.oid, 'EXECUTE')) AS auth_ok
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.pronargs = 1
      AND pg_get_function_identity_arguments(p.oid) = 'p jsonb'
    GROUP BY p.proname
    ORDER BY p.proname
  `);
  return r.rows;
}

async function main() {
  const db = await bootDatabase();

  const counts = await db.query(`
    SELECT
      (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') AS tablas,
      (SELECT count(*) FROM pg_views WHERE schemaname = 'public') AS vistas,
      (SELECT count(*) FROM clubs) AS clubs,
      (SELECT count(*) FROM auth.users) AS cuentas,
      (SELECT count(*) FROM platform_admins) AS superadmins
  `);
  log("Resumen:", counts.rows[0]);

  // Cada función RPC con cada sesión y variables vacías: solo deben aparecer errores de permiso.
  const fns = await listRpcFunctions(db);
  log(`\nFunciones RPC: ${fns.length}`);
  let failures = 0;
  for (const fn of fns) {
    for (const name of Object.keys(SESSIONS)) {
      const res = await rpc(db, name, fn.name, {});
      if (!res.error) continue;
      const expected = res.error.code === "42501" || res.error.message?.includes("unauthenticated");
      if (expected) continue;
      failures++;
      console.error(`  ERROR ${fn.name} como ${name}: [${res.error.code}] ${res.error.message}`);
    }
  }
  // Las tablas no deben ser accesibles directamente
  const tableProbe = await db.query(`SELECT count(*)::int AS n FROM information_schema.role_table_grants WHERE grantee IN ('anon','authenticated') AND table_schema = 'public'`);
  if (tableProbe.rows[0].n > 0) {
    failures++;
    console.error(`  ERROR anon/authenticated tienen permisos directos sobre ${tableProbe.rows[0].n} tablas/vistas`);
  }

  // Pruebas por bloque: scripts/db/pruebas/*.mjs exportan run({ db, rpc, log, check }) y devuelven el número de fallos
  const dir = join(ROOT, "scripts", "db", "pruebas");
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort()) {
      log(`\nPruebas ${f}:`);
      const mod = await import(pathToFileURL(join(dir, f)).href);
      let fallos = 0;
      const check = (ok, label, detail) => {
        if (ok) log(`  ok  ${label}`);
        else {
          fallos++;
          console.error(`  FALLÓ ${label}${detail ? `\n       ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
        }
      };
      await mod.run({ db, rpc: (session, fn, vars) => rpc(db, session, fn, vars), log, check });
      failures += fallos;
    }
  }

  await db.close();
  if (failures) {
    console.error(`\n${failures} fallo(s).`);
    process.exit(1);
  }
  console.log("\nBase de datos verificada sin errores.");
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
