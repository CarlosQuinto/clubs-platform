import { getFirestore, type DocumentData } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

/**
 * Tablas materializadas de un torneo.
 * Misma regla que src/lib/stats.ts: 3 pts, desempate por diferencia y goles a favor.
 * Los goles sin nombre y los autogoles no entran en goleadores.
 * El nombre mostrado es el del partido jugado más reciente de ese jugador.
 */

const REGION = "us-central1";
const MAX_PASSES = 5;

interface GoalStat {
  scorer?: string;
  assist?: string;
  isOwnGoal?: boolean;
}

interface MatchSide {
  stats?: GoalStat[];
  playerNames?: Record<string, string>;
}

interface MatchDoc {
  id: string;
  tournamentId?: string;
  status?: string;
  homeClubId?: string;
  awayClubId?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  date?: string;
  time?: string;
  sides?: Record<string, MatchSide>;
}

interface StandingRow {
  clubId: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

interface ScorerRow {
  playerId: string;
  name: string;
  clubId: string;
  goals: number;
  assists: number;
}

interface GoalSideSnap {
  stats: { scorer: string; assist: string; isOwnGoal: boolean }[];
  names: Record<string, string>;
}

function db() {
  return getFirestore();
}

function isPlayed(match: MatchDoc) {
  return (
    match.status === "played" &&
    typeof match.homeScore === "number" &&
    Number.isFinite(match.homeScore) &&
    typeof match.awayScore === "number" &&
    Number.isFinite(match.awayScore)
  );
}

function asMatch(id: string, data: DocumentData | undefined): MatchDoc | undefined {
  if (!data) return undefined;
  const sides: Record<string, MatchSide> = {};
  const rawSides = data.sides;
  if (rawSides && typeof rawSides === "object") {
    for (const [clubId, side] of Object.entries(rawSides as Record<string, MatchSide>)) {
      if (!side || typeof side !== "object") continue;
      const names = side.playerNames;
      const playerNames: Record<string, string> = {};
      if (names && typeof names === "object") {
        for (const [playerId, name] of Object.entries(names)) {
          if (typeof name === "string" && name) playerNames[playerId] = name;
        }
      }
      sides[clubId] = {
        stats: Array.isArray(side.stats) ? side.stats : [],
        playerNames,
      };
    }
  }
  return {
    id,
    tournamentId: typeof data.tournamentId === "string" ? data.tournamentId : "",
    status: typeof data.status === "string" ? data.status : "",
    homeClubId: typeof data.homeClubId === "string" ? data.homeClubId : "",
    awayClubId: typeof data.awayClubId === "string" ? data.awayClubId : "",
    homeScore: typeof data.homeScore === "number" ? data.homeScore : null,
    awayScore: typeof data.awayScore === "number" ? data.awayScore : null,
    date: typeof data.date === "string" ? data.date : "",
    time: typeof data.time === "string" ? data.time : "",
    sides,
  };
}

function clubIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function goalSides(match: MatchDoc): [string, GoalSideSnap][] {
  return Object.entries(match.sides || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clubId, side]) => {
      const stats = (side.stats || []).map((stat) => ({
        scorer: stat.scorer || "",
        assist: stat.assist || "",
        isOwnGoal: !!stat.isOwnGoal,
      }));
      const names: Record<string, string> = {};
      const source = side.playerNames || {};
      for (const stat of stats) {
        if (stat.isOwnGoal) continue;
        if (stat.scorer && source[stat.scorer]) names[stat.scorer] = source[stat.scorer];
        if (stat.assist && source[stat.assist]) names[stat.assist] = source[stat.assist];
      }
      const orderedNames = Object.keys(names)
        .sort()
        .reduce<Record<string, string>>((acc, id) => {
          acc[id] = names[id];
          return acc;
        }, {});
      return [clubId, { stats, names: orderedNames }] as [string, GoalSideSnap];
    });
}

/** Huella de lo que sí cambia las tablas. Fecha, tarjetas y penales no entran. */
function contributionKey(match: MatchDoc | undefined): string {
  if (!match || !isPlayed(match)) return "";
  return JSON.stringify({
    tournamentId: match.tournamentId || "",
    homeClubId: match.homeClubId || "",
    awayClubId: match.awayClubId || "",
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    sides: goalSides(match),
  });
}

function fingerprint(clubIds: string[], matches: MatchDoc[]): string {
  const played = matches
    .filter(isPlayed)
    .map((match) => ({
      id: match.id,
      homeClubId: match.homeClubId || "",
      awayClubId: match.awayClubId || "",
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      sides: goalSides(match),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify({
    clubs: [...clubIds].sort(),
    played,
  });
}

function emptyStanding(clubId: string): StandingRow {
  return { clubId, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
}

export function computeStandings(matches: MatchDoc[], clubIds: string[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  const ensure = (id: string) => {
    if (!id) return undefined;
    if (!rows.has(id)) rows.set(id, emptyStanding(id));
    return rows.get(id);
  };
  clubIds.forEach((id) => ensure(id));

  matches.filter(isPlayed).forEach((match) => {
    const home = ensure(match.homeClubId || "");
    const away = ensure(match.awayClubId || "");
    if (!home || !away) return;
    const hs = match.homeScore as number;
    const as = match.awayScore as number;
    home.pj++;
    away.pj++;
    home.gf += hs;
    home.gc += as;
    away.gf += as;
    away.gc += hs;
    if (hs > as) {
      home.g++;
      home.pts += 3;
      away.p++;
    } else if (hs < as) {
      away.g++;
      away.pts += 3;
      home.p++;
    } else {
      home.e++;
      away.e++;
      home.pts++;
      away.pts++;
    }
  });

  return [...rows.values()]
    .map((row) => ({ ...row, dg: row.gf - row.gc }))
    .sort(
      (a, b) =>
        b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.clubId.localeCompare(b.clubId),
    );
}

function playedMillis(match: MatchDoc) {
  const time = new Date(`${match.date || "1970-01-01"}T${match.time || "00:00"}`).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function computeScorers(matches: MatchDoc[]): ScorerRow[] {
  const map = new Map<string, ScorerRow>();
  const played = matches.filter(isPlayed).sort((a, b) => {
    const byTime = playedMillis(a) - playedMillis(b);
    if (byTime !== 0) return byTime;
    return a.id.localeCompare(b.id);
  });

  for (const match of played) {
    for (const [clubId, side] of Object.entries(match.sides || {})) {
      const names = side.playerNames || {};
      for (const stat of side.stats || []) {
        if (stat.isOwnGoal) continue;
        if (stat.scorer) {
          const key = `${clubId}:${stat.scorer}`;
          const row = map.get(key) || {
            playerId: stat.scorer,
            name: names[stat.scorer] || stat.scorer,
            clubId,
            goals: 0,
            assists: 0,
          };
          row.goals++;
          row.name = names[stat.scorer] || stat.scorer;
          map.set(key, row);
        }
        if (stat.assist) {
          const key = `${clubId}:${stat.assist}`;
          const row = map.get(key) || {
            playerId: stat.assist,
            name: names[stat.assist] || stat.assist,
            clubId,
            goals: 0,
            assists: 0,
          };
          row.assists++;
          row.name = names[stat.assist] || stat.assist;
          map.set(key, row);
        }
      }
    }
  }

  return [...map.values()].sort(
    (a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name),
  );
}

async function loadTournament(tournamentId: string) {
  const snap = await db().doc(`tournaments/${tournamentId}`).get();
  if (!snap.exists) return null;
  const matchesSnap = await db()
    .collection("matches")
    .where("tournamentId", "==", tournamentId)
    .get();
  const matches = matchesSnap.docs.map((doc) => asMatch(doc.id, doc.data())!);
  return {
    clubIds: clubIdList(snap.data()?.clubIds),
    matches,
  };
}

/** Lee dos veces y solo escribe si los partidos no cambiaron entre ambas lecturas. */
export async function rebuildTournamentTables(tournamentId: string) {
  if (!tournamentId) return;
  let latest: { clubIds: string[]; matches: MatchDoc[] } | null = null;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const first = await loadTournament(tournamentId);
    if (!first) return;
    const firstKey = fingerprint(first.clubIds, first.matches);
    const second = await loadTournament(tournamentId);
    if (!second) return;
    latest = second;
    if (firstKey !== fingerprint(second.clubIds, second.matches)) continue;

    await db().doc(`tournaments/${tournamentId}`).update({
      standings: computeStandings(second.matches, second.clubIds),
      scorers: computeScorers(second.matches),
    });
    return;
  }

  if (!latest) return;
  await db().doc(`tournaments/${tournamentId}`).update({
    standings: computeStandings(latest.matches, latest.clubIds),
    scorers: computeScorers(latest.matches),
  });
}

function tournamentIdsToRebuild(before: MatchDoc | undefined, after: MatchDoc | undefined) {
  if (contributionKey(before) === contributionKey(after)) return [];
  const ids = new Set<string>();
  if (before?.tournamentId) ids.add(before.tournamentId);
  if (after?.tournamentId) ids.add(after.tournamentId);
  return [...ids];
}

export const syncTournamentTablesOnMatch = onDocumentWritten(
  { document: "matches/{matchId}", region: REGION },
  async (event) => {
    const change = event.data;
    if (!change) return;
    const before = asMatch(
      event.params.matchId,
      change.before.exists ? change.before.data() : undefined,
    );
    const after = asMatch(
      event.params.matchId,
      change.after.exists ? change.after.data() : undefined,
    );
    const ids = tournamentIdsToRebuild(before, after);
    for (const id of ids) await rebuildTournamentTables(id);
  },
);

export const syncTournamentTablesOnClubs = onDocumentWritten(
  { document: "tournaments/{tournamentId}", region: REGION },
  async (event) => {
    const change = event.data;
    if (!change?.after.exists) return;
    const beforeIds = clubIdList(
      change.before.exists ? change.before.data()?.clubIds : [],
    );
    const afterIds = clubIdList(change.after.data()?.clubIds);
    const same =
      beforeIds.length === afterIds.length &&
      [...beforeIds].sort().join("\0") === [...afterIds].sort().join("\0");
    if (same) return;
    await rebuildTournamentTables(event.params.tournamentId);
  },
);

function tablesStored(data: DocumentData | undefined) {
  return Array.isArray(data?.standings) && Array.isArray(data?.scorers);
}

/** Crea standings y scorers si faltan y el torneo ya tiene partidos con marcador. */
export const ensureTournamentTables = onCall(
  { cors: true, region: REGION },
  async (request) => {
    const tournamentId = String(request.data?.tournamentId || "").trim();
    if (!tournamentId) {
      throw new HttpsError("invalid-argument", "Falta el torneo.");
    }

    const snap = await db().doc(`tournaments/${tournamentId}`).get();
    if (!snap.exists || tablesStored(snap.data())) return { created: false };

    const loaded = await loadTournament(tournamentId);
    if (!loaded || !loaded.matches.some(isPlayed)) return { created: false };

    await rebuildTournamentTables(tournamentId);
    return { created: true };
  },
);

export const rebuildAllTournamentTables = onCall(
  { cors: true, region: REGION, timeoutSeconds: 300 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Inicia sesión para reconstruir las tablas.");
    }
    const config = await db().doc("platform/config").get();
    const superAdmins = (config.data()?.superAdmins || []) as string[];
    if (!superAdmins.includes(request.auth.uid)) {
      throw new HttpsError(
        "permission-denied",
        "Solo un superadmin puede reconstruir las tablas.",
      );
    }

    const snap = await db().collection("tournaments").get();
    const ids = snap.docs.map((doc) => doc.id);
    const chunk = 8;
    for (let i = 0; i < ids.length; i += chunk) {
      await Promise.all(ids.slice(i, i + chunk).map((id) => rebuildTournamentTables(id)));
    }
    return { tournaments: ids.length };
  },
);
