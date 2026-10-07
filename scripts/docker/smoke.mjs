// Comprobación de punta a punta del stack Docker en marcha (npm run docker:up), pasando por el gateway
// como lo hace el navegador: funciones RPC, sesión, permisos, imágenes y API de correo.
//
//   npm run docker:smoke
//
// Usa los usuarios de prueba de db/seed (DB_SEED=true). No envía correos ni deja datos: sube una imagen
// de 1 px y la borra, e intenta un registro sin invitación que debe fallar.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const envText = readFileSync(join(ROOT, "docker", ".env"), "utf8");
const env = (key, fallback = "") => (new RegExp(`^${key}=(.*)$`, "m").exec(envText)?.[1] ?? fallback).trim();

const URL_BASE = `http://localhost:${env("KONG_HTTP_PORT", "8000")}`;
const API_DIRECT = `http://localhost:${env("API_HOST_PORT", "8787")}`;
const ANON = env("ANON_KEY");
const SERVICE = env("SERVICE_ROLE_KEY");
const PASSWORD = "demo1234";

let failures = 0;
function check(ok, label, detail) {
  if (ok) console.log(`  ok  ${label}`);
  else {
    failures++;
    console.error(`  FALLÓ ${label}${detail === undefined ? "" : `\n       ${typeof detail === "string" ? detail : JSON.stringify(detail).slice(0, 400)}`}`);
  }
}

async function http(url, { method = "GET", token, body, headers = {}, raw } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token || ANON}`,
      ...(body !== undefined && !raw ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: res.status, json, text, headers: res.headers };
}

const rpc = (fn, vars = {}, token) => http(`${URL_BASE}/rest/v1/rpc/${fn}`, { method: "POST", body: { p: vars }, token });

async function login(email) {
  const res = await http(`${URL_BASE}/auth/v1/token?grant_type=password`, { method: "POST", body: { email, password: PASSWORD } });
  return res.json?.access_token;
}

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Hermosillo" }).format(new Date());

console.log(`Gateway: ${URL_BASE}\n`);

console.log("Lecturas públicas (anon):");
const home = await rpc("home_page", { today });
check(home.status === 200 && Array.isArray(home.json?.tournaments), "home_page responde", home.text.slice(0, 300));
check((home.json?.tournaments?.length ?? 0) > 0, "hay torneos vigentes (datos dummy)", home.json?.tournaments?.length);
const teams = await rpc("teams_page");
check(teams.json?.clubs?.length > 0, `teams_page: ${teams.json?.clubs?.length} clubes`);
const club = await rpc("club_screen", { slug: "halcones-fc-demo" });
check(club.json?.clubs?.[0]?.players_on_club?.length > 0, "club_screen: plantilla visible");
check(club.json?.clubs?.[0]?.transactions_on_club?.length === 0, "club_screen: finanzas ocultas a anónimos");

console.log("\nPermisos:");
const table = await http(`${URL_BASE}/rest/v1/clubs?select=id&limit=1`);
check(table.status >= 400, `las tablas no son accesibles directamente (HTTP ${table.status})`, table.text.slice(0, 200));
const migr = await http(`${URL_BASE}/rest/v1/schema_migrations?select=name&limit=1`);
check(migr.status >= 400, `schema_migrations tampoco (HTTP ${migr.status})`, migr.text.slice(0, 200));
const anonAdmin = await rpc("admin_inbox");
check(anonAdmin.status >= 400, `una función USER rechaza a anon (HTTP ${anonAdmin.status})`);

console.log("\nSesión (GoTrue):");
const adminToken = await login("admin@demo.local");
check(Boolean(adminToken), "login de admin@demo.local");
const presToken = await login("presidente@demo.local");
check(Boolean(presToken), "login de presidente@demo.local");
const bad = await http(`${URL_BASE}/auth/v1/token?grant_type=password`, { method: "POST", body: { email: "admin@demo.local", password: "incorrecta" } });
check(bad.status === 400, `contraseña incorrecta rechazada (HTTP ${bad.status})`);
const signup = await http(`${URL_BASE}/auth/v1/signup`, { method: "POST", body: { email: `sin-invitacion-${Date.now()}@demo.local`, password: "demo1234" } });
check(signup.status >= 400, `registro sin invitación rechazado (HTTP ${signup.status})`, signup.text.slice(0, 200));

console.log("\nRestablecer contraseña (token_hash, sin correo):");
const link = await http(`${URL_BASE}/auth/v1/admin/generate_link`, { method: "POST", token: SERVICE, body: { type: "recovery", email: "admin@demo.local" } });
const tokenHash = link.json?.hashed_token;
check(link.status === 200 && Boolean(tokenHash), "generate_link de recuperación para admin@demo.local", link.text.slice(0, 200));
const verified = await http(`${URL_BASE}/auth/v1/verify`, { method: "POST", body: { type: "recovery", token_hash: tokenHash } });
check(verified.status === 200 && Boolean(verified.json?.access_token), "verify con token_hash devuelve la sesión de recuperación", verified.text.slice(0, 200));
const recoveryUser = await http(`${URL_BASE}/auth/v1/user`, { token: verified.json?.access_token });
check(recoveryUser.json?.email === "admin@demo.local", "la sesión de recuperación es de admin@demo.local (puede cambiar la contraseña)", recoveryUser.text.slice(0, 200));
const reused = await http(`${URL_BASE}/auth/v1/verify`, { method: "POST", body: { type: "recovery", token_hash: tokenHash } });
check(reused.status >= 400, `el mismo token_hash no sirve dos veces (HTTP ${reused.status})`);

console.log("\nFunciones con sesión:");
const admins = await rpc("admin_admins", {}, adminToken);
check(admins.json?.platformAdmins?.[0]?.email === "admin@demo.local", "admin_admins como superadmin", admins.text.slice(0, 200));
const inbox = await rpc("admin_inbox", {}, adminToken);
check(Array.isArray(inbox.json?.inquiries), "admin_inbox como superadmin");
const inboxPres = await rpc("admin_inbox", {}, presToken);
check(inboxPres.status >= 400, `admin_inbox rechaza al presidente (HTTP ${inboxPres.status})`);
const spaces = await rpc("my_spaces", {}, presToken);
check(spaces.json?.clubMembers?.[0]?.role === "ADMIN", "my_spaces: presidente de Halcones");
const clubPres = await rpc("club_screen", { slug: "halcones-fc-demo" }, presToken);
check(clubPres.json?.clubs?.[0]?.transactions_on_club?.length > 0, "club_screen: el presidente sí ve finanzas");
const itemId = `smoke-item-${Date.now()}`;
const saved = await rpc("save_inventory_item", { id: itemId, clubId: "dummy-club-halcones", name: `Prueba ${Date.now()}`, quantity: 1, condition: "BUENO" }, presToken);
check(saved.json?.item?.id === itemId, "mutación: guardar material de inventario", saved.text.slice(0, 200));
const foreign = await rpc("save_inventory_item", { id: `${itemId}-x`, clubId: "dummy-club-bahia", name: "Ajeno", quantity: 1, condition: "BUENO" }, presToken);
check(foreign.json?.item === null, "mutación en club ajeno devuelve null");
const removed = await rpc("delete_inventory_item", { id: itemId, clubId: "dummy-club-halcones" }, presToken);
check(removed.json?.deleted === 1, "mutación: borrar el material de prueba", removed.text.slice(0, 200));

console.log("\nImágenes (Storage):");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const path = `platform/smoke/prueba-${Date.now()}.png`;
const upAnon = await http(`${URL_BASE}/storage/v1/object/media/${path}`, { method: "POST", body: png, raw: true, headers: { "Content-Type": "image/png" } });
check(upAnon.status >= 400, `subir sin sesión rechazado (HTTP ${upAnon.status})`);
const up = await http(`${URL_BASE}/storage/v1/object/media/${path}`, { method: "POST", body: png, raw: true, token: adminToken, headers: { "Content-Type": "image/png", "cache-control": "31536000" } });
check(up.status === 200, "subir imagen con sesión", up.text.slice(0, 200));
const pub = await fetch(`${URL_BASE}/storage/v1/object/public/media/${path}`);
check(pub.status === 200 && (pub.headers.get("content-type") || "").startsWith("image/png"), "la URL pública sirve la imagen");
const txt = await http(`${URL_BASE}/storage/v1/object/media/platform/smoke/nota.txt`, { method: "POST", body: "hola", raw: true, token: adminToken, headers: { "Content-Type": "text/plain" } });
check(txt.status >= 400, `un archivo que no es imagen se rechaza (HTTP ${txt.status})`);
const del = await http(`${URL_BASE}/storage/v1/object/media/${path}`, { method: "DELETE", token: adminToken });
check(del.status === 200, "borrar la imagen de prueba", del.text.slice(0, 200));

console.log("\nAPI de correo:");
const health = await fetch(`${API_DIRECT}/health`).then((r) => r.json()).catch((e) => ({ error: String(e) }));
check(health.ok === true, "GET /health", health);
const noAuth = await http(`${URL_BASE}/fn/sendClubInvite`, { method: "POST", body: {}, headers: { Authorization: "" } });
check(noAuth.status === 401 && noAuth.json?.code === "unauthenticated", `/fn vía gateway exige sesión (HTTP ${noAuth.status})`, noAuth.text.slice(0, 200));
const held = await http(`${URL_BASE}/fn/sendClubInvite`, {
  method: "POST",
  token: presToken,
  body: { clubId: "dummy-club-halcones", email: "nuevo@demo.local", role: "dt", token: "abcdef0123456789abcdef0123456789", hold: true },
});
check(held.status === 200 && held.json?.held === true, "sendClubInvite (hold, sin enviar correo) como presidente", held.text.slice(0, 200));
check(held.json?.kind === "signup", "sendClubInvite: correo sin cuenta -> invitación a crear cuenta", held.json);
const heldKnown = await http(`${URL_BASE}/fn/sendClubInvite`, {
  method: "POST",
  token: presToken,
  body: { clubId: "dummy-club-halcones", email: "dt@demo.local", role: "prensa", token: "abcdef0123456789abcdef0123456789", hold: true },
});
check(heldKnown.json?.kind === "accept", "sendClubInvite: correo con cuenta -> invitación a aceptar el rol", heldKnown.json);
const denied = await http(`${URL_BASE}/fn/sendClubInvite`, {
  method: "POST",
  token: presToken,
  body: { clubId: "dummy-club-bahia", email: "nuevo@demo.local", role: "dt", token: "abcdef0123456789abcdef0123456789", hold: true },
});
check(denied.status === 403, `sendClubInvite en club ajeno denegado (HTTP ${denied.status})`, denied.text.slice(0, 200));
const tpl = await fetch(`${API_DIRECT}/templates/recovery.html`);
check(tpl.status === 200, "plantilla de restablecer contraseña disponible para GoTrue");

console.log("\nStudio:");
const studio = await fetch(`${URL_BASE}/`, { redirect: "manual" });
check(studio.status === 401, `Studio pide usuario y contraseña (HTTP ${studio.status})`);

if (failures) {
  console.error(`\n${failures} fallo(s). Revisa npm run docker:logs.`);
  process.exit(1);
}
console.log("\nTodo el stack responde correctamente.");
