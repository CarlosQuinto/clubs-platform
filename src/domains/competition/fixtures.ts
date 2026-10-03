import { isPlayed } from "./stats";
import type { Match, Tournament } from "../../shared/types";

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
