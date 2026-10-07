// Genera los datos de prueba (dummy) de la plataforma como SQL plano para PostgreSQL.
//
//   node scripts/demo/generarDemo.mjs
//
// Escribe dos archivos junto a este script:
//   - demo-seed.sql: borra los datos dummy anteriores y vuelve a insertarlos, todo en una transacción.
//   - demo-cleanup.sql: solo los borra.
//
// Todas las filas llevan ids con el prefijo «dummy-» (o UUID deterministas en las tablas con id UUID),
// así que la limpieza no toca datos reales. Las fechas se calculan respecto al día en que se genera
// (hora de Sonora): genera el SQL el mismo día que lo ejecutes para que la jornada actual, el partido
// en vivo de hoy y los anuncios cuadren. Para otra fecha base: node scripts/demo/generarDemo.mjs 2026-10-05
// No crea usuarios ni miembros de club, ni toca platform_settings ni platform_hero_images.

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = dirname(fileURLToPath(import.meta.url));
const P = "dummy-";
const TZ = "America/Hermosillo";

// ---------- utilidades ----------

let rngState = 20261005;
function rand() {
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (list) => list[Math.floor(rand() * list.length)];
const chance = (p) => rand() < p;
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function weighted(items, weightOf) {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  let r = rand() * total;
  for (const item of items) {
    r -= weightOf(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
function poisson(lambda) {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > limit);
  return Math.min(k - 1, 7);
}

/** UUID determinista: el mismo texto siempre da el mismo id, así la limpieza los encuentra. */
function uuid(key) {
  const h = createHash("sha1").update(`clubs-platform-dummy:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const raw = (sql) => ({ raw: sql });

// Fechas en hora de Sonora (UTC-7 todo el año, sin horario de verano).
const TODAY = process.argv[2] ?? new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
if (!/^\d{4}-\d{2}-\d{2}$/.test(TODAY)) throw new Error(`Fecha inválida: ${TODAY} (usa AAAA-MM-DD)`);
const TODAY_MS = Date.parse(`${TODAY}T00:00:00Z`);
const DAY_MS = 86400000;
const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);
const YEAR = Number(TODAY.slice(0, 4));
const ISO_WEEKDAY = new Date(TODAY_MS).getUTCDay() || 7;
/** Fecha relativa a hoy. */
const day = (offset) => isoDate(TODAY_MS + offset * DAY_MS);
/** Fecha relativa al domingo de esta semana (hoy, si es domingo). */
const sunday = (offset) => day(7 - ISO_WEEKDAY + offset);
/** Fecha relativa al 1 de enero del año en curso. */
const yearDay = (offset) => isoDate(Date.parse(`${YEAR}-01-01T00:00:00Z`) + offset * DAY_MS);
/** Marca de tiempo relativa a hoy, a la hora local HH:mm. */
const stamp = (offset, time = "12:00") => `${day(offset)} ${time}:00-07`;
const NOW = raw("CURRENT_TIMESTAMP");

function lit(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object" && "raw" in value) return value.raw;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "object") return `${quote(JSON.stringify(value))}::jsonb`;
  return quote(String(value));
}
function quote(text) {
  return `'${text.replace(/'/g, "''")}'`;
}

const statements = [];
function insert(table, rows) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const values = chunk.map((row) => `  (${columns.map((c) => lit(row[c])).join(", ")})`);
    statements.push(`INSERT INTO ${table} (${columns.join(", ")}) VALUES\n${values.join(",\n")};`);
  }
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// ---------- catálogos reutilizables ----------
// Localidades, categorías y temporadas se reutilizan si ya existe una con el mismo nombre;
// solo se crean (con id dummy-) si faltan, para no duplicar opciones en los selectores reales.

const LOCALITIES = [
  { key: "guaymas", name: "Guaymas, Sonora" },
  { key: "empalme", name: "Empalme, Sonora" },
  { key: "sancarlos", name: "San Carlos, Sonora" },
];
const CATEGORIES = [
  { key: "primera", name: "Primera Fuerza", sortOrder: 1 },
  { key: "veteranos", name: "Veteranos", sortOrder: 2 },
  { key: "femenil", name: "Femenil", sortOrder: 3 },
];
const localityRef = (key) => {
  const { name } = LOCALITIES.find((l) => l.key === key);
  return raw(`(SELECT id FROM localities WHERE lower(name) = lower(${quote(name)}) ORDER BY id LIKE '${P}%', id LIMIT 1)`);
};
const categoryRef = (key) => {
  const { name } = CATEGORIES.find((c) => c.key === key);
  return raw(`(SELECT id FROM categories WHERE lower(name) = lower(${quote(name)}) ORDER BY id LIKE '${P}%', sort_order LIMIT 1)`);
};
/** offset 0 = temporada del año en curso, -1 = la anterior. */
const seasonName = (offset) => quote(String(YEAR + offset));
const seasonRef = (offset) =>
  raw(`(SELECT id FROM seasons WHERE name = ${seasonName(offset)} ORDER BY id LIKE '${P}%', id LIMIT 1)`);

function catalogInserts() {
  for (const l of LOCALITIES) {
    statements.push(
      `INSERT INTO localities (id, name, created_at)\n  SELECT ${quote(`${P}loc-${l.key}`)}, ${quote(l.name)}, CURRENT_TIMESTAMP\n` +
        `  WHERE NOT EXISTS (SELECT 1 FROM localities WHERE lower(name) = lower(${quote(l.name)}));`,
    );
  }
  for (const c of CATEGORIES) {
    statements.push(
      `INSERT INTO categories (id, name, sort_order)\n  SELECT ${quote(`${P}cat-${c.key}`)}, ${quote(c.name)}, ${c.sortOrder}\n` +
        `  WHERE NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = lower(${quote(c.name)}));`,
    );
  }
  for (const [offset, key, active] of [[0, "actual", true], [-1, "anterior", false]]) {
    statements.push(
      `INSERT INTO seasons (id, name, start_date, end_date, active)\n` +
        `  SELECT ${quote(`${P}season-${key}`)}, ${seasonName(offset)}, '${YEAR + offset}-01-01', '${YEAR + offset}-12-31', ` +
        `${active ? "TRUE" : "FALSE"}\n` +
        `  WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE name = ${seasonName(offset)});`,
    );
  }
}

// ---------- canchas ----------

const COURTS = [
  { key: "miramar", name: "Campo Miramar", description: "Pasto sintético", location: "Col. Miramar, Guaymas", rate: 450, football: true },
  { key: "bahia", name: "Campo Bahía", description: "Pasto natural", location: "Col. Centro, Guaymas", rate: 600, football: true },
  { key: "norte", name: "Campo Norte", description: "Pasto sintético", location: "Col. Las Playas, Empalme", rate: 400, football: true },
  { key: "techada", name: "Cancha Techada", description: "Duela", location: "Col. San Vicente, Guaymas", rate: 350, football: false },
].map((c, i) => ({ ...c, id: `${P}court-${c.key}`, sortOrder: 900 + i }));
const FOOTBALL_COURTS = COURTS.filter((c) => c.football);

// ---------- clubes y jugadores ----------

const IMAGES = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1600&q=80",
];

const CLUBS = [
  { key: "halcones", name: "Halcones FC", locality: "guaymas", location: "Col. Miramar" },
  { key: "bahia", name: "Deportivo Bahía", locality: "guaymas", location: "Col. Centro" },
  { key: "miramar", name: "Atlético Miramar", locality: "sancarlos", location: "Sector Bahía" },
  { key: "tiburones", name: "Tiburones del Puerto", locality: "guaymas", location: "Col. Punta Arena" },
  { key: "sanvicente", name: "Real San Vicente", locality: "guaymas", location: "Col. San Vicente" },
  { key: "pescadores", name: "Club Pescadores", locality: "empalme", location: "Col. Las Playas" },
  { key: "union", name: "Unión Empalme", locality: "empalme", location: "Col. Moderna" },
  { key: "leones", name: "Leones del Cerro", locality: "sancarlos", location: "Col. Cerro Tetakawi" },
].map((c, i) => ({
  ...c,
  id: `${P}club-${c.key}`,
  slug: `${c.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-demo`,
  strength: [1.45, 1.3, 1.2, 1.1, 1.0, 0.95, 0.85, 0.8][i],
  phone: `622${String(1000000 + i * 1234567).slice(0, 7)}`,
}));

const FIRST_NAMES = [
  "Juan", "Carlos", "Luis", "Miguel", "José", "Jorge", "Ricardo", "Fernando", "Alejandro", "Daniel",
  "Eduardo", "Francisco", "Javier", "Manuel", "Óscar", "Raúl", "Sergio", "Víctor", "Andrés", "Iván",
  "Héctor", "Adrián", "Arturo", "Ernesto", "Gerardo", "Hugo", "Israel", "Jesús", "Mario", "Omar",
  "Pablo", "Ramón", "Rubén", "Saúl", "Tomás", "Uriel", "Diego", "Emilio", "Gael", "Mateo",
];
const LAST_NAMES = [
  "García", "Hernández", "López", "Martínez", "González", "Pérez", "Rodríguez", "Sánchez", "Ramírez", "Flores",
  "Torres", "Rivera", "Gómez", "Díaz", "Cruz", "Morales", "Reyes", "Ortiz", "Gutiérrez", "Ruiz",
  "Mendoza", "Aguilar", "Castillo", "Jiménez", "Moreno", "Romero", "Herrera", "Medina", "Vargas", "Castro",
  "Valenzuela", "Ibarra", "Escalante", "Durazo", "Félix", "Encinas", "Bojórquez", "Quiroz", "Molina", "Tapia",
];
const ROSTER = [
  ...Array(2).fill("Portero"),
  ...Array(5).fill("Defensa"),
  ...Array(5).fill("Medio"),
  ...Array(4).fill("Delantero"),
];
const VARIANTS = { Portero: [""], Defensa: ["", "Central", "Lateral"], Medio: ["", "Contención", "Volante"], Delantero: ["", "Extremo", "Centro delantero"] };

const usedNames = new Set();
function personName() {
  for (;;) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
}

for (const club of CLUBS) {
  const numbers = shuffle(Array.from({ length: 30 }, (_, i) => i + 1));
  club.players = ROSTER.map((position, i) => ({
    id: `${club.id}-p${String(i + 1).padStart(2, "0")}`,
    name: personName(),
    position,
    variant: pick(VARIANTS[position]),
    shirt: position === "Portero" ? String(i === 0 ? 1 : 12) : String(numbers.filter((n) => n !== 1 && n !== 12)[i]),
    birth: `${int(1984, 2006)}-${String(int(1, 12)).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}`,
  }));
  club.coach = { id: `${club.id}-dt`, name: personName() };
}

// ---------- alineaciones ----------

const LINEUP_SHAPES = {
  FUT_11: { mode: "Fut-11", formation: "4-4-2", slots: { gk: "Portero", df1: "Defensa", df2: "Defensa", df3: "Defensa", df4: "Defensa", md1: "Medio", md2: "Medio", md3: "Medio", md4: "Medio", fw1: "Delantero", fw2: "Delantero" } },
  FUT_7: { mode: "Fut-7", formation: "2-3-1", slots: { gk: "Portero", df1: "Defensa", df2: "Defensa", md1: "Medio", md2: "Medio", md3: "Medio", fw1: "Delantero" } },
};

/** Elige titulares por posición y algunos suplentes; devuelve la alineación y los convocados. */
function buildLineup(club, footballType, subs) {
  const shape = LINEUP_SHAPES[footballType];
  const pool = shuffle(club.players);
  const positions = {};
  const starters = [];
  for (const [slot, position] of Object.entries(shape.slots)) {
    const player = pool.find((p) => p.position === position && !starters.includes(p));
    positions[slot] = player.id;
    starters.push(player);
  }
  const bench = pool.filter((p) => !starters.includes(p)).slice(0, subs);
  return {
    lineup: { mode: shape.mode, formation: shape.formation, positions },
    goalkeeper: starters[0],
    attendees: [...starters, ...bench],
  };
}

// ---------- torneos y partidos ----------

/** Todos contra todos (método del círculo), igual que src/domains/competition/fixtures.ts: clubes ordenados por id. */
function roundRobin(teams, legs) {
  const sorted = [...teams].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const list = sorted.length % 2 ? [...sorted, null] : sorted;
  const n = list.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a && b) pairs.push((r + i) % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    list.splice(1, 0, list.pop());
  }
  if (legs === 2) return [...rounds, ...rounds.map((pairs) => pairs.map(([h, a]) => [a, h]))];
  return rounds;
}

const TOURNAMENTS = [
  {
    key: "apertura",
    name: "Torneo Apertura",
    category: "primera",
    season: 0,
    status: "ACTIVE",
    footballType: "FUT_11",
    duration: 90,
    legs: 2,
    prize: "$25,000 MXN",
    clubs: CLUBS,
    // 8 jornadas jugadas en domingos pasados, la 9 este domingo, la 10 el siguiente y el resto sin programar.
    startDate: sunday(-56),
    plan: (round) => (round <= 8 ? { date: sunday(-7 * (9 - round)), played: true } : round <= 10 ? { date: sunday(7 * (round - 9)) } : null),
    times: ["09:00", "11:00", "13:00", "15:00"],
  },
  {
    key: "veteranos",
    name: "Copa Veteranos",
    category: "veteranos",
    season: 0,
    status: "ACTIVE",
    footballType: "FUT_7",
    duration: 60,
    legs: 1,
    prize: "Trofeo + uniformes",
    clubs: CLUBS.slice(0, 6),
    // Jornadas 1-3 jugadas; en la 4 hay un partido ayer, uno hoy a las 20:00 (en vivo a esa hora) y uno pasado mañana.
    startDate: day(-29),
    plan: (round, index) => {
      if (round <= 3) return { date: day(-29 + 7 * (round - 1)), played: true };
      if (round === 4) return [{ date: day(-1), played: true, time: "20:00" }, { date: day(0), time: "20:00" }, { date: day(2), time: "19:00" }][index];
      return null;
    },
    times: ["18:00", "19:00", "20:00"],
  },
  {
    key: "clausura-anterior",
    name: "Torneo Clausura",
    category: "primera",
    season: -1,
    status: "FINISHED",
    footballType: "FUT_11",
    duration: 90,
    legs: 1,
    prize: "$20,000 MXN",
    clubs: CLUBS.slice(2),
    startDate: yearDay(-120),
    plan: (round) => ({ date: yearDay(-120 + 7 * (round - 1)), played: true }),
    times: ["10:00", "12:00", "16:00"],
  },
  {
    key: "femenil",
    name: "Copa Femenil",
    category: "femenil",
    season: 0,
    status: "UPCOMING",
    footballType: "FUT_7",
    duration: 60,
    legs: 2,
    prize: "",
    clubs: [CLUBS[0], CLUBS[1], CLUBS[4], CLUBS[7]],
    startDate: sunday(21),
    plan: () => null,
    times: [],
  },
].map((t) => ({ ...t, id: `${P}tour-${t.key}` }));

const rows = {
  tournament_groups: [], tournaments: [], tournament_clubs: [], tournament_podium: [],
  matches: [], match_club_reports: [], match_attendees: [], match_goals: [], match_cards: [], match_goalkeepers: [],
  court_holds: [],
};

for (const t of TOURNAMENTS) {
  rows.tournament_groups.push({ id: `${P}group-${t.key}`, label: t.name });
  rows.tournaments.push({
    id: t.id, name: t.name, season_id: seasonRef(t.season), category_id: categoryRef(t.category), group_id: `${P}group-${t.key}`,
    status: t.status, legs: t.legs, football_type: t.footballType, duration_minutes: t.duration, start_date: t.startDate,
    prize: t.prize, created_at: NOW,
  });
  for (const club of t.clubs) rows.tournament_clubs.push({ tournament_id: t.id, club_id: club.id, created_at: NOW });

  const table = new Map(t.clubs.map((c) => [c.id, { club: c, pts: 0, gf: 0, gc: 0 }]));
  const walkoverRound = t.key === "apertura" ? 5 : 0;

  roundRobin(t.clubs, t.legs).forEach((pairs, r) => {
    const round = r + 1;
    pairs.forEach(([home, away], index) => {
      const id = `${t.id}-j${String(round).padStart(2, "0")}-${index + 1}`;
      const slot = t.plan(round, index);
      const court = slot ? FOOTBALL_COURTS[index % FOOTBALL_COURTS.length] : null;
      const time = slot ? slot.time ?? t.times[index % t.times.length] : null;
      const match = {
        id, tournament_id: t.id, round_label: String(round), round_number: round, home_club_id: home.id, away_club_id: away.id,
        match_date: slot ? slot.date : null, start_time: time, venue: court ? court.name : "", court_id: court ? court.id : null,
        status: !slot ? "UNSCHEDULED" : slot.played ? "PLAYED" : "SCHEDULED",
        home_score: null, away_score: null, penalties_home: null, penalties_away: null, walkover: false,
        schedule_notice_key: null, created_at: NOW, updated_at: slot?.played ? NOW : null,
      };
      rows.matches.push(match);
      if (court) {
        rows.court_holds.push({
          id: `match_${id}`, court_id: court.id, hold_date: slot.date, start_time: time, end_time: addMinutes(time, t.duration),
          source: "MATCH", match_id: id, note: "", guest_email: "",
        });
      }
      if (!slot?.played) return;

      if (round === walkoverRound && index === 0) {
        Object.assign(match, { home_score: 3, away_score: 0, walkover: true });
      } else {
        Object.assign(match, playMatch(t, match, home, away));
      }
      const h = table.get(home.id);
      const a = table.get(away.id);
      h.gf += match.home_score; h.gc += match.away_score; a.gf += match.away_score; a.gc += match.home_score;
      if (match.home_score > match.away_score) h.pts += 3;
      else if (match.home_score < match.away_score) a.pts += 3;
      else { h.pts += 1; a.pts += 1; }
    });
  });

  if (t.status === "FINISHED") {
    // Mismo desempate que la vista TournamentStanding: puntos, diferencia, goles a favor, id del club.
    const ranking = [...table.values()].sort(
      (x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf || (x.club.id < y.club.id ? -1 : 1),
    );
    ranking.slice(0, 3).forEach((s, i) => rows.tournament_podium.push({ tournament_id: t.id, place: i + 1, club_id: s.club.id }));
  }
}

/** Simula un partido jugado: marcador, goles con asistencias, tarjetas, porteros, convocados y MVP. */
function playMatch(t, match, home, away) {
  const sides = [
    { club: home, rival: away, goals: poisson(1.25 * (home.strength / away.strength) + 0.15) },
    { club: away, rival: home, goals: poisson(1.1 * (away.strength / home.strength)) },
  ];
  for (const side of sides) Object.assign(side, buildLineup(side.club, t.footballType, t.footballType === "FUT_11" ? 4 : 3));

  for (const [i, side] of sides.entries()) {
    const rival = sides[1 - i];
    const minutes = Array.from({ length: side.goals }, () => int(1, t.duration)).sort((a, b) => a - b);
    side.scorers = [];
    minutes.forEach((minute, n) => {
      const field = side.attendees.filter((p) => p.position !== "Portero");
      const goal = {
        id: uuid(`${match.id}:goal:${side.club.id}:${n}`), match_id: match.id, club_id: side.club.id, sort_order: n + 1,
        scorer_id: null, scorer_name: "", assist_id: null, assist_name: "", is_penalty: false, is_own_goal: false, minute,
      };
      if (chance(0.04)) {
        const scorer = pick(rival.attendees.filter((p) => p.position === "Defensa"));
        Object.assign(goal, { scorer_id: scorer.id, scorer_name: scorer.name, is_own_goal: true });
      } else {
        const scorer = weighted(field, (p) => ({ Delantero: 6, Medio: 3, Defensa: 1 })[p.position]);
        Object.assign(goal, { scorer_id: scorer.id, scorer_name: scorer.name });
        side.scorers.push(scorer);
        if (chance(0.08)) goal.is_penalty = true;
        else if (chance(0.65)) {
          const assist = pick(field.filter((p) => p !== scorer));
          Object.assign(goal, { assist_id: assist.id, assist_name: assist.name });
        }
      }
      rows.match_goals.push(goal);
    });

    const cards = int(0, 3);
    for (let n = 0; n < cards + (chance(0.1) ? 1 : 0); n++) {
      const player = pick(side.attendees);
      rows.match_cards.push({
        id: uuid(`${match.id}:card:${side.club.id}:${n}`), match_id: match.id, club_id: side.club.id, player_id: player.id,
        player_name: player.name, color: n >= cards ? "RED" : "YELLOW", minute: int(5, t.duration),
      });
    }
    rows.match_goalkeepers.push({
      match_id: match.id, club_id: side.club.id, player_id: side.goalkeeper.id, conceded: rival.goals, saves: int(1, 7),
    });
    rows.match_attendees.push([match.id, side.club.id, side.attendees.map((p) => p.id)]);
  }
  for (const side of sides) {
    const mvp = side.scorers[0] ?? pick(side.attendees);
    rows.match_club_reports.push({ match_id: match.id, club_id: side.club.id, mvp_id: mvp.id, lineup: side.lineup });
  }
  return { home_score: sides[0].goals, away_score: sides[1].goals };
}

// ---------- vida de cada club ----------

const club_rows = {
  clubs: [], club_hero_images: [], club_availability_windows: [], club_default_lineups: [], players: [],
  club_events: [], club_event_attendees: [], club_event_goals: [], club_event_cards: [], club_event_goalkeepers: [], club_event_photos: [],
  transactions: [], financial_goals: [], goal_contributions: [], inventory_items: [], albums: [], gallery_photos: [],
};

const RIVALS = ["Selección Empalme", "Veteranos de Cajeme", "Club Náutico", "Deportivo Bacochibampo", "Ferrocarrileros FC"];
const ROUTINE = [
  { type: "phase", id: "1", title: "Calentamiento", exercises: [
    { id: "2", name: "Trote y movilidad articular", duration: "10", link: "" },
    { id: "3", name: "Rondo 5 contra 2", duration: "10", link: "" },
  ] },
  { type: "hydration", id: "4", duration: "3" },
  { type: "phase", id: "5", title: "Trabajo táctico", exercises: [
    { id: "6", name: "Salida desde atrás", duration: "20", link: "" },
    { id: "7", name: "Partido reducido 7 contra 7", duration: "25", link: "" },
  ] },
];

CLUBS.forEach((club, ci) => {
  club_rows.clubs.push({
    id: club.id, slug: club.slug, name: club.name,
    description: `${club.name} es un club de la liga amateur de Sonora. Entrenamos entre semana y jugamos los domingos. Datos de prueba.`,
    locality_id: localityRef(club.locality), location: club.location, president_phone: club.phone, logo_url: null,
    active: true, disabled_reason: null, created_by_id: null, created_at: stamp(-200 + ci), deleted_at: null,
  });
  club_rows.club_hero_images.push({ id: uuid(`${club.id}:hero:0`), club_id: club.id, position: 0, url: IMAGES[ci % IMAGES.length] });
  [[3, "19:00", "22:00"], [6, "08:00", "14:00"], [7, "08:00", "20:00"]].forEach(([weekday, start, end]) => {
    club_rows.club_availability_windows.push({
      id: uuid(`${club.id}:window:${weekday}`), club_id: club.id, weekday, start_time: start, end_time: end, updated_at: NOW, updated_by_id: null,
    });
  });
  club_rows.club_default_lineups.push({
    club_id: club.id, mode: "Fut-11", formation: "4-4-2", positions: buildLineup(club, "FUT_11", 0).lineup,
  });

  for (const p of club.players) {
    club_rows.players.push({
      id: p.id, club_id: club.id, name: p.name, shirt_number: p.shirt, position: p.position, variant: p.variant,
      birth_date: p.birth, image_url: "", is_coach: false, active: true, created_at: stamp(-190),
    });
  }
  club_rows.players.push({
    id: club.coach.id, club_id: club.id, name: club.coach.name, shirt_number: "S/N", position: "Medio", variant: "",
    birth_date: `${int(1965, 1980)}-0${int(1, 9)}-1${int(0, 9)}`, image_url: "", is_coach: true, active: true, created_at: stamp(-190),
  });

  // Entrenamientos: dos pasados (con asistencia) y dos próximos.
  [-10, -3, 2, 9].forEach((offset, n) => {
    const id = `${club.id}-ent-${n + 1}`;
    club_rows.club_events.push({
      id, club_id: club.id, event_type: "ENTRENAMIENTO", match_type: null, title: n % 2 ? "Entrenamiento físico" : "Entrenamiento táctico",
      event_date: day(offset), event_time: "19:00", location: FOOTBALL_COURTS[ci % FOOTBALL_COURTS.length].name, routine: ROUTINE,
      lineup: null, score_ours: null, score_theirs: null, penalties_ours: null, penalties_theirs: null, mvp_id: null, created_at: stamp(offset - 7),
    });
    if (offset < 0) {
      club_rows.club_event_attendees.push([id, shuffle(club.players).slice(0, int(10, 15)).map((p) => p.id)]);
    }
  });

  // Amistosos jugados, con alineación, goles, tarjetas, portero, MVP y fotos.
  [-24, -17].forEach((offset, n) => {
    const id = `${club.id}-amistoso-${n + 1}`;
    const { lineup, goalkeeper, attendees } = buildLineup(club, "FUT_11", 4);
    const ours = int(0, 4);
    const theirs = int(0, 3);
    const tied = ours === theirs && n === 0;
    const field = attendees.filter((p) => p.position !== "Portero");
    const scorers = [];
    for (let g = 0; g < ours; g++) {
      const scorer = weighted(field, (p) => ({ Delantero: 6, Medio: 3, Defensa: 1 })[p.position]);
      scorers.push(scorer);
      const assist = chance(0.6) ? pick(field.filter((p) => p !== scorer)) : null;
      club_rows.club_event_goals.push({
        id: uuid(`${id}:goal:${g}`), event_id: id, sort_order: g + 1, scorer_id: scorer.id, assist_id: assist?.id ?? null, is_penalty: false, is_own_goal: false,
      });
    }
    club_rows.club_events.push({
      id, club_id: club.id, event_type: "PARTIDO", match_type: "AMISTOSO", title: `Amistoso vs ${RIVALS[(ci + n) % RIVALS.length]}`,
      event_date: day(offset), event_time: "10:00", location: FOOTBALL_COURTS[(ci + 1) % FOOTBALL_COURTS.length].name, routine: [],
      lineup, score_ours: ours, score_theirs: theirs, penalties_ours: tied ? 4 : null, penalties_theirs: tied ? 3 : null,
      mvp_id: (scorers[0] ?? pick(attendees)).id, created_at: stamp(offset - 5),
    });
    club_rows.club_event_attendees.push([id, attendees.map((p) => p.id)]);
    for (let c = 0; c < int(0, 2); c++) {
      club_rows.club_event_cards.push({ id: uuid(`${id}:card:${c}`), event_id: id, player_id: pick(attendees).id, color: "YELLOW" });
    }
    club_rows.club_event_goalkeepers.push({ event_id: id, player_id: goalkeeper.id, conceded: theirs, saves: int(1, 6) });
    if (n === 1) {
      IMAGES.slice(0, 2).forEach((url, position) => {
        club_rows.club_event_photos.push({ id: uuid(`${id}:photo:${position}`), event_id: id, position, url });
      });
    }
  });

  // Finanzas: cuotas mensuales, patrocinio, ventas y gastos de la temporada.
  let tx = 0;
  const txn = (type, category, description, amount, offset) =>
    club_rows.transactions.push({
      id: `${club.id}-mov-${String(++tx).padStart(2, "0")}`, club_id: club.id, type, description, category, amount,
      txn_date: day(offset), source: "MANUAL", player_id: null, created_at: stamp(offset),
    });
  for (let m = 3; m >= 0; m--) txn("INGRESO", "Cuotas", "Cuotas del mes", 150 * int(10, 16), -30 * m - 2);
  txn("INGRESO", "Patrocinio", "Patrocinio de uniformes", 5000, -95);
  txn("INGRESO", "Ventas", "Venta de comida en la cancha", int(8, 20) * 100, -40);
  for (let m = 0; m < 4; m++) txn("GASTO", "Arbitraje", "Pago de arbitraje", 350, -7 * m - 1);
  txn("GASTO", "Canchas", "Renta de cancha para entrenar", 900, -12);
  txn("GASTO", "Canchas", "Renta de cancha para entrenar", 900, -26);
  txn("GASTO", "Equipo/Balones", "Balones y conos", 1250, -60);
  txn("GASTO", "Bebidas/Comida", "Agua y bebidas para el partido", 420, -8);
  txn("GASTO", "Botiquín", "Reposición del botiquín", 380, -45);

  const goals = [
    { key: "uniformes", title: "Uniformes nuevos", amount: 6000, quota: 400, status: "ACTIVE", offset: -40, paid: () => pick([0, 200, 400, 400]) },
    { key: "balones", title: "Balones de temporada", amount: 2400, quota: 150, status: "COMPLETED", offset: -120, paid: () => 150 },
  ];
  for (const g of goals) {
    const id = `${club.id}-meta-${g.key}`;
    club_rows.financial_goals.push({
      id, club_id: club.id, title: g.title, amount: g.amount, quota_per_player: g.quota, status: g.status, created_at: stamp(g.offset),
    });
    for (const p of club.players) {
      const amount = g.paid();
      if (amount > 0) club_rows.goal_contributions.push({ goal_id: id, player_id: p.id, amount });
    }
  }

  [["Balones", 12, "BUENO"], ["Balones", 3, "MALO"], ["Conos", 20, "BUENO"], ["Petos", 18, "BUENO"], ["Botiquín", 1, "BUENO"], ["Redes de portería", 1, "PERDIDO"]]
    .forEach(([name, quantity, condition], n) => {
      club_rows.inventory_items.push({
        id: `${club.id}-inv-${n + 1}`, club_id: club.id, name, quantity: quantity + int(0, 3), condition, created_at: stamp(-100 + n),
      });
    });

  [["general", "📸 Galería General", 3], ["pretemporada", "Pretemporada", 2]].forEach(([key, name, count]) => {
    const albumId = `${club.id}-album-${key}`;
    club_rows.albums.push({ id: albumId, club_id: club.id, name });
    for (let n = 0; n < count; n++) {
      club_rows.gallery_photos.push({
        id: `${albumId}-${n + 1}`, album_id: albumId, url: IMAGES[(ci + n) % IMAGES.length],
        caption: n === 0 ? `${club.name} en la cancha` : "", sort_order: n, taken_at: stamp(-20 * (n + 1), "11:00"),
      });
    }
  });
});

// ---------- plataforma ----------

const platform = {
  courts: COURTS.map((c) => ({
    id: c.id, name: c.name, description: c.description, location: c.location, hourly_rate: c.rate, active: true,
    sort_order: c.sortOrder, image_url: null, football: c.football,
  })),
  manualHolds: [
    { id: `${P}renta-1`, court_id: `${P}court-norte`, hold_date: day(1), start_time: "19:00", end_time: "21:00", source: "MANUAL", match_id: null, note: "Juan Pérez · Cumpleaños", guest_email: "juan.perez@example.com" },
    { id: `${P}renta-2`, court_id: `${P}court-techada`, hold_date: day(3), start_time: "18:00", end_time: "19:00", source: "MANUAL", match_id: null, note: "Ana López · Pagó la mitad", guest_email: "ana.lopez@example.com" },
    { id: `${P}renta-3`, court_id: `${P}court-bahia`, hold_date: day(4), start_time: "20:00", end_time: "22:00", source: "MANUAL", match_id: null, note: "Empresa Mar Azul", guest_email: "" },
  ],
  ads: [
    { key: "golazo", brand: "Deportes El Golazo", color: "14532d", href: "https://example.com/", start: -10, end: 60, status: "EN_CURSO", placements: ["HOME", "TEAMS"] },
    { key: "faro", brand: "Mariscos El Faro", color: "0c4a6e", href: "", start: -5, end: 45, status: "EN_CURSO", placements: ["TOURNAMENT", "CLUB"] },
    { key: "bahia", brand: "Refaccionaria Bahía", color: "7c2d12", href: "https://example.com/", start: 15, end: 90, status: "PROGRAMADO", placements: ["HOME"] },
  ],
  inquiries: [
    { name: "Martha Valenzuela", email: "martha.valenzuela@example.com", phone: "6221234567", topic: "Torneos", message: "Hola, ¿cuándo abren inscripciones para la Copa Femenil? Tenemos equipo completo.", status: "NEW", offset: -1 },
    { name: "Roberto Félix", email: "roberto.felix@example.com", phone: "6229876543", topic: "Renta de canchas", message: "Quiero rentar una cancha el sábado en la tarde para un torneo relámpago.", status: "NEW", offset: -3 },
    { name: "Luis Encinas", email: "luis.encinas@example.com", phone: "6225551234", topic: "Disponibilidad", message: "¿Qué horarios tienen libres entre semana para entrenar?", status: "DONE", offset: -15 },
  ],
  applications: [
    { key: "1", captain: "Gabriel Tapia", email: "gabriel.tapia@example.com", phone: "6224445566", team: "Deportivo Guaymas", status: "PENDING", offset: -2 },
    { key: "2", captain: "Alma Quiroz", email: "alma.quiroz@example.com", phone: "6227778899", team: "Sirenas FC", status: "PENDING", offset: -6 },
    { key: "3", captain: "Pedro Molina", email: "pedro.molina@example.com", phone: "6221112233", team: "Los Compas", status: "REJECTED", offset: -30 },
  ],
};

// La apertura de canchas es global: solo se siembra si no hay ninguna configurada.
const OPEN_WINDOWS = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ id: uuid(`open-window:${weekday}`), weekday }));

// ---------- SQL ----------

const like = (column) => `${column} LIKE '${P}%'`;
const cleanup = [
  `-- Partidos y canchas`,
  `DELETE FROM court_holds WHERE ${like("id")} OR ${like("match_id")} OR ${like("court_id")};`,
  `UPDATE matches SET court_id = NULL WHERE ${like("court_id")} AND NOT ${like("id")};`,
  ...["match_goals", "match_cards", "match_goalkeepers", "match_attendees", "match_club_reports"].map(
    (t) => `DELETE FROM ${t} WHERE ${like("match_id")} OR ${like("club_id")};`,
  ),
  `DELETE FROM matches WHERE ${like("id")} OR ${like("tournament_id")} OR ${like("home_club_id")} OR ${like("away_club_id")};`,
  ...["tournament_podium", "tournament_notices", "tournament_clubs"].map(
    (t) => `DELETE FROM ${t} WHERE ${like("tournament_id")} OR ${like("club_id")};`,
  ),
  `DELETE FROM tournaments WHERE ${like("id")};`,
  `DELETE FROM tournament_groups WHERE ${like("id")};`,
  `DELETE FROM courts WHERE ${like("id")};`,
  `DELETE FROM court_open_windows WHERE id IN (${OPEN_WINDOWS.map((w) => quote(w.id)).join(", ")});`,
  `-- Clubes`,
  ...["club_event_attendees", "club_event_goals", "club_event_cards", "club_event_goalkeepers", "club_event_photos"].map(
    (t) => `DELETE FROM ${t} WHERE event_id IN (SELECT id FROM club_events WHERE ${like("club_id")});`,
  ),
  `DELETE FROM club_events WHERE ${like("club_id")};`,
  `DELETE FROM gallery_photos WHERE album_id IN (SELECT id FROM albums WHERE ${like("club_id")});`,
  `DELETE FROM albums WHERE ${like("club_id")};`,
  `DELETE FROM goal_contributions WHERE ${like("goal_id")} OR ${like("player_id")};`,
  ...["financial_goals", "transactions", "inventory_items", "club_hero_images", "club_availability_windows", "club_default_lineups",
    "club_members", "club_invites", "signup_invites", "email_outbox"].map((t) => `DELETE FROM ${t} WHERE ${like("club_id")};`),
  `DELETE FROM team_applications WHERE ${like("id")};`,
  `UPDATE team_applications SET club_id = NULL WHERE ${like("club_id")};`,
  `DELETE FROM players WHERE ${like("club_id")};`,
  `DELETE FROM clubs WHERE ${like("id")};`,
  `-- Plataforma`,
  `DELETE FROM ad_placements WHERE ${like("ad_id")};`,
  `DELETE FROM ads WHERE ${like("id")};`,
  `DELETE FROM inquiries WHERE ${like("id")};`,
  `-- Catálogos creados por el seed, solo si ya nada los usa`,
  `DELETE FROM categories c WHERE ${like("c.id")} AND NOT EXISTS (SELECT 1 FROM tournaments t WHERE t.category_id = c.id);`,
  `DELETE FROM seasons s WHERE ${like("s.id")} AND NOT EXISTS (SELECT 1 FROM tournaments t WHERE t.season_id = s.id);`,
  `DELETE FROM localities l WHERE ${like("l.id")} AND NOT EXISTS (SELECT 1 FROM clubs c WHERE c.locality_id = l.id);`,
];

catalogInserts();
insert("courts", platform.courts);
statements.push(
  `INSERT INTO court_open_windows (id, weekday, start_time, end_time)\n  SELECT w.id::uuid, w.weekday, '07:00', '23:00'\n` +
    `  FROM (VALUES ${OPEN_WINDOWS.map((w) => `(${quote(w.id)}, ${w.weekday})`).join(", ")}) AS w(id, weekday)\n` +
    `  WHERE NOT EXISTS (SELECT 1 FROM court_open_windows);`,
);
for (const table of ["clubs", "club_hero_images", "club_availability_windows", "club_default_lineups", "players"]) insert(table, club_rows[table]);
for (const table of ["tournament_groups", "tournaments", "tournament_clubs", "tournament_podium", "matches", "match_club_reports",
  "match_goals", "match_cards", "match_goalkeepers", "court_holds"]) insert(table, rows[table]);
insert("court_holds", platform.manualHolds);
// Convocados: una fila por partido y club con la lista de jugadores, expandida con unnest.
statements.push(
  `INSERT INTO match_attendees (match_id, club_id, player_id, created_at)\n` +
    `  SELECT v.match_id, v.club_id, unnest(v.players), CURRENT_TIMESTAMP FROM (VALUES\n` +
    rows.match_attendees.map(([m, c, ids]) => `  (${quote(m)}, ${quote(c)}, ARRAY[${ids.map(quote).join(",")}])`).join(",\n") +
    `\n  ) AS v(match_id, club_id, players);`,
);
insert("club_events", club_rows.club_events);
// Estas filas se borran por event_id, así que su UUID no necesita ser determinista.
statements.push(
  `INSERT INTO club_event_attendees (id, event_id, player_id, raw_label)\n` +
    `  SELECT gen_random_uuid(), v.event_id, unnest(v.players), '' FROM (VALUES\n` +
    club_rows.club_event_attendees.map(([e, ids]) => `  (${quote(e)}, ARRAY[${ids.map(quote).join(",")}])`).join(",\n") +
    `\n  ) AS v(event_id, players);`,
);
for (const table of ["club_event_goals", "club_event_cards", "club_event_goalkeepers",
  "club_event_photos", "transactions", "financial_goals", "goal_contributions", "inventory_items", "albums", "gallery_photos"]) insert(table, club_rows[table]);
insert("ads", platform.ads.map((a, i) => ({
  id: `${P}ad-${a.key}`, brand: a.brand, href: a.href, status: a.status, sort_order: 900 + i,
  image_url: `https://placehold.co/1200x300/${a.color}/ffffff/png?text=${encodeURIComponent(a.brand).replace(/%20/g, "+")}`,
  starts_on: day(a.start), ends_on: day(a.end), created_at: NOW,
})));
insert("ad_placements", platform.ads.flatMap((a) => a.placements.map((placement) => ({ ad_id: `${P}ad-${a.key}`, placement, created_at: NOW }))));
insert("inquiries", platform.inquiries.map((q, i) => ({
  id: `${P}consulta-${i + 1}`, name: q.name, email: q.email, phone: q.phone, topic: q.topic, message: q.message, status: q.status, created_at: stamp(q.offset, "10:30"),
})));
insert("team_applications", platform.applications.map((a) => ({
  id: `${P}solicitud-${a.key}`, captain_name: a.captain, captain_email: a.email, captain_phone: a.phone, team_name: a.team, status: a.status,
  club_id: null, slug: null, created_at: stamp(a.offset, "09:15"), reviewed_at: a.status === "PENDING" ? null : stamp(a.offset + 2, "09:15"),
})));

const header = (title) =>
  `-- ${title}\n-- Generado por scripts/demo/generarDemo.mjs con fecha base ${TODAY} (hora de Sonora); no lo edites a mano.\n` +
  `-- Ejecútalo completo en una sola sesión (Cloud SQL Studio o psql).\n`;

writeFileSync(
  join(OUT_DIR, "demo-seed.sql"),
  `${header("Datos dummy de Clubs Platform: borra los anteriores y los vuelve a insertar.")}\nBEGIN;\n\n-- Limpieza de una ejecución anterior\n${cleanup.join("\n")}\n\n-- Inserción\n${statements.join("\n\n")}\n\nCOMMIT;\n`,
);
writeFileSync(
  join(OUT_DIR, "demo-cleanup.sql"),
  `${header("Borra todos los datos dummy de Clubs Platform (ids «dummy-»).")}\nBEGIN;\n\n${cleanup.join("\n")}\n\nCOMMIT;\n`,
);

const count = (list) => list.length;
console.log(
  `demo-seed.sql y demo-cleanup.sql generados: ${count(CLUBS)} clubes, ${count(club_rows.players)} jugadores, ` +
    `${count(TOURNAMENTS)} torneos, ${count(rows.matches)} partidos (${rows.matches.filter((m) => m.status === "PLAYED").length} jugados), ` +
    `${count(rows.match_goals)} goles, ${count(club_rows.club_events)} eventos, ${count(club_rows.transactions)} movimientos (fecha base ${TODAY}).`,
);
