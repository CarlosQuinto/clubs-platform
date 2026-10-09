// Genera la colección de Postman (postman/) a partir del código, para probar la API a mano:
// una petición por función RPC expuesta (db/migrations/1*.sql + src/infrastructure/dataconnect.ts, con el
// body de ejemplo sacado de los <Op>Variables de src/infrastructure/api/types.ts), los endpoints de correo
// (api/src/fns), la sesión de GoTrue y las imágenes de Storage. Vuelve a correrlo cuando cambie una función.
//
//   npm run postman:collection
//
// Falla si alguna función con api_expose no tiene su export en dataconnect.ts (o al revés), o si aparece un
// endpoint de correo sin ejemplo aquí (FN_EXAMPLES).

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path) => readFileSync(join(ROOT, path), "utf8").replace(/\r\n/g, "\n");
const OUT = join(ROOT, "postman");

const SERVER_URL = "https://orincofutbol7.duckdns.org/api";
const NOW = new Date();
const YEAR = NOW.getFullYear();
const MONTH = NOW.getMonth() + 1;

const errors = [];

// ---------- Funciones SQL: archivo, acceso y comentario ----------

const SQL_FILES = {
  "1010_fn_public.sql": "1. Público y sesión",
  "1011_fn_club.sql": "2. Club",
  "1012_fn_league.sql": "3. Liga",
  "1013_fn_admin.sql": "4. Admin",
  "1015_fn_finance.sql": "5. Finanzas",
};

const sqlFns = new Map(); // nombre -> { file, access, comment }
for (const file of readdirSync(join(ROOT, "db", "migrations")).filter((f) => /^1\d+_fn_\w+\.sql$/.test(f)).sort()) {
  const sql = read(`db/migrations/${file}`);
  const lines = sql.split("\n");
  for (const [, name, access] of sql.matchAll(/CALL api_expose\('(\w+)',\s*'(PUBLIC|USER)'\)/g)) {
    if (!SQL_FILES[file]) errors.push(`${file} expone ${name} pero no tiene carpeta en SQL_FILES`);
    const at = lines.findIndex((l) => l.startsWith(`CREATE OR REPLACE FUNCTION public.${name}(`));
    const comment = [];
    for (let i = at - 1; i >= 0 && lines[i].startsWith("--"); i--) {
      if (/^-- -{3,}/.test(lines[i])) break;
      comment.unshift(lines[i].replace(/^--\s?/, ""));
    }
    const start = sql.indexOf(lines[at]);
    const readsUserId = sql.slice(start, sql.indexOf("\n$$;", start)).includes("p ->> 'userId'");
    sqlFns.set(name, { file, access, comment: comment.join(" ").trim(), readsUserId });
  }
}

// ---------- Operaciones del cliente: query/mutation y su tipo de variables ----------

const ops = new Map(); // nombre SQL -> { op, kind, varsType }
const dc = read("src/infrastructure/dataconnect.ts");
for (const [, kind, generics, fn] of dc.matchAll(/export const \w+ = (query|mutation|queryNoVars)<([^>]*)>\("(\w+)"\)/g)) {
  const varsType = /T\.(\w+Variables)/.exec(generics)?.[1] ?? null;
  const op = /T\.(\w+)Data/.exec(generics)?.[1] ?? fn;
  ops.set(fn, { op, kind: kind === "mutation" ? "mutation" : "query", varsType });
}

for (const name of sqlFns.keys()) if (!ops.has(name)) errors.push(`${name} tiene api_expose pero no está en dataconnect.ts`);
for (const name of ops.keys()) if (!sqlFns.has(name)) errors.push(`dataconnect.ts llama a ${name}, que no tiene api_expose`);

// ---------- types.ts: enums, uniones e interfaces de variables ----------

const typesTs = read("src/infrastructure/api/types.ts");
const firstValue = new Map(); // enum o unión -> primer valor
for (const [, name, body] of typesTs.matchAll(/export enum (\w+) \{([^}]*)\}/g)) {
  firstValue.set(name, /"([^"]+)"/.exec(body)?.[1]);
}
for (const [, name, body] of typesTs.matchAll(/export type (\w+) =\s*((?:\s*\|?\s*"[^"]*")+)\s*;/g)) {
  firstValue.set(name, /"([^"]+)"/.exec(body)?.[1]);
}

/** Cuerpo de `export interface <name> { ... }` sin las llaves. */
function interfaceBody(name) {
  const start = typesTs.indexOf(`export interface ${name} {`);
  if (start < 0) return null;
  let depth = 0;
  for (let i = typesTs.indexOf("{", start); i < typesTs.length; i++) {
    if (typesTs[i] === "{") depth++;
    else if (typesTs[i] === "}" && --depth === 0) return typesTs.slice(typesTs.indexOf("{", start) + 1, i);
  }
  return null;
}

/** Campos de primer nivel de un cuerpo de interfaz: [{ name, optional, type }]. */
function parseFields(body) {
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const fields = [];
  let depth = 0;
  let current = null;
  for (const line of clean.split("\n")) {
    if (depth === 0) {
      const m = /^\s*(\w+)(\?)?:\s*(.*)$/.exec(line);
      if (!m) continue;
      current = { name: m[1], optional: Boolean(m[2]), type: m[3] };
    } else current.type += `\n${line}`;
    depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    if (depth === 0 && current) {
      current.type = current.type.trim().replace(/;$/, "").trim();
      fields.push(current);
      current = null;
    }
  }
  return fields;
}

// ---------- Valores de ejemplo ----------

// IDs de la base demo (scripts/demo/demo-seed.sql); son variables de la colección.
const DEMO = {
  club_id: "dummy-club-halcones",
  club_slug: "halcones-fc-demo",
  club_id_rival: "dummy-club-bahia",
  tournament_id: "dummy-tour-apertura",
  match_id: "dummy-tour-apertura-j01-1",
  season_id: "dummy-season-actual",
  player_id: "dummy-club-halcones-p01",
  court_id: "dummy-court-norte",
  category_id: "dummy-cat-primera",
  locality_id: "dummy-loc-guaymas",
  ad_id: "dummy-ad-faro",
  group_id: "dummy-group-apertura",
};

const ID_FIELDS = {
  clubId: "{{club_id}}",
  homeClubId: "{{club_id}}",
  homeId: "{{club_id}}",
  awayClubId: "{{club_id_rival}}",
  awayId: "{{club_id_rival}}",
  tournamentId: "{{tournament_id}}",
  matchId: "{{match_id}}",
  seasonId: "{{season_id}}",
  playerId: "{{player_id}}",
  scorerId: "{{player_id}}",
  courtId: "{{court_id}}",
  categoryId: "{{category_id}}",
  localityId: "{{locality_id}}",
  adId: "{{ad_id}}",
  groupId: "{{group_id}}",
};

const TEXT_FIELDS = new Set([
  "name", "title", "description", "note", "detail", "message", "concept", "caption", "headline", "tagline",
  "motto", "location", "venue", "teamName", "playerName", "scorerName", "assistName", "albumName",
  "displayName", "payerName", "captainName", "advertiserName", "brand", "prize", "roundLabel", "reason",
]);

const NUMBERS = {
  amount: 100, price: 100, hourlyRate: 300, deposit: 100, quotaPerPlayer: 50, year: YEAR, month: MONTH,
  minute: 10, quantity: 1, sortOrder: 0, homeScore: 0, awayScore: 0, scoreOurs: 0, scoreTheirs: 0,
  penaltiesOurs: 0, penaltiesTheirs: 0, durationMinutes: 60, slotMinutes: 60, weekday: 1, shirtNumber: 10,
  roundNumber: 1, limit: 20, legs: 1, placement: 1,
};

// Campos `string` cuyo valor la función SQL restringe (enum o lista fija, ver db/migrations/1*.sql).
const STRINGS = {
  type: "INGRESO",
  category: "Cuotas",
  eventType: "ENTRENAMIENTO",
  condition: "BUENO",
  position: "Delantero",
  shirtNumber: "10",
  color: "YELLOW",
  role: "DT",
  kind: "SIGNUP",
  placement: "HOME",
  footballType: "FUT_7",
  topic: "Torneos",
  ids: "{{ad_id}}",
  urls: "https://images.unsplash.com/photo-1574629810360-7efbbe195018",
};

// Valores que la regla general no adivina: el `id` de estas funciones es el del club o el partido, o un
// registro sin variable en la demo; `status` depende de la tabla; y campos opcionales en el tipo que la
// función SQL sí exige. Pueden ser campos obligatorios u opcionales del <Op>Variables.
const OVERRIDES = {
  save_match_score: { id: "{{match_id}}" },
  save_club_portada: { id: "{{club_id}}" },
  save_club_profile: { id: "{{club_id}}" },
  insert_club_heroes: { id: "{{club_id}}" },
  delete_manual_court_hold: { id: "" },
  set_financial_goal_status: { status: "COMPLETED" },
  set_ad_status: { status: "PAUSADO" },
  save_ad: {
    status: "PROGRAMADO",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018",
    endsOn: "{{en_un_mes}}",
  },
  create_season: { name: "{{anio_siguiente}}", startDate: "{{hoy}}", endDate: "{{en_un_mes}}", active: false },
  create_league_charge: { kind: "OTHER", clubId: "{{club_id}}" },
  save_court_hold: { guestEmail: "prueba@demo.local", startTime: "08:00", endTime: "09:00" },
};

// Avisos en la descripción de las peticiones que dependen de un estado que la demo no garantiza.
const NOTES = {
  add_live_match_card: "El partido debe estar en juego: con uno ya jugado (cerrado) devuelve `null`.",
  add_live_match_goal: "El partido debe estar en juego: con uno ya jugado (cerrado) devuelve `null`.",
  add_league_payment: "`chargeId` es el id de un cobro pendiente (sale de `admin_league_charges`).",
  create_season: "El nombre son años (`2027` o `2026-2027`) y no puede repetirse: cámbialo si ya existe.",
  save_court_hold: "La hora debe caer dentro del horario abierto de la cancha y sin chocar con otro apartado.",
};

const isCreate = (op) => /^(Create|Add|Save|Upsert|Insert|Book|Register|Submit|Send)/.test(op);

/** El `id` de una operación: uno nuevo al crear; si no, el de la demo que sugiere el nombre de la operación. */
function idFor(op) {
  if (isCreate(op)) return "{{$guid}}";
  if (/ClubEvent/.test(op)) return "";
  for (const [re, value] of [
    [/Match/, "{{match_id}}"],
    [/Tournament/, "{{tournament_id}}"],
    [/Season/, "{{season_id}}"],
    [/Player/, "{{player_id}}"],
    [/Court/, "{{court_id}}"],
    [/Category/, "{{category_id}}"],
    [/Locality/, "{{locality_id}}"],
    [/Ad(s|Placement)?$|Ad[A-Z]/, "{{ad_id}}"],
    [/Club/, "{{club_id}}"],
  ]) {
    if (re.test(op)) return value;
  }
  return "";
}

function example(field, op) {
  const { name } = field;
  const type = field.type.replace(/\s*\|\s*null/g, "").trim();
  if (type.endsWith("[]")) {
    const item = type.slice(0, -2).trim();
    if (item.startsWith("{")) return [exampleObject(parseFields(item.slice(1, item.lastIndexOf("}"))), op)];
    if (name === "clubIds") return ["{{club_id}}"];
    return [];
  }
  if (type.startsWith("{")) return exampleObject(parseFields(type.slice(1, type.lastIndexOf("}"))), op);
  if (type === "unknown") return null;
  if (type === "DateString") return "{{hoy}}";
  if (type === "TimestampString") return "{{ahora}}";
  if (type === "number" || type === "Int64String") return NUMBERS[name] ?? 1;
  if (type === "boolean") return ["active", "enabled", "paid"].includes(name);
  if (firstValue.has(type)) return firstValue.get(type);
  if (/^"/.test(type)) return /"([^"]+)"/.exec(type)[1];
  // string / UUIDString
  if (name === "id") return idFor(op);
  if (ID_FIELDS[name]) return ID_FIELDS[name];
  if (name === "slug") return isCreate(op) ? "prueba-postman-{{$timestamp}}" : "{{club_slug}}";
  if (/email$/i.test(name) && name !== "emailKey") return "prueba@demo.local";
  if (/phone$/i.test(name)) return "6221234567";
  if (name === "startTime" || name === "eventTime") return "18:00";
  if (name === "endTime") return "19:00";
  if (STRINGS[name]) return STRINGS[name];
  if (name === "term") return "hal";
  if (name === "from" || name === "to" || name === "until" || /On$/.test(name)) return "{{hoy}}";
  // Los nombres suelen ser únicos (por club o en la liga): {{sufijo}} cambia en cada envío.
  if (name === "name") return "Prueba {{sufijo}}";
  if (TEXT_FIELDS.has(name)) return "Prueba Postman";
  return "";
}

/**
 * Solo los campos obligatorios: en varias mutaciones, omitir una clave opcional significa «conservar».
 * `userId` solo cuando la función lo lee (el usuario afectado); en las demás era el de la sesión y se ignora.
 */
function exampleObject(fields, op, readsUserId = false) {
  const out = {};
  for (const f of fields) {
    if (f.optional || (f.name === "userId" && !readsUserId)) continue;
    out[f.name] = example(f, op);
  }
  return out;
}

// ---------- Piezas de la colección ----------

const JSON_HEADERS = [
  { key: "apikey", value: "{{anon_key}}" },
  { key: "Content-Type", value: "application/json" },
];

function url(path, query) {
  const [p] = path.split("?");
  return {
    raw: `{{base_url}}/${path}`,
    host: ["{{base_url}}"],
    path: p.split("/"),
    ...(query ? { query } : {}),
  };
}

function jsonBody(body) {
  return { mode: "raw", raw: JSON.stringify(body, null, 2), options: { raw: { language: "json" } } };
}

function script(listen, lines) {
  return { listen, script: { type: "text/javascript", exec: lines } };
}

const MUTATION_TEST = [
  "// Una mutación devuelve una clave por paso. Si todas vienen en null, la función rechazó el cambio (sin",
  "// permiso o datos inválidos); con varias claves, alguna puede ser null aunque haya funcionado.",
  "if (pm.response.code < 400) {",
  "  const data = pm.response.json() || {};",
  "  const keys = Object.keys(data);",
  '  pm.test("La función aceptó el cambio", () => pm.expect(keys.length && keys.every((k) => data[k] === null), "todas las claves en null: " + keys.join(", ")).to.not.be.ok);',
  "}",
];

function rpcRequest(fn) {
  const { file, access, comment } = sqlFns.get(fn);
  const { op, kind, varsType } = ops.get(fn);
  let body = {};
  let optional = [];
  if (varsType) {
    const raw = interfaceBody(varsType);
    if (raw === null) errors.push(`${varsType} no está en api/types.ts`);
    else {
      const fields = parseFields(raw);
      body = exampleObject(fields, op, sqlFns.get(fn).readsUserId);
      for (const [key, value] of Object.entries(OVERRIDES[fn] || {})) {
        if (!fields.some((f) => f.name === key)) errors.push(`OVERRIDES.${fn}.${key} no es un campo de ${varsType}`);
        body[key] = value;
      }
      optional = fields.filter((f) => f.optional && f.name !== "userId" && !(f.name in body)).map((f) => `\`${f.name}\``);
    }
  }
  const description = [
    comment,
    "",
    `- Operación: \`${op}\` (${kind === "mutation" ? "mutación" : "lectura"})`,
    `- SQL: \`db/migrations/${file}\``,
    `- Acceso: ${access === "PUBLIC" ? "público (funciona sin sesión)" : "requiere sesión (haz «Login» antes)"}`,
    ...(optional.length ? [`- Campos opcionales (no incluidos): ${optional.join(", ")}`] : []),
    ...(NOTES[fn] ? ["", NOTES[fn]] : []),
    ...(kind === "mutation" ? ["", "Si todas las claves de la respuesta vienen en `null`, la función rechazó el cambio (sin permiso o datos inválidos)."] : []),
  ]
    .filter((line, i) => i > 0 || line)
    .join("\n");
  return {
    name: fn,
    request: {
      method: "POST",
      header: JSON_HEADERS,
      url: url(`rest/v1/rpc/${fn}`),
      body: jsonBody({ p: body }),
      description,
    },
    ...(kind === "mutation" ? { event: [script("test", MUTATION_TEST)] } : {}),
  };
}

function folder(name, items, description) {
  return { name, ...(description ? { description } : {}), item: items };
}

// ---------- 0. Sesión ----------

const sesion = folder(
  "0. Sesión (GoTrue)",
  [
    {
      name: "Login",
      request: {
        auth: { type: "noauth" },
        method: "POST",
        header: JSON_HEADERS,
        url: url("auth/v1/token?grant_type=password", [{ key: "grant_type", value: "password" }]),
        body: jsonBody({ email: "{{email}}", password: "{{password}}" }),
        description: "Inicia sesión con `{{email}}` / `{{password}}` del entorno y guarda el `access_token` en `{{token}}`.",
      },
      event: [
        script("test", [
          'pm.test("Sesión iniciada", () => pm.response.to.have.status(200));',
          "const s = pm.response.json();",
          "if (s.access_token) {",
          '  pm.environment.set("token", s.access_token);',
          '  pm.environment.set("refresh_token", s.refresh_token);',
          '  console.log("Sesión de " + s.user.email + " guardada en {{token}}");',
          "}",
        ]),
      ],
    },
    {
      name: "Renovar sesión",
      request: {
        auth: { type: "noauth" },
        method: "POST",
        header: JSON_HEADERS,
        url: url("auth/v1/token?grant_type=refresh_token", [{ key: "grant_type", value: "refresh_token" }]),
        body: jsonBody({ refresh_token: "{{refresh_token}}" }),
        description: "Cambia `{{refresh_token}}` por un token nuevo cuando el anterior caducó (1 hora).",
      },
      event: [
        script("test", [
          "const s = pm.response.json();",
          "if (s.access_token) {",
          '  pm.environment.set("token", s.access_token);',
          '  pm.environment.set("refresh_token", s.refresh_token);',
          "}",
        ]),
      ],
    },
    {
      name: "Usuario actual",
      request: { method: "GET", header: [JSON_HEADERS[0]], url: url("auth/v1/user"), description: "Datos del usuario de `{{token}}`." },
    },
    {
      name: "Registro (requiere invitación)",
      request: {
        auth: { type: "noauth" },
        method: "POST",
        header: JSON_HEADERS,
        url: url("auth/v1/signup"),
        body: jsonBody({ email: "nuevo@demo.local", password: "demo1234" }),
        description:
          "Crea una cuenta. La base rechaza el registro si el correo no tiene una invitación pendiente (club, superadmin o registro), salvo que todavía no haya superadmin.",
      },
    },
    {
      name: "Recuperar contraseña",
      request: {
        auth: { type: "noauth" },
        method: "POST",
        header: JSON_HEADERS,
        url: url("auth/v1/recover"),
        body: jsonBody({ email: "{{email}}" }),
        description: "Envía el correo de restablecer contraseña (si el servidor tiene configurado Gmail).",
      },
    },
    {
      name: "Cerrar sesión",
      request: { method: "POST", header: [JSON_HEADERS[0]], url: url("auth/v1/logout"), description: "Cierra la sesión y vacía `{{token}}`." },
      event: [script("test", ['pm.environment.unset("token");', 'pm.environment.unset("refresh_token");'])],
    },
  ],
  "Inicia sesión primero con **Login**: guarda el token en el entorno y todas las peticiones lo usan. Sin token, se usa la `anon_key` (solo funcionan las funciones públicas).",
);

// ---------- 1-5. Funciones RPC ----------

const byFile = new Map(Object.keys(SQL_FILES).map((f) => [f, { query: [], mutation: [] }]));
for (const fn of [...sqlFns.keys()].sort()) {
  if (!ops.has(fn)) continue;
  byFile.get(sqlFns.get(fn).file)[ops.get(fn).kind].push(rpcRequest(fn));
}
const rpcFolders = [...byFile].map(([file, { query, mutation }]) =>
  folder(
    SQL_FILES[file],
    [folder("Lecturas", query), folder("Mutaciones", mutation)].filter((f) => f.item.length),
    `Funciones de \`db/migrations/${file}\`. Todas son \`POST /rest/v1/rpc/<función>\` con los parámetros dentro de \`p\`. Los IDs de ejemplo son de la base demo (variables de la colección).`,
  ),
);

// ---------- 6. Imágenes ----------

const imagenes = folder(
  "6. Imágenes (Storage)",
  [
    {
      name: "Subir imagen",
      request: {
        method: "POST",
        header: [
          { key: "Content-Type", value: "image/png" },
          { key: "x-upsert", value: "true" },
        ],
        url: url("storage/v1/object/media/{{ruta_imagen}}"),
        body: { mode: "file", file: { src: "" } },
        description:
          "Sube a `media/{{ruta_imagen}}`. En **Body → binary** elige un archivo jpeg, png o webp (máx. 5 MB) y ajusta `Content-Type`. Requiere sesión y la ruta debe empezar por `platform/` o `clubs/`.",
      },
    },
    {
      name: "Ver imagen (pública)",
      request: {
        auth: { type: "noauth" },
        method: "GET",
        header: [],
        url: url("storage/v1/object/public/media/{{ruta_imagen}}"),
        description: "URL pública: no necesita sesión ni apikey.",
      },
    },
    {
      name: "Borrar imagen",
      request: { method: "DELETE", header: [], url: url("storage/v1/object/media/{{ruta_imagen}}"), description: "Requiere sesión." },
    },
  ],
  "Bucket `media` de Supabase Storage. La ruta del archivo está en la variable `ruta_imagen`.",
);

// ---------- 7. Correo (api/) ----------

const FN_EXAMPLES = {
  sendClubInvite: {
    body: { clubId: "{{club_id}}", email: "prueba@demo.local", role: "dt", token: "" },
    description:
      "Envía la invitación a un club. `token` es el de una invitación ya creada en la base (la crea la mutación de invitar miembro); `role`: admin, dt, prensa o tesorero. Solo el Presidente del club o el superadmin.",
  },
  reviewTeamApplication: {
    body: { applicationId: "", action: "approve" },
    description: "Aprueba o rechaza una solicitud de equipo (`action`: approve | reject) y avisa al capitán. Solo superadmin.",
  },
  sendPlatformAdminInvite: {
    body: { email: "prueba@demo.local", mailOnly: true },
    description: "Envía la invitación a ser superadmin. Solo superadmin.",
  },
  sendCourtBookingNotice: {
    body: {
      to: "prueba@demo.local",
      kind: "created",
      dateLabel: "Sábado 10 de octubre",
      note: "",
      paymentLabel: "",
      slots: [{ courtName: "Cancha Norte", startLabel: "18:00", endLabel: "19:00", durationLabel: "1 h", priceLabel: "$300" }],
    },
    description: "Avisa una renta de cancha (`kind`: created | updated | cancelled). Solo envía el correo; no guarda nada.",
  },
  sendMatchScheduleNotice: {
    body: { matchId: "{{match_id}}" },
    description: "Avisa a los Presidentes de ambos clubes el horario del partido. Con `reason: \"courts\"` avisa que se quitó por cambio de canchas.",
  },
  sendTournamentEnrollmentNotice: {
    body: { tournamentId: "{{tournament_id}}", clubIds: ["{{club_id}}"] },
    description: "Avisa a los clubes que quedaron inscritos en un torneo.",
  },
};

for (const fn of [...Object.keys(OVERRIDES), ...Object.keys(NOTES)]) {
  if (!sqlFns.has(fn)) errors.push(`OVERRIDES/NOTES nombran ${fn}, que ya no existe`);
}

const apiFns = [...read("api/src/fns/index.ts").matchAll(/^\s{2}(\w+),$/gm)].map((m) => m[1]);
for (const name of apiFns) if (!FN_EXAMPLES[name]) errors.push(`api/src/fns: falta el ejemplo de ${name} en FN_EXAMPLES`);
for (const name of Object.keys(FN_EXAMPLES)) if (!apiFns.includes(name)) errors.push(`FN_EXAMPLES.${name} ya no existe en api/src/fns`);

const correo = folder(
  "7. Correo (api/)",
  [
    ...apiFns.filter((n) => FN_EXAMPLES[n]).map((name) => ({
      name,
      request: {
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        url: url(`fn/${name}`),
        body: jsonBody(FN_EXAMPLES[name].body),
        description: `${FN_EXAMPLES[name].description}\n\nSin \`GMAIL_USER\`/\`GMAIL_APP_PASSWORD\` en el servidor responde \`mailed: false\`. Los errores son \`{ code, message }\`.`,
      },
    })),
    {
      name: "health (solo local)",
      request: {
        auth: { type: "noauth" },
        method: "GET",
        header: [],
        url: { raw: "{{api_directa}}/health", host: ["{{api_directa}}"], path: ["health"] },
        description: "La API directa en el puerto 8787, sin pasar por Kong. En el servidor no está expuesta.",
      },
    },
  ],
  "API propia (Fastify) en `/fn/<nombre>`. Todas requieren sesión: `Authorization: Bearer {{token}}`.",
);

if (errors.length) {
  console.error("No se generó la colección:\n- " + errors.join("\n- "));
  process.exit(1);
}

// ---------- Colección y entornos ----------

const collection = {
  info: {
    _postman_id: "6f1c2a7e-3b9d-4c55-9a0e-5c1b0a7f0e21",
    name: "Clubs Platform",
    description: [
      "Colección generada por `scripts/postman/generarColeccion.mjs` (`npm run postman:collection`): no la edites a mano, regenérala.",
      "",
      "1. Importa también un entorno de `postman/` (local o servidor) y selecciónalo.",
      "2. Pega la `anon_key` en el entorno: `ANON_KEY` de `docker/.env` (o `VITE_SUPABASE_ANON_KEY` de `.env`).",
      "3. Ejecuta **0. Sesión → Login**. El token se guarda solo y lo usan todas las peticiones.",
      "",
      "Las funciones RPC reciben sus parámetros dentro de `p`. `{{hoy}}` y `{{ahora}}` se calculan antes de cada petición.",
    ].join("\n"),
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: { type: "bearer", bearer: [{ key: "token", value: "{{bearer}}", type: "string" }] },
  event: [
    script("prerequest", [
      "// Con sesión se usa el token; sin ella, la anon_key (rol anon: solo funciones públicas).",
      'const token = pm.environment.get("token");',
      'const anon = pm.environment.get("anon_key");',
      'if (!anon) console.warn("Falta anon_key en el entorno: copia ANON_KEY de docker/.env.");',
      'pm.variables.set("bearer", token || anon || "");',
      "// Fecha de hoy en la zona de la liga (YYYY-MM-DD; Hermosillo es UTC-7 todo el año, y el sandbox",
      "// de Postman no trae Intl) y el momento actual en ISO.",
      'pm.variables.set("hoy", new Date(Date.now() - 7 * 3600 * 1000).toISOString().slice(0, 10));',
      'pm.variables.set("ahora", new Date().toISOString());',
      'pm.variables.set("en_un_mes", new Date(Date.now() + (30 * 24 - 7) * 3600 * 1000).toISOString().slice(0, 10));',
      "// Seis letras distintas en cada envío (los nombres de persona no admiten dígitos).",
      'pm.variables.set("sufijo", String(Date.now()).slice(-6).replace(/[0-9]/g, (d) => "abcdefghij"[d]));',
      'pm.variables.set("anio_siguiente", String(new Date().getFullYear() + 1));',
    ]),
    script("test", [
      'pm.test("Responde sin error HTTP", () => pm.expect(pm.response.code).to.be.below(400));',
      'if (pm.response.code === 401 && pm.environment.get("token")) {',
      '  console.warn("El token caducó o no es válido: ejecuta «Login» o «Renovar sesión».");',
      "}",
    ]),
  ],
  variable: [
    ...Object.entries(DEMO).map(([key, value]) => ({ key, value, type: "string" })),
    { key: "ruta_imagen", value: "platform/postman/prueba.png", type: "string" },
  ],
  item: [sesion, ...rpcFolders, imagenes, correo],
};

function environment(id, name, values) {
  return {
    id,
    name,
    values: values.map(([key, value, type = "default"]) => ({ key, value, type, enabled: true })),
    _postman_variable_scope: "environment",
  };
}

const local = environment("0b7c3c1e-6d2a-4f3e-8a51-2f0c1d9e7a01", "Clubs Platform · Local", [
  ["base_url", "http://localhost:8000"],
  ["api_directa", "http://localhost:8787"],
  ["anon_key", "", "secret"],
  ["email", "admin@demo.local"],
  ["password", "demo1234", "secret"],
  ["token", "", "secret"],
  ["refresh_token", "", "secret"],
]);

const servidor = environment("0b7c3c1e-6d2a-4f3e-8a51-2f0c1d9e7a02", "Clubs Platform · Servidor de pruebas", [
  ["base_url", SERVER_URL],
  ["anon_key", "", "secret"],
  ["email", ""],
  ["password", "", "secret"],
  ["token", "", "secret"],
  ["refresh_token", "", "secret"],
]);

mkdirSync(OUT, { recursive: true });
const write = (file, data) => writeFileSync(join(OUT, file), JSON.stringify(data, null, 2) + "\n");
write("clubs-platform.postman_collection.json", collection);
write("local.postman_environment.json", local);
write("servidor.postman_environment.json", servidor);

const rpcCount = rpcFolders.reduce((n, f) => n + f.item.reduce((m, g) => m + g.item.length, 0), 0);
console.log(`Colección generada en postman/: ${rpcCount} funciones RPC, ${apiFns.length} endpoints de correo, sesión e imágenes.`);
