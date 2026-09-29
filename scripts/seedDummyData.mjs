/**
 * Carga datos de demostración en Firestore.
 * No toca platform/config.
 *
 * 1. firebase deploy --only firestore:rules  (con firestore.rules.seed copiado)
 * 2. node scripts/seedDummyData.mjs
 * 3. restaurar firestore.rules y volver a desplegar reglas
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";

const TAG = "clubs-platform-dummy-2026";
const TODAY = "2026-09-28";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const raw = readFileSync(resolve(root, ".env"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260928);
const rand = (min, max) => min + Math.floor(rng() * (max - min + 1));
const pick = (arr) => arr[rand(0, arr.length - 1)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(rand(0, copy.length - 1), 1)[0]);
  }
  return out;
};

const logo = (name, bg = "121212") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=cd9a40&bold=true&size=128`;

const HERO = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1400&q=80",
];

const DESC =
  "Club de barrio con cantera local. Entrenamos entre semana y competimos el fin de semana.";

const COLORS = [
  "0b3d2e", "1d4ed8", "9a3412", "0e7490", "7c2d12", "365314", "44403c",
  "1e3a5f", "7f1d1d", "3f3f46", "854d0e", "134e4a", "1e293b", "4a044e",
  "14532d", "7c2d12", "0f172a", "1d4ed8", "be123c", "0f766e",
];

const FIRST = [
  "Carlos", "Luis", "Diego", "Marco", "Andrés", "Héctor", "Pablo", "Iván",
  "Rafael", "Omar", "Kevin", "Saúl", "Bruno", "Jaime", "Noé", "César",
  "Leo", "Mario", "Toño", "Fernando", "Jesús", "Alberto", "Eduardo",
  "Francisco", "Gerardo", "Manuel", "Ricardo", "Sergio", "Jorge", "Miguel",
  "Ángel", "David", "Daniel", "Alejandro", "Roberto", "Pedro", "José",
  "Enrique", "Raúl", "Arturo", "Gustavo", "Emiliano", "Gael", "Sebastián",
];

const LAST = [
  "Mendoza", "Soto", "Rivas", "Peña", "Quintero", "Valdez", "Nava", "Cruz",
  "León", "Cota", "Robles", "Ibarra", "Félix", "Ortiz", "Galindo", "Amaya",
  "Duarte", "Espinoza", "Ríos", "Camacho", "Palomares", "Navarro", "Méndez",
  "Lugo", "Valenzuela", "Cárdenas", "López", "García", "Hernández", "Martínez",
  "González", "Rodríguez", "Pérez", "Sánchez", "Ramírez", "Flores", "Torres",
  "Rivera", "Gómez", "Díaz", "Morales", "Reyes", "Gutiérrez", "Ruiz",
];

const POSITIONS = [
  "Portero", "Defensa", "Defensa", "Defensa", "Medio", "Medio", "Medio",
  "Delantero", "Delantero", "Delantero",
];

const TRAINING_TITLES = [
  "Activación táctica",
  "Circuito físico",
  "Pelota parada",
  "Presión alta",
  "Salida de balón",
  "Definición",
  "Juego por bandas",
  "Partido reducido",
  "Trabajo de porteros",
  "Recuperación activa",
];

const FRIENDLY_RIVALS = [
  "Vecinos del Esterito",
  "Combinado del Puerto",
  "Selección de barrio",
  "Exalumnos CETIS",
  "Amigos de la costa",
  "Veteranos Unidos",
  "La Banda del Malecón",
  "Club Recreativo Norte",
  "Los de la colonia",
  "Pretemporada interna",
];

const VENUES = [
  "Unidad Deportiva",
  "Cancha municipal",
  "Campo 1",
  "Cancha de tierra",
  "Estadio local",
  "Complejo deportivo",
];

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function phone() {
  return `622 ${rand(100, 999)} ${rand(1000, 9999)}`;
}

function generateRoundRobin(clubIds, legs) {
  const teams = [...clubIds];
  if (teams.length < 2) return [];
  const slots = teams.length % 2 === 1 ? [...teams, null] : [...teams];
  const n = slots.length;
  const roundsPerLeg = n - 1;
  const half = n / 2;
  const firstLeg = [];
  const rotation = [...slots];
  for (let round = 0; round < roundsPerLeg; round++) {
    for (let i = 0; i < half; i++) {
      const a = rotation[i];
      const b = rotation[n - 1 - i];
      if (!a || !b) continue;
      const homeFirst = (round + i) % 2 === 0;
      firstLeg.push({
        homeClubId: homeFirst ? a : b,
        awayClubId: homeFirst ? b : a,
        round: String(round + 1),
      });
    }
    const last = rotation.pop();
    if (last !== undefined) rotation.splice(1, 0, last);
  }
  if (legs < 2) return firstLeg;
  return [
    ...firstLeg,
    ...firstLeg.map((f) => ({
      homeClubId: f.awayClubId,
      awayClubId: f.homeClubId,
      round: String(Number(f.round) + roundsPerLeg),
    })),
  ];
}

const categories = [
  { id: "primera", name: "Primera división", order: 1 },
  { id: "segunda", name: "Segunda división", order: 2 },
  { id: "tercera", name: "Tercera división", order: 3 },
];

const localities = [
  { id: "guaymas", name: "Guaymas, Sonora" },
  { id: "empalme", name: "Empalme, Sonora" },
  { id: "sancarlos", name: "San Carlos, Sonora" },
  { id: "obregon", name: "Ciudad Obregón, Sonora" },
  { id: "navojoa", name: "Navojoa, Sonora" },
];

const seasons = [
  {
    id: "2025",
    name: "Temporada 2025",
    startDate: "2025-01-15",
    endDate: "2025-12-10",
    active: false,
  },
  {
    id: "2026",
    name: "Temporada 2026",
    startDate: "2026-01-18",
    endDate: "2026-12-13",
    active: true,
  },
];

const NAME_PARTS = [
  ["Águilas", "Guaymas"], ["Atlético", "Guaymas"], ["Deportivo", "Empalme"],
  ["Costa Azul", "FC"], ["Real", "San Carlos"], ["Unidos", "del Puerto"],
  ["Mineros", "FC"], ["Pesqueros", "Unidos"], ["Leones", "de Ortiz"],
  ["Halcones", "del Mar"], ["Lobos", "Empalme"], ["Tigres", "del Valle"],
  ["Rayados", "Guaymas"], ["Estrella", "Roja"], ["Sporting", "Obregón"],
  ["Club", "Navojoa"], ["Juventud", "Potam"], ["Real", "Huatabampo"],
  ["Atlético", "Yécora"], ["Deportivo", "Vicam"], ["Cimarrones", "FC"],
  ["Tiburones", "del Golfo"], ["Delfines", "San Carlos"], ["Cachanillas", "FC"],
  ["Seris", "Unidos"], ["Yaquis", "de Vícam"], ["Mayos", "Navojoa"],
  ["Puerto", "Libre"], ["Malecón", "FC"], ["Arena", "Blanca"],
  ["Cerro", "Prieto"], ["Bahía", "de Lobos"], ["Punta", "de Arena"],
  ["El Sahuaral", "FC"], ["La Manga", "United"], ["Miramar", "FC"],
  ["San José", "de Guaymas"], ["Empalme", "Sur"], ["Norteños", "FC"],
  ["Sur", "Pacifico"], ["Alianza", "Costera"], ["Fuerza", "Obrera"],
  ["Cafeteros", "FC"], ["Ferrocarrileros", "Empalme"], ["Pescadores", "FC"],
  ["Constructores", "Unidos"], ["Maestros", "FC"], ["Veteranos", "del Puerto"],
  ["Cantera", "Dorada"], ["Orinco", "Jóvenes"],
];

const clubs = NAME_PARTS.map(([a, b], i) => {
  const name = `${a} ${b}`.replace(/\s+/g, " ").trim();
  const locality = localities[i % localities.length];
  const categoryId = i < 16 ? "primera" : i < 33 ? "segunda" : "tercera";
  return {
    id: slugify(name) || `club-${pad(i + 1)}`,
    name,
    initials: name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase(),
    localityId: locality.id,
    location: locality.name,
    categoryId,
    bg: COLORS[i % COLORS.length],
  };
});

const byCat = {
  primera: clubs.filter((c) => c.categoryId === "primera").map((c) => c.id),
  segunda: clubs.filter((c) => c.categoryId === "segunda").map((c) => c.id),
  tercera: clubs.filter((c) => c.categoryId === "tercera").map((c) => c.id),
};

function take(ids, n, offset = 0) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(ids[(offset + i) % ids.length]);
  return [...new Set(out)].slice(0, n);
}

const tournaments = [
  {
    id: "liga-2026-primera",
    name: "Liga Orinco",
    seasonId: "2026",
    categoryId: "primera",
    clubIds: take(byCat.primera, 12, 0),
    status: "active",
    groupId: "liga-orinco-2026",
    legs: 1,
    footballType: 7,
    description: "Liga regular de Primera. Jornada a jornada en todo el municipio.",
  },
  {
    id: "liga-2026-segunda",
    name: "Liga Orinco",
    seasonId: "2026",
    categoryId: "segunda",
    clubIds: take(byCat.segunda, 12, 0),
    status: "active",
    groupId: "liga-orinco-2026",
    legs: 1,
    footballType: 7,
    description: "Segunda división de la Liga Orinco 2026.",
  },
  {
    id: "liga-2026-tercera",
    name: "Liga Orinco",
    seasonId: "2026",
    categoryId: "tercera",
    clubIds: take(byCat.tercera, 12, 0),
    status: "active",
    groupId: "liga-orinco-2026",
    legs: 1,
    footballType: 7,
    description: "Tercera división. El pulmón de la cantera.",
  },
  {
    id: "copa-mar-2026",
    name: "Copa del Mar",
    seasonId: "2026",
    categoryId: "primera",
    clubIds: take(byCat.primera, 10, 2),
    status: "active",
    legs: 1,
    footballType: 7,
    description: "Copa de Primera. Cruces de ida entre los diez mejores.",
  },
  {
    id: "copa-guaymas-2026",
    name: "Copa Guaymas",
    seasonId: "2026",
    categoryId: "segunda",
    clubIds: take(byCat.segunda, 8, 3),
    status: "upcoming",
    legs: 1,
    footballType: 7,
    description: "Copa de Segunda. Calendario todavía por cerrar.",
  },
  {
    id: "apertura-relampago-2026",
    name: "Apertura Relámpago",
    seasonId: "2026",
    categoryId: "tercera",
    clubIds: take(byCat.tercera, 10, 1),
    status: "active",
    legs: 1,
    footballType: 7,
    description: "Torneo corto de Tercera para meter ritmo.",
  },
  {
    id: "liga-2025-primera",
    name: "Liga Orinco",
    seasonId: "2025",
    categoryId: "primera",
    clubIds: take(byCat.primera, 10, 0),
    status: "finished",
    groupId: "liga-orinco-2025",
    legs: 1,
    footballType: 7,
    description: "Liga de Primera 2025. Ya cerrada.",
  },
  {
    id: "liga-2025-segunda",
    name: "Liga Orinco",
    seasonId: "2025",
    categoryId: "segunda",
    clubIds: take(byCat.segunda, 10, 0),
    status: "finished",
    groupId: "liga-orinco-2025",
    legs: 1,
    footballType: 7,
    description: "Liga de Segunda 2025.",
  },
  {
    id: "copa-puerto-2025",
    name: "Copa del Puerto",
    seasonId: "2025",
    categoryId: "primera",
    clubIds: take(byCat.primera, 8, 4),
    status: "finished",
    legs: 1,
    footballType: 7,
    description: "Copa 2025 de Primera.",
  },
  {
    id: "copa-relampago-2025",
    name: "Copa Relámpago",
    seasonId: "2025",
    categoryId: "tercera",
    clubIds: take(byCat.tercera, 8, 0),
    status: "finished",
    legs: 1,
    footballType: 7,
    description: "Relámpago de Tercera 2025.",
  },
];

function makePlayer(clubId, index) {
  const position =
    index === 0 ? "Portero" : index === 1 ? "Portero" : POSITIONS[index % POSITIONS.length];
  const number = index === 0 ? "1" : String(index + 1);
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  const year = rand(1989, 2005);
  const month = pad(rand(1, 12));
  const day = pad(rand(1, 28));
  return {
    id: `${clubId}-p${index + 1}`,
    name,
    number,
    position,
    variant: "",
    birthDate: `${year}-${month}-${day}`,
    imageUrl: "",
    isDT: index === 10,
    active: true,
    amount_paid: rand(0, 1) ? rand(200, 800) : 0,
    lifetime_contributions: rand(200, 1200),
    timestamp: "2026-02-01T12:00:00.000Z",
    seedTag: TAG,
  };
}

const roster = Object.fromEntries(
  clubs.map((club) => {
    const n = rand(10, 12);
    const players = Array.from({ length: n }, (_, i) => makePlayer(club.id, i));
    return [club.id, players];
  }),
);

function namesOf(clubId) {
  return Object.fromEntries((roster[clubId] || []).map((p) => [p.id, p.name]));
}

function fieldPlayers(clubId) {
  return (roster[clubId] || []).filter((p) => p.position !== "Portero");
}

function goalie(clubId) {
  return (roster[clubId] || []).find((p) => p.position === "Portero") || roster[clubId]?.[0];
}

function buildGoals(clubId, count) {
  const pool = fieldPlayers(clubId);
  if (!pool.length || count <= 0) return [];
  const stats = [];
  for (let i = 0; i < count; i++) {
    const scorer = pick(pool);
    const assist = rng() > 0.45 ? pick(pool.filter((p) => p.id !== scorer.id)) : null;
    stats.push({
      scorer: scorer.id,
      ...(assist ? { assist: assist.id } : {}),
      ...(rng() > 0.9 ? { isPenalty: true } : {}),
    });
  }
  return stats;
}

function buildSide(clubId, conceded, scored) {
  const players = roster[clubId] || [];
  const gk = goalie(clubId);
  const attendees = pickN(players, Math.min(players.length, rand(8, players.length))).map(
    (p) => p.id,
  );
  return {
    attendees,
    playerNames: namesOf(clubId),
    stats: buildGoals(clubId, scored),
    goalkeepers: gk
      ? [{ id: gk.id, conceded, saves: rand(1, 7) }]
      : [],
    mvp: attendees[0] || "",
    yellowCards: rng() > 0.6 ? [pick(players).id] : [],
    redCards: rng() > 0.92 ? [pick(players).id] : [],
  };
}

function splitStatuses(count, mode) {
  if (mode === "finished") return Array(count).fill("played");
  if (mode === "upcoming") {
    return Array.from({ length: count }, (_, i) =>
      i < Math.ceil(count * 0.25) ? "scheduled" : "unscheduled",
    );
  }
  return Array.from({ length: count }, (_, i) => {
    const q = i / count;
    if (q < 0.42) return "played";
    if (q < 0.75) return "scheduled";
    return "unscheduled";
  });
}

function saturdayFrom(startIso, weekIndex) {
  const d = new Date(`${startIso}T12:00:00`);
  const day = d.getDay();
  const toSat = (6 - day + 7) % 7;
  d.setDate(d.getDate() + toSat + weekIndex * 7);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function makeMatches() {
  const all = [];
  for (const t of tournaments) {
    const fixtures = generateRoundRobin(t.clubIds, t.legs || 1);
    const statuses = splitStatuses(
      fixtures.length,
      t.status === "finished" ? "finished" : t.status === "upcoming" ? "upcoming" : "active",
    );
    const startPlayed = t.seasonId === "2025" ? "2025-02-08" : "2026-02-01";
    const startFuture =
      t.status === "upcoming" ? "2026-10-18" : "2026-10-04";
    const table = Object.fromEntries(t.clubIds.map((id) => [id, { pts: 0, dg: 0, gf: 0 }]));
    let playedWeek = 0;
    let futureWeek = 0;

    fixtures.forEach((f, i) => {
      const status = statuses[i];
      const id = `fx_${t.id}_${f.homeClubId}_${f.awayClubId}`;
      const time = pick(["16:00", "17:00", "18:00", "19:00", "20:00"]);
      const venue = `${pick(VENUES)} · ${clubs.find((c) => c.id === f.homeClubId)?.location || ""}`;
      const base = {
        id,
        tournamentId: t.id,
        seasonId: t.seasonId,
        categoryId: t.categoryId,
        round: f.round,
        homeClubId: f.homeClubId,
        awayClubId: f.awayClubId,
        clubIds: [f.homeClubId, f.awayClubId],
        sides: {},
      };
      if (status === "unscheduled") {
        all.push({
          ...base,
          date: "",
          time: "",
          venue: "",
          status: "unscheduled",
        });
        return;
      }
      if (status === "scheduled") {
        const date = saturdayFrom(startFuture, futureWeek++);
        all.push({
          ...base,
          date,
          time,
          venue,
          status: "scheduled",
        });
        return;
      }
      const date = saturdayFrom(startPlayed, playedWeek++);
      const homeScore = rand(0, 5);
      const awayScore = rand(0, 4);
      if (table[f.homeClubId]) {
        table[f.homeClubId].gf += homeScore;
        table[f.homeClubId].dg += homeScore - awayScore;
        table[f.awayClubId].gf += awayScore;
        table[f.awayClubId].dg += awayScore - homeScore;
        if (homeScore > awayScore) table[f.homeClubId].pts += 3;
        else if (awayScore > homeScore) table[f.awayClubId].pts += 3;
        else {
          table[f.homeClubId].pts += 1;
          table[f.awayClubId].pts += 1;
        }
      }
      all.push({
        ...base,
        date,
        time,
        venue,
        status: "played",
        homeScore,
        awayScore,
        sides: {
          [f.homeClubId]: buildSide(f.homeClubId, awayScore, homeScore),
          [f.awayClubId]: buildSide(f.awayClubId, homeScore, awayScore),
        },
      });
    });

    if (t.status === "finished") {
      const ranked = Object.entries(table).sort(
        (a, b) => b[1].pts - a[1].pts || b[1].dg - a[1].dg || b[1].gf - a[1].gf,
      );
      t.podium = {
        "1": ranked[0]?.[0],
        "2": ranked[1]?.[0],
        "3": ranked[2]?.[0],
      };
    }
  }
  return all;
}

function makeClubEvents(club) {
  const players = roster[club.id] || [];
  const events = [];
  const trainings = rand(5, 10);
  const friendlies = rand(5, 10);
  const oldTrain = Math.ceil(trainings / 2);
  const oldFriendly = Math.ceil(friendlies / 2);

  for (let i = 0; i < trainings; i++) {
    const old = i < oldTrain;
    const eventDate = old
      ? addDays("2026-03-04", i * 14)
      : addDays("2026-10-02", (i - oldTrain) * 7);
    events.push({
      id: `${club.id}-ent-${i + 1}`,
      eventType: "Entrenamiento",
      matchType: null,
      title: TRAINING_TITLES[i % TRAINING_TITLES.length],
      eventDate,
      eventTime: pick(["19:00", "20:00", "21:00"]),
      location: club.location,
      attendees: old
        ? pickN(players, Math.min(players.length, rand(6, players.length))).map((p) => p.id)
        : [],
      routine: [],
      timestamp: `${eventDate}T12:00:00.000Z`,
    });
  }

  for (let i = 0; i < friendlies; i++) {
    const old = i < oldFriendly;
    const eventDate = old
      ? addDays("2026-03-08", i * 21)
      : addDays("2026-10-05", (i - oldFriendly) * 14);
    const ours = old ? rand(0, 5) : undefined;
    const theirs = old ? rand(0, 4) : undefined;
    events.push({
      id: `${club.id}-ami-${i + 1}`,
      eventType: "Partido",
      matchType: "Amistoso",
      title: FRIENDLY_RIVALS[i % FRIENDLY_RIVALS.length],
      eventDate,
      eventTime: pick(["17:00", "18:30", "19:00"]),
      location: pick(VENUES),
      attendees: old
        ? pickN(players, Math.min(players.length, rand(7, players.length))).map((p) => p.id)
        : [],
      timestamp: `${eventDate}T12:00:00.000Z`,
      ...(old
        ? {
            scoreOurs: ours,
            scoreTheirs: theirs,
            penaltiesOurs: ours === theirs ? rand(3, 5) : null,
            penaltiesTheirs: ours === theirs ? rand(2, 4) : null,
          }
        : {}),
    });
  }
  return events;
}

function withTag(obj) {
  return { ...obj, seedTag: TAG };
}

async function commit(ops) {
  const chunk = 400;
  for (let i = 0; i < ops.length; i += chunk) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + chunk)) {
      if (op.type === "delete") batch.delete(op.ref);
      else batch.set(op.ref, op.data);
    }
    await batch.commit();
    console.log(`  lote ${Math.min(i + chunk, ops.length)}/${ops.length}`);
  }
}

async function collectDeletes() {
  const ops = [];
  const roots = [
    "categories",
    "localities",
    "seasons",
    "tournaments",
    "matches",
    "clubs",
  ];
  for (const name of roots) {
    const snap = await getDocs(collection(db, name));
    for (const d of snap.docs) {
      if (d.data().seedTag !== TAG) continue;
      if (name === "clubs") {
        for (const sub of ["players", "events", "transactions", "goals", "inventory"]) {
          const kids = await getDocs(collection(db, "clubs", d.id, sub));
          for (const k of kids.docs) {
            if (k.data().seedTag === TAG) ops.push({ type: "delete", ref: k.ref });
          }
        }
      }
      ops.push({ type: "delete", ref: d.ref });
    }
  }
  return ops;
}

async function main() {
  const matchesOnly = process.argv.includes("--matches-only");

  if (!matchesOnly) {
    console.log("Limpiando dummy anterior (si existe)...");
    const deletes = await collectDeletes();
    if (deletes.length) {
      console.log(`Borrando ${deletes.length} documentos viejos...`);
      await commit(deletes);
    }
  } else {
    console.log("Reescribiendo solo partidos y torneos...");
  }

  const matches = makeMatches();
  const ops = [];

  if (!matchesOnly) {
    for (const c of categories) ops.push({ ref: doc(db, "categories", c.id), data: withTag(c) });
    for (const l of localities) ops.push({ ref: doc(db, "localities", l.id), data: withTag(l) });
    for (const s of seasons) ops.push({ ref: doc(db, "seasons", s.id), data: withTag(s) });
  }

  for (const t of tournaments) {
    const { id, ...data } = t;
    ops.push({ ref: doc(db, "tournaments", id), data: withTag(data) });
  }

  if (!matchesOnly) {
    let playerCount = 0;
    let eventCount = 0;
    for (const club of clubs) {
      ops.push({
        ref: doc(db, "clubs", club.id),
        data: withTag({
          slug: club.id,
          name: club.name,
          localityId: club.localityId,
          location: club.location,
          categoryId: club.categoryId,
          presidentPhone: phone(),
          description: DESC,
          logoUrl: logo(club.initials, club.bg),
          heroImages: HERO,
          defaultLineups: {},
          active: true,
          createdAt: "2026-01-10T12:00:00.000Z",
        }),
      });
      for (const p of roster[club.id]) {
        const { id, ...data } = p;
        ops.push({ ref: doc(db, "clubs", club.id, "players", id), data });
        playerCount++;
      }
      for (const ev of makeClubEvents(club)) {
        const { id, ...data } = ev;
        ops.push({
          ref: doc(db, "clubs", club.id, "events", id),
          data: withTag(data),
        });
        eventCount++;
      }
    }
    console.log(`${clubs.length} clubes · ${playerCount} jugadores · ${eventCount} eventos de club`);
  }

  for (const m of matches) {
    const { id, ...data } = m;
    ops.push({ ref: doc(db, "matches", id), data: withTag(data) });
  }

  const played = matches.filter((m) => m.status === "played").length;
  const scheduled = matches.filter((m) => m.status === "scheduled").length;
  const unscheduled = matches.filter((m) => m.status === "unscheduled").length;

  console.log(
    [
      `${clubs.length} clubes`,
      matchesOnly ? "solo partidos/torneos" : "clubes/jugadores/eventos incluidos",
      `${tournaments.length} torneos`,
      `${matches.length} partidos oficiales (jugados ${played}, agendados ${scheduled}, sin agendar ${unscheduled})`,
    ].join(" · "),
  );
  console.log(`Escribiendo ${ops.length} documentos...`);
  await commit(ops);
  console.log("Listo. Dummy data cargada.");
}

main().catch((err) => {
  console.error(err?.code || "", err?.message || err);
  process.exit(1);
});
