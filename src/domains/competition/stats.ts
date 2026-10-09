import { walkoverNote } from "../matches/noShow";
import type {
  Match,
  MatchSide,
  ScorerRow,
  Season,
  StandingRow,
  StatsScope,
  Tournament,
} from "../../shared/types";
import { isoDate } from "../../shared/helpers";

/**
 * Temporadas que ya empezaron (sin fecha cuentan como iniciadas): los filtros públicos no ofrecen las
 * futuras. Si ninguna empezó se devuelven todas para no dejar el selector vacío.
 */
export function startedSeasons<T extends { startDate?: string | null }>(seasons: T[], today = isoDate()): T[] {
  const started = seasons.filter((season) => !season.startDate || season.startDate <= today);
  return started.length ? started : seasons;
}

/** Temporada activa o, si no hay, la que empezó más tarde. */
export function defaultSeasonId(seasons: Season[]): string | undefined {
  const active = seasons.find((season) => season.active);
  if (active) return active.id;
  const latest = [...seasons].sort((a, b) =>
    (b.startDate || "").localeCompare(a.startDate || ""),
  )[0];
  return latest?.id;
}

export const isPlayed = (m: Match) =>
  m.status === "played" && m.homeScore != null && m.awayScore != null;

export type CalendarStatus = "unscheduled" | "scheduled" | "played";

export const calendarStatus = (m: Match): CalendarStatus => {
  if (isPlayed(m)) return "played";
  if (m.date && m.time) return "scheduled";
  return "unscheduled";
};

export const CALENDAR_STATUS_LABEL: Record<CalendarStatus, string> = {
  unscheduled: "Debe programarse",
  scheduled: "Programado",
  played: "Finalizado",
};

export const matchDateTime = (m: Match) =>
  new Date(`${m.date || "1970-01-01"}T${m.time || "00:00"}`);

export const sortByDate = <T extends { date?: string; time?: string }>(
  list: T[],
  dir: "asc" | "desc" = "asc",
) =>
  [...list].sort((a, b) => {
    const da = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`).getTime();
    const dbb = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}`).getTime();
    const na = Number.isFinite(da) ? da : 0;
    const nb = Number.isFinite(dbb) ? dbb : 0;
    return dir === "asc" ? na - nb : nb - na;
  });

const STATUS_ORDER: Record<CalendarStatus, number> = {
  unscheduled: 0,
  scheduled: 1,
  played: 2,
};

export function sortCalendarMatches(matches: Match[]) {
  return [...matches].sort((a, b) => {
    const ra = Number(a.round);
    const rb = Number(b.round);
    const aNum = Number.isFinite(ra) ? ra : 999;
    const bNum = Number.isFinite(rb) ? rb : 999;
    if (aNum !== bNum) return aNum - bNum;
    const sa = STATUS_ORDER[calendarStatus(a)];
    const sb = STATUS_ORDER[calendarStatus(b)];
    if (sa !== sb) return sa - sb;
    if (a.date && b.date) {
      return `${a.date}T${a.time || ""}`.localeCompare(`${b.date}T${b.time || ""}`);
    }
    return 0;
  });
}

export function groupMatchesByRound(matches: Match[]) {
  const map = new Map<string, Match[]>();
  for (const m of sortCalendarMatches(matches)) {
    const key = m.round?.trim() || "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return [...map.entries()].map(([round, list]) => ({ round, list }));
}

export const applyScope = (matches: Match[], scope: StatsScope) =>
  matches.filter(
    (m) =>
      (!scope.seasonId || m.seasonId === scope.seasonId) &&
      (!scope.categoryId || m.categoryId === scope.categoryId),
  );

export const applyTournamentScope = (tournaments: Tournament[], scope: StatsScope) =>
  tournaments.filter(
    (t) =>
      (!scope.seasonId || t.seasonId === scope.seasonId) &&
      (!scope.categoryId || t.categoryId === scope.categoryId),
  );

/** Clubes del filtro: inscritos en torneos del alcance y/o con partidos oficiales. */
export function rankingClubIds(tournaments: Tournament[], matches: Match[]) {
  const ids = new Set<string>();
  for (const t of tournaments) {
    for (const id of t.clubIds || []) if (id) ids.add(id);
  }
  for (const m of matches) {
    if (m.homeClubId) ids.add(m.homeClubId);
    if (m.awayClubId) ids.add(m.awayClubId);
  }
  return [...ids];
}

export const pointsEffectiveness = (row: StandingRow) =>
  row.pj > 0 ? Math.round((row.pts / (row.pj * 3)) * 100) : 0;

export interface ClubHonour {
  clubId: string;
  titles: number;
  podiums: number;
}

/** Palmarés agregado: campeonatos (1º) y podios (1–2–3) de torneos cerrados. */
export function computeClubHonours(tournaments: Tournament[]): ClubHonour[] {
  const map = new Map<string, ClubHonour>();
  for (const t of tournaments) {
    if (t.status !== "finished" || !t.podium) continue;
    for (const [pos, clubId] of Object.entries(t.podium)) {
      if (!clubId) continue;
      const row = map.get(clubId) || { clubId, titles: 0, podiums: 0 };
      const p = Number(pos);
      if (p === 1) row.titles += 1;
      if (p >= 1 && p <= 3) row.podiums += 1;
      map.set(clubId, row);
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      b.titles - a.titles || b.podiums - a.podiums || a.clubId.localeCompare(b.clubId),
  );
}

/** Tabla de posiciones (3 pts victoria, 1 empate). */
export function computeStandings(
  matches: Match[],
  clubIds: string[] = [],
): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  const ensure = (id: string) => {
    if (!rows.has(id))
      rows.set(id, { clubId: id, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
    return rows.get(id)!;
  };
  clubIds.forEach(ensure);

  matches.filter(isPlayed).forEach((m) => {
    const home = ensure(m.homeClubId);
    const away = ensure(m.awayClubId);
    const hs = m.homeScore as number;
    const as = m.awayScore as number;
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
    .map((r) => ({ ...r, dg: r.gf - r.gc }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.clubId.localeCompare(b.clubId));
}

/** Récord de un club sobre un conjunto de partidos. */
export function computeTeamRecord(matches: Match[], clubId: string) {
  const row = computeStandings(matches.filter((m) => m.clubIds?.includes(clubId)), [clubId])
    .find((r) => r.clubId === clubId);
  return row || { clubId, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
}

/**
 * Goleadores de un conjunto de partidos, a partir de los lados registrados por cada club.
 * El nombre es el del partido más reciente de ese jugador. Un autogol no suma.
 * La copia de esta regla vive en functions/src/tournamentTables.ts.
 */
export function computeTopScorers(matches: Match[]): ScorerRow[] {
  const map = new Map<string, ScorerRow>();
  const played = matches.filter(isPlayed).sort((a, b) => {
    const ta = matchDateTime(a).getTime();
    const tb = matchDateTime(b).getTime();
    const byTime = (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
    if (byTime !== 0) return byTime;
    return a.id.localeCompare(b.id);
  });
  for (const m of played) {
    Object.entries(m.sides || {}).forEach(([clubId, side]) => {
      const names = side.playerNames || {};
      (side.stats || []).forEach((s) => {
        if (s.isOwnGoal) return;
        if (s.scorer) {
          const key = `${clubId}:${s.scorer}`;
          const row =
            map.get(key) ||
            { playerId: s.scorer, name: names[s.scorer] || s.scorer, clubId, goals: 0, assists: 0 };
          row.goals++;
          row.name = names[s.scorer] || s.scorer;
          map.set(key, row);
        }
        if (s.assist) {
          const key = `${clubId}:${s.assist}`;
          const row =
            map.get(key) ||
            { playerId: s.assist, name: names[s.assist] || s.assist, clubId, goals: 0, assists: 0 };
          row.assists++;
          row.name = names[s.assist] || s.assist;
          map.set(key, row);
        }
      });
    });
  }
  return [...map.values()].sort(
    (a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name),
  );
}

export const podiumFromStandings = (rows: StandingRow[]) => {
  const podium: Record<string, string> = {};
  rows.slice(0, 3).forEach((r, i) => {
    podium[String(i + 1)] = r.clubId;
  });
  return podium;
};

/** Trofeos de un club: torneos finalizados donde quedó en el podio. */
export function clubTrophies(tournaments: Tournament[], clubId: string) {
  return tournaments
    .filter((t) => t.status === "finished" && t.podium)
    .flatMap((t) => {
      const entry = Object.entries(t.podium!).find(([, id]) => id === clubId);
      return entry ? [{ tournament: t, position: Number(entry[0]) }] : [];
    })
    .sort((a, b) => a.position - b.position);
}

/**
 * Convierte un partido oficial en la forma de "evento" que ya entienden los
 * módulos del club (usePlayerStats, HallOfFame, logros...). Así las estadísticas
 * oficiales de jugadores salen únicamente de los partidos de torneo.
 */
export function matchToClubEvent(
  m: Match,
  clubId: string,
  clubNames: Record<string, string>,
  tournamentName?: string,
) {
  const isHome = m.homeClubId === clubId;
  const rivalId = isHome ? m.awayClubId : m.homeClubId;
  const side: MatchSide = m.sides?.[clubId] || {};
  const played = isPlayed(m);
  return {
    id: `match_${m.id}`,
    matchId: m.id,
    isOfficial: true,
    eventType: "Partido",
    matchType: "Oficial",
    title: clubNames[rivalId] || rivalId,
    rivalId,
    isHome,
    tournamentId: m.tournamentId,
    tournamentName: tournamentName || "",
    round: m.round,
    eventDate: m.date,
    eventTime: m.time || "00:00",
    location:
      walkoverNote(m.walkover, m.noShow, clubNames[m.homeClubId] || "el local", clubNames[m.awayClubId] || "el visitante") ||
      m.venue ||
      "Por definir",
    scoreOurs: played ? (isHome ? m.homeScore : m.awayScore) : undefined,
    scoreTheirs: played ? (isHome ? m.awayScore : m.homeScore) : undefined,
    penaltiesOurs: isHome ? m.penaltiesHome ?? null : m.penaltiesAway ?? null,
    penaltiesTheirs: isHome ? m.penaltiesAway ?? null : m.penaltiesHome ?? null,
    attendees: side.attendees || [],
    lineup: side.lineup,
    stats: side.stats || [],
    goalkeepers: side.goalkeepers || [],
    mvp: side.mvp || "",
    yellowCards: side.yellowCards || [],
    redCards: side.redCards || [],
  };
}

export const positionLabel = (pos: number) =>
  pos === 1 ? "Campeón" : pos === 2 ? "Subcampeón" : pos === 3 ? "Tercer lugar" : `${pos}º lugar`;
