import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { matchRef, matchesCol } from "./paths";
import { isPlayed } from "./stats";
import type { Match, Tournament } from "./types";

export type PlannedFixture = {
  homeClubId: string;
  awayClubId: string;
  round: string;
};

export function tournamentLegs(t: Pick<Tournament, "legs">): 1 | 2 {
  return t.legs === 1 ? 1 : 2;
}

export function expectedMatchCount(clubCount: number, legs: number) {
  if (clubCount < 2) return 0;
  return (clubCount * (clubCount - 1) * legs) / 2;
}

/** Round-robin (método del círculo). `legs` 1 = solo ida, 2 = ida y vuelta. */
export function generateRoundRobin(
  clubIds: string[],
  legs: number,
): PlannedFixture[] {
  const teams = [...clubIds];
  if (teams.length < 2) return [];

  const slots: (string | null)[] =
    teams.length % 2 === 1 ? [...teams, null] : [...teams];
  const n = slots.length;
  const roundsPerLeg = n - 1;
  const half = n / 2;
  const firstLeg: PlannedFixture[] = [];
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

  const secondLeg = firstLeg.map((f) => ({
    homeClubId: f.awayClubId,
    awayClubId: f.homeClubId,
    round: String(Number(f.round) + roundsPerLeg),
  }));
  return [...firstLeg, ...secondLeg];
}

function samePair(m: Match, f: PlannedFixture) {
  return m.homeClubId === f.homeClubId && m.awayClubId === f.awayClubId;
}

function rankExisting(m: Match) {
  if (isPlayed(m)) return 0;
  if (m.date && m.time) return 1;
  return 2;
}

function unorderedKey(a: string, b: string) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

function recencyValue(m: Match) {
  if (m.date) {
    const t = new Date(`${m.date}T${m.time || "00:00"}`).getTime();
    if (Number.isFinite(t)) return t;
  }
  const round = Number(m.round);
  if (Number.isFinite(round)) return round;
  return Number.MAX_SAFE_INTEGER;
}

/** Más antiguo / ya jugado primero: ese se conserva como el único partido. */
function keepOrder(a: Match, b: Match) {
  const ap = isPlayed(a) ? 0 : 1;
  const bp = isPlayed(b) ? 0 : 1;
  if (ap !== bp) return ap - bp;
  const ad = recencyValue(a);
  const bd = recencyValue(b);
  if (ad !== bd) return ad - bd;
  return a.id.localeCompare(b.id);
}

function firstLegFixtureForPair(
  plan: PlannedFixture[],
  clubA: string,
  clubB: string,
) {
  return plan.find(
    (f) =>
      (f.homeClubId === clubA && f.awayClubId === clubB) ||
      (f.homeClubId === clubB && f.awayClubId === clubA),
  );
}

function diffSingleLeg(tournament: Tournament, matches: Match[]) {
  const enrolled = new Set(tournament.clubIds);
  const plan = generateRoundRobin(tournament.clubIds, 1);
  const toCreate: PlannedFixture[] = [];
  const toDelete: Match[] = [];
  const grouped = new Map<string, Match[]>();

  for (const m of matches) {
    const bothIn = enrolled.has(m.homeClubId) && enrolled.has(m.awayClubId);
    if (!bothIn) {
      if (!isPlayed(m)) toDelete.push(m);
      continue;
    }
    const key = unorderedKey(m.homeClubId, m.awayClubId);
    const list = grouped.get(key) || [];
    list.push(m);
    grouped.set(key, list);
  }

  for (let i = 0; i < tournament.clubIds.length; i++) {
    for (let j = i + 1; j < tournament.clubIds.length; j++) {
      const a = tournament.clubIds[i];
      const b = tournament.clubIds[j];
      const group = [...(grouped.get(unorderedKey(a, b)) || [])].sort(keepOrder);
      if (group.length === 0) {
        const fixture = firstLegFixtureForPair(plan, a, b);
        if (fixture) toCreate.push(fixture);
        continue;
      }
      toDelete.push(...group.slice(1));
    }
  }

  return { plan, toCreate, toDelete };
}

function diffDoubleLeg(tournament: Tournament, matches: Match[]) {
  const plan = generateRoundRobin(tournament.clubIds, 2);
  const unused = new Set(matches);
  const toCreate: PlannedFixture[] = [];

  for (const fixture of plan) {
    const candidates = matches
      .filter((m) => unused.has(m) && samePair(m, fixture))
      .sort((a, b) => rankExisting(a) - rankExisting(b));
    if (candidates.length === 0) {
      toCreate.push(fixture);
      continue;
    }
    unused.delete(candidates[0]);
  }

  const enrolled = new Set(tournament.clubIds);
  const toDelete = [...unused].filter((m) => {
    if (!enrolled.has(m.homeClubId) || !enrolled.has(m.awayClubId)) {
      return !isPlayed(m);
    }
    return !isPlayed(m);
  });

  return { plan, toCreate, toDelete };
}

export function diffFixtures(tournament: Tournament, matches: Match[]) {
  const ofTournament = matches.filter((m) => m.tournamentId === tournament.id);
  if (tournament.clubIds.length < 2) {
    return {
      plan: [] as PlannedFixture[],
      toCreate: [] as PlannedFixture[],
      toDelete: ofTournament.filter((m) => !isPlayed(m)),
    };
  }
  if (tournamentLegs(tournament) === 1) {
    return diffSingleLeg(tournament, ofTournament);
  }
  return diffDoubleLeg(tournament, ofTournament);
}

/** Partidos de vuelta ya jugados que se borrarían al pasar esta categoría a 1 partido. */
export function playedReturnsIfSingleLeg(
  tournament: Tournament,
  matches: Match[],
) {
  const { toDelete } = diffFixtures({ ...tournament, legs: 1 }, matches);
  return toDelete.filter(isPlayed);
}

async function commitInChunks(
  ops: Array<(batch: ReturnType<typeof writeBatch>) => void>,
) {
  const CHUNK = 400;
  for (let i = 0; i < ops.length; i += CHUNK) {
    const batch = writeBatch(db);
    ops.slice(i, i + CHUNK).forEach((apply) => apply(batch));
    await batch.commit();
  }
}

export type LateEntryChoice = "walkover" | "play";

/** Jornadas en las que todos los partidos, sin contar a los clubes nuevos, ya se jugaron. */
export function completedRounds(matches: Match[], newClubIds: Iterable<string>) {
  const fresh = new Set(newClubIds);
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    if (fresh.has(m.homeClubId) || fresh.has(m.awayClubId)) continue;
    const key = m.round?.trim() || "—";
    const list = map.get(key) || [];
    list.push(m);
    map.set(key, list);
  }
  const done = new Set<string>();
  for (const [round, list] of map) {
    if (list.length > 0 && list.every(isPlayed)) done.add(round);
  }
  return done;
}

/** El cruce cae en una jornada ya completa y solo uno de los dos acaba de entrar. */
export function isLateWalkoverFixture(
  fixture: PlannedFixture,
  newClubIds: Set<string>,
  doneRounds: Set<string>,
) {
  if (!doneRounds.has(fixture.round)) return false;
  const homeNew = newClubIds.has(fixture.homeClubId);
  const awayNew = newClubIds.has(fixture.awayClubId);
  return homeNew !== awayNew;
}

function walkoverScores(
  homeClubId: string,
  awayClubId: string,
  newClubIds: Set<string>,
) {
  const newIsHome = newClubIds.has(homeClubId);
  return { homeScore: newIsHome ? 0 : 3, awayScore: newIsHome ? 3 : 0 };
}

function coversFixture(m: Match, fixture: PlannedFixture, singleLeg: boolean) {
  if (singleLeg) {
    return unorderedKey(m.homeClubId, m.awayClubId) === unorderedKey(fixture.homeClubId, fixture.awayClubId);
  }
  return samePair(m, fixture);
}

/**
 * Cruces contra un equipo que ya estaba, en jornadas ya completas.
 * Si los dos acaban de entrar, no entra: ese partido se juega.
 */
export function lateWalkoverFixtures(
  tournament: Tournament,
  matches: Match[],
  newClubIds: string[],
): PlannedFixture[] {
  if (newClubIds.length === 0 || tournament.clubIds.length < 2) return [];
  const ofTournament = matches.filter((m) => m.tournamentId === tournament.id);
  const fresh = new Set(newClubIds);
  const done = completedRounds(ofTournament, fresh);
  if (done.size === 0) return [];
  const single = tournamentLegs(tournament) === 1;
  const plan = generateRoundRobin(tournament.clubIds, tournamentLegs(tournament));
  return plan.filter((fixture) => {
    if (!isLateWalkoverFixture(fixture, fresh, done)) return false;
    const existing = ofTournament.find((m) => coversFixture(m, fixture, single));
    return !existing || !isPlayed(existing);
  });
}

/**
 * Crea los partidos que faltan y borra los que ya no aplican
 * (club dado de baja, paso a 1 partido, duplicados).
 * `walkover` otorga 3-0 al equipo que ya estaba en las jornadas completas.
 */
export async function syncTournamentFixtures(
  tournament: Tournament,
  matches: Match[],
  options?: { lateEntry?: LateEntryChoice; newClubIds?: string[] },
) {
  const ofTournament = matches.filter((m) => m.tournamentId === tournament.id);
  const { toCreate, toDelete } = diffFixtures(tournament, matches);
  const fresh = new Set(options?.newClubIds ?? []);
  const award = options?.lateEntry === "walkover" && fresh.size > 0;
  const done = award ? completedRounds(ofTournament, fresh) : new Set<string>();
  const single = tournamentLegs(tournament) === 1;
  const plan = award
    ? generateRoundRobin(tournament.clubIds, tournamentLegs(tournament))
    : [];
  const qualifies = (fixture: PlannedFixture) =>
    isLateWalkoverFixture(fixture, fresh, done);
  const deleting = new Set(toDelete.map((m) => m.id));

  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  if (award) {
    for (const match of ofTournament) {
      if (isPlayed(match) || deleting.has(match.id)) continue;
      const fixture = plan.find((item) => qualifies(item) && coversFixture(match, item, single));
      if (!fixture) continue;
      const scores = walkoverScores(match.homeClubId, match.awayClubId, fresh);
      ops.push((batch) =>
        batch.update(matchRef(match.id), {
          round: fixture.round,
          status: "played",
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
          walkover: true,
          date: "",
          time: "",
          venue: "",
          courtId: "",
          sides: {},
        }),
      );
    }
  }

  for (const fixture of toCreate) {
    const ref = doc(matchesCol());
    const awarded = award && qualifies(fixture);
    const scores = awarded
      ? walkoverScores(fixture.homeClubId, fixture.awayClubId, fresh)
      : null;
    ops.push((batch) =>
      batch.set(ref, {
        tournamentId: tournament.id,
        seasonId: tournament.seasonId,
        categoryId: tournament.categoryId,
        round: fixture.round,
        homeClubId: fixture.homeClubId,
        awayClubId: fixture.awayClubId,
        clubIds: [fixture.homeClubId, fixture.awayClubId],
        date: "",
        time: "",
        venue: "",
        status: awarded ? "played" : "unscheduled",
        ...(scores
          ? { homeScore: scores.homeScore, awayScore: scores.awayScore, walkover: true }
          : {}),
        sides: {},
        createdAt: serverTimestamp(),
      }),
    );
  }

  for (const extra of toDelete) {
    ops.push((batch) => batch.delete(matchRef(extra.id)));
  }

  if (ops.length === 0) return;
  await commitInChunks(ops);
}
