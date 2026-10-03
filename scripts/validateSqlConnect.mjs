import { readFile, writeFile } from "node:fs/promises";
import { initializeApp } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";
import { transformExport } from "./sqlConnect/transform.mjs";

const EXPORT_PATH = process.argv[2] || "exports/firestore-2026-10-02.json";

function isPlayed(match) {
  return (
    match.status === "played" &&
    Number.isFinite(match.homeScore) &&
    Number.isFinite(match.awayScore)
  );
}

function computeStandings(matches, clubIds) {
  const rows = new Map();
  const ensure = (id) => {
    if (!id) return undefined;
    if (!rows.has(id)) {
      rows.set(id, { clubId: id, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
    }
    return rows.get(id);
  };
  clubIds.forEach((id) => ensure(id));
  for (const match of matches.filter(isPlayed)) {
    const home = ensure(match.homeClubId);
    const away = ensure(match.awayClubId);
    if (!home || !away) continue;
    home.pj += 1;
    away.pj += 1;
    home.gf += match.homeScore;
    home.gc += match.awayScore;
    away.gf += match.awayScore;
    away.gc += match.homeScore;
    if (match.homeScore > match.awayScore) {
      home.g += 1;
      home.pts += 3;
      away.p += 1;
    } else if (match.homeScore < match.awayScore) {
      away.g += 1;
      away.pts += 3;
      home.p += 1;
    } else {
      home.e += 1;
      away.e += 1;
      home.pts += 1;
      away.pts += 1;
    }
  }
  return [...rows.values()]
    .map((row) => ({ ...row, dg: row.gf - row.gc }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.clubId.localeCompare(b.clubId));
}

function sameStanding(stored, computed) {
  const keys = ["pj", "g", "e", "p", "gf", "gc", "dg", "pts"];
  if (stored.length !== computed.length) return false;
  for (let i = 0; i < stored.length; i += 1) {
    if (stored[i].clubId !== computed[i].clubId) return false;
    for (const key of keys) {
      if (Number(stored[i][key]) !== Number(computed[i][key])) return false;
    }
  }
  return true;
}

const raw = JSON.parse(await readFile(EXPORT_PATH, "utf8"));
const { tables, issues } = transformExport(raw);
const failures = [];

const sourceClubs = Object.keys(raw.collections.clubs || {}).length;
const sourcePlayers = Object.values(raw.collections.clubs || {}).reduce(
  (sum, club) => sum + Object.keys(club.__collections?.players || {}).length,
  0,
);
const sourceEvents = Object.values(raw.collections.clubs || {}).reduce(
  (sum, club) => sum + Object.keys(club.__collections?.events || {}).length,
  0,
);
const sourceMatches = Object.keys(raw.collections.matches || {}).length;
const sourceTournaments = Object.keys(raw.collections.tournaments || {}).length;

const skippedTournaments = issues.filter(
  (item) => item.sourcePath.startsWith("tournaments/") && item.reason.includes("temporada"),
).length;
const expect = [
  ["clubs", sourceClubs, tables.clubs.length],
  ["players", sourcePlayers, tables.players.length],
  ["clubEvents", sourceEvents, tables.clubEvents.length],
  ["matches", sourceMatches, tables.matches.length],
  ["tournaments", sourceTournaments - skippedTournaments, tables.tournaments.length],
];
for (const [name, source, transformed] of expect) {
  if (source !== transformed) failures.push(`${name}: export ${source}, transform ${transformed}`);
}

const matchesByTournament = new Map();
for (const match of Object.values(raw.collections.matches || {})) {
  const list = matchesByTournament.get(match.tournamentId) || [];
  list.push(match);
  matchesByTournament.set(match.tournamentId, list);
}
for (const [id, tournament] of Object.entries(raw.collections.tournaments || {})) {
  const stored = Array.isArray(tournament.standings) ? tournament.standings : null;
  if (!stored?.length) continue;
  const computed = computeStandings(matchesByTournament.get(id) || [], tournament.clubIds || []);
  if (!sameStanding(stored, computed)) {
    failures.push(`standings ${id} no coinciden con los partidos`);
  }
}

let lifetimeDrift = 0;
for (const club of Object.values(raw.collections.clubs || {})) {
  for (const [playerId, player] of Object.entries(club.__collections?.players || {})) {
    if (player.lifetime_contributions === undefined) continue;
    const legacy = Number(player.amount_paid) > 0 ? Number(player.amount_paid) : 0;
    const goals = Object.values(club.__collections?.goals || {}).reduce((sum, goal) => {
      const amount = Number(goal.contributions?.[playerId] || 0);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
    if (Number(player.lifetime_contributions) !== legacy + goals) lifetimeDrift += 1;
  }
}

console.log("Conteos del transform contra el export:");
for (const [name, source, transformed] of expect) {
  console.log(`  ${name}: ${transformed} (export ${source})`);
}
console.log(`Deriva de lifetime_contributions: ${lifetimeDrift}`);
const reportPath = "exports/sql-migration-report.json";
const report = JSON.parse(await readFile(reportPath, "utf8"));
report.lifetimeDrift = lifetimeDrift;
await writeFile(reportPath, JSON.stringify(report, null, 2));

const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT || "clubs-platform-aem9u" });
const dataConnect = getDataConnect(
  { location: "us-east4", serviceId: "clubs-platform-aem9u-service" },
  app,
);

async function count(field) {
  const result = await dataConnect.executeGraphqlRead(`query { rows: ${field} { _count } }`, {});
  const rows = result.data?.rows;
  if (Array.isArray(rows)) return rows[0]?._count ?? rows.length;
  return rows?._count;
}

const dbCounts = {
  clubs: await count("clubs"),
  players: await count("players"),
  clubEvents: await count("clubEvents"),
  matches: await count("matches"),
  tournaments: await count("tournaments"),
};
console.log("Conteos en SQL Connect:", dbCounts);
for (const [name, source] of [
  ["clubs", sourceClubs],
  ["players", sourcePlayers],
  ["clubEvents", sourceEvents],
  ["matches", sourceMatches],
  ["tournaments", sourceTournaments],
]) {
  const expected = name === "tournaments" ? source - skippedTournaments : source;
  if (dbCounts[name] !== expected) {
    failures.push(`sql ${name}: ${dbCounts[name]} (esperado ${expected})`);
  }
}

const sampleTournament = Object.entries(raw.collections.tournaments || {}).find(
  ([, tournament]) => Array.isArray(tournament.standings) && tournament.standings.length,
);
if (sampleTournament) {
  const [tournamentId, tournament] = sampleTournament;
  const result = await dataConnect.executeGraphqlRead(
    `query ($id: String!) {
      tournamentStandings(where: { tournament: { id: { eq: $id } } }) {
        pj g e p gf gc dg pts
        club { id }
      }
    }`,
    { variables: { id: tournamentId } },
  );
  const fromDb = (result.data?.tournamentStandings || [])
    .map((row) => ({ ...row, clubId: row.club?.id }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.clubId.localeCompare(b.clubId));
  const stored = [...tournament.standings].sort(
    (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.clubId.localeCompare(b.clubId),
  );
  if (!sameStanding(stored, fromDb)) failures.push(`vista de posiciones de ${tournamentId}`);
  else console.log(`Vista de posiciones OK: ${tournamentId}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Validación correcta.");
