import type { MatchDetailData, MatchPreviewData } from "../../infrastructure/dataconnect";
import { courtPlaceLabel } from "../../domains/courts/courts";
import { formationNodes } from "../../domains/matches/formations";
import {
  LIVE_MARGIN_MINUTES,
  liveMatchWindow,
  liveMinuteLabel,
  matchPagePhase,
  type MatchPagePhase,
} from "../../domains/matches/liveMatchPhase";
import { formatFriendlyDate, formatFriendlyTime, formatShortDate } from "../../shared/helpers";
import { matchPath } from "../../shared/paths";
import { asMatchDuration } from "../../shared/types";
import type {
  FormPillView,
  FormResult,
  HeadToHeadItemView,
  LineupTokenView,
  MatchDetailView,
  MatchPreviewView,
  MatchSide,
  RosterPlayerView,
  SquadPlayerView,
  StandingSummaryView,
  TeamLineupView,
  TimelineEventView,
  TimelineKind,
} from "./matchDetailViewState";

type MatchRow = MatchDetailData["matches"][number];
type ClubRow = MatchRow["homeClub"];
type PlayerRow = ClubRow["players_on_club"][number];

const MINUTE = 60_000;
/** Se sigue consultando un rato después de la hora de fin: el superadmin puede finalizar tarde. */
const POLL_AFTER_END_MS = 60 * MINUTE;
const POLL_BEFORE_START_MS = 2 * MINUTE;
const UNASSIGNED = "Sin asignar";

const STATUS_LABEL: Record<MatchPagePhase, string> = {
  unscheduled: "Por programar",
  upcoming: "Próximo",
  live: "En vivo",
  pending: "Por confirmar",
  final: "Final",
};

function shirt(value: string | null | undefined) {
  const text = (value || "").trim();
  return text && text.toUpperCase() !== "S/N" ? text : null;
}

/** «Juan Pérez» → «J. Pérez»; un solo nombre se deja igual. */
function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();
  return `${parts[0].charAt(0)}. ${parts.slice(1).join(" ")}`;
}

function count(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function phaseOf(match: MatchRow, now: Date) {
  return matchPagePhase(
    {
      status: match.status,
      walkover: match.walkover,
      matchDate: match.matchDate,
      startTime: match.startTime,
      durationMinutes: asMatchDuration(match.tournament.durationMinutes),
      marginMinutes: LIVE_MARGIN_MINUTES,
    },
    now,
  );
}

function kickoff(match: MatchRow) {
  return (
    liveMatchWindow(
      match.matchDate || "",
      match.startTime || "",
      asMatchDuration(match.tournament.durationMinutes),
      LIVE_MARGIN_MINUTES,
    )?.start ?? null
  );
}

/** Mientras el partido no esté finalizado y esté cerca de su horario, se consulta cada 15 s. */
export function shouldPoll(data: MatchDetailData | null, now: Date): boolean {
  const match = data?.matches[0];
  if (!match || match.status === "PLAYED" || match.walkover) return false;
  const window = liveMatchWindow(
    match.matchDate || "",
    match.startTime || "",
    asMatchDuration(match.tournament.durationMinutes),
    LIVE_MARGIN_MINUTES,
  );
  if (!window) return false;
  const at = now.getTime();
  return window.start - POLL_BEFORE_START_MS <= at && at < window.end + POLL_AFTER_END_MS;
}

interface PlayerTally {
  goals: number;
  ownGoals: number;
  yellow: number;
  red: number;
}

function tallies(match: MatchRow) {
  const byPlayer = new Map<string, PlayerTally>();
  const get = (id: string) => {
    let row = byPlayer.get(id);
    if (!row) {
      row = { goals: 0, ownGoals: 0, yellow: 0, red: 0 };
      byPlayer.set(id, row);
    }
    return row;
  };
  for (const goal of match.matchGoals_on_match) {
    if (!goal.scorer?.id) continue;
    const row = get(goal.scorer.id);
    if (goal.isOwnGoal) row.ownGoals += 1;
    else row.goals += 1;
  }
  for (const card of match.matchCards_on_match) {
    if (!card.player?.id) continue;
    const row = get(card.player.id);
    if (card.color === "RED") row.red += 1;
    else row.yellow += 1;
  }
  return (id: string | null): PlayerTally => (id && byPlayer.get(id)) || { goals: 0, ownGoals: 0, yellow: 0, red: 0 };
}

function timelineOf(match: MatchRow, sideOf: (clubId: string) => MatchSide): TimelineEventView[] {
  type Row = { minute: number | null; order: number; event: Omit<TimelineEventView, "scoreAfter"> };
  const rows: Row[] = [];
  match.matchGoals_on_match.forEach((goal, index) => {
    const kind: TimelineKind = goal.isOwnGoal ? "ownGoal" : goal.isPenalty ? "penalty" : "goal";
    const assist = goal.assistName.trim() || goal.assist?.name?.trim() || "";
    rows.push({
      minute: goal.minute ?? null,
      order: index,
      event: {
        id: goal.id,
        source: "goal",
        kind,
        side: sideOf(goal.club.id),
        minuteLabel: goal.minute != null ? `${goal.minute}'` : null,
        playerName: goal.scorerName.trim() || goal.scorer?.name?.trim() || UNASSIGNED,
        detail: goal.isOwnGoal ? "Autogol" : goal.isPenalty ? "Penal" : assist ? `Asist.: ${assist}` : null,
      },
    });
  });
  match.matchCards_on_match.forEach((card, index) => {
    rows.push({
      minute: card.minute ?? null,
      order: 1000 + index,
      event: {
        id: card.id,
        source: "card",
        kind: card.color === "RED" ? "red" : "yellow",
        side: sideOf(card.club.id),
        minuteLabel: card.minute != null ? `${card.minute}'` : null,
        playerName: card.playerName.trim() || card.player?.name?.trim() || UNASSIGNED,
        detail: null,
      },
    });
  });
  // Por minuto (sin minuto al final); en el mismo minuto, goles antes que tarjetas.
  rows.sort((a, b) => {
    if (a.minute !== b.minute) {
      if (a.minute == null) return 1;
      if (b.minute == null) return -1;
      return a.minute - b.minute;
    }
    return a.order - b.order;
  });
  let home = 0;
  let away = 0;
  return rows.map(({ event }) => {
    if (event.source !== "goal") return { ...event, scoreAfter: null };
    if (event.side === "home") home += 1;
    else away += 1;
    return { ...event, scoreAfter: `${home}–${away}` };
  });
}

function percent(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 100) : 50;
}

function squadOf(players: PlayerRow[], tally: ReturnType<typeof tallies>): SquadPlayerView[] {
  return players.map((player) => {
    const row = tally(player.id);
    return {
      id: player.id,
      name: player.name,
      shirtNumber: shirt(player.shirtNumber),
      position: player.position?.trim() ?? "",
      goals: row.goals,
      yellow: row.yellow,
      red: row.red,
    };
  });
}

function lineupOf(
  side: MatchSide,
  club: ClubRow,
  lineup: unknown,
  attendeeIds: Set<string>,
  tally: ReturnType<typeof tallies>,
): TeamLineupView {
  const players = club.players_on_club.filter((player) => !player.isCoach);
  const byId = new Map(players.map((player) => [player.id, player]));
  const byName = new Map(players.map((player) => [player.name.trim().toLowerCase(), player]));
  const raw = lineup && typeof lineup === "object" ? (lineup as Record<string, unknown>) : {};
  const nodes = formationNodes(raw.mode, raw.formation);
  const positions =
    raw.positions && typeof raw.positions === "object" ? (raw.positions as Record<string, unknown>) : {};
  const starters: LineupTokenView[] = [];
  const used = new Set<string>();
  for (const node of nodes ?? []) {
    const value = positions[node.id];
    if (typeof value !== "string" || !value.trim()) continue;
    const player = byId.get(value) ?? byName.get(value.trim().toLowerCase()) ?? null;
    const name = player ? player.name : value.replace(/^guest-/, "").trim();
    if (!name) continue;
    if (player) used.add(player.id);
    const row = tally(player?.id ?? null);
    const top = percent(node.top);
    const left = percent(node.left);
    // Una sola cancha vertical: el local abajo, el visitante arriba y espejado.
    starters.push({
      key: `${side}-${node.id}`,
      name,
      shortName: shortName(name),
      shirtNumber: player ? shirt(player.shirtNumber) : null,
      imageUrl: player?.imageUrl?.trim() || null,
      goals: row.goals,
      ownGoals: row.ownGoals,
      yellow: row.yellow,
      red: row.red,
      top: side === "home" ? 50 + top / 2 : 50 - top / 2,
      left: side === "home" ? left : 100 - left,
    });
  }
  const called = players.filter((player) => attendeeIds.has(player.id));
  const pool = called.length > 0 ? called : players;
  const coach = club.players_on_club.find((player) => player.isCoach && player.name.trim());
  return {
    side,
    name: club.name,
    logoUrl: club.logoUrl?.trim() || null,
    formation: nodes && typeof raw.formation === "string" ? raw.formation : null,
    starters,
    bench: squadOf(
      pool.filter((player) => !used.has(player.id)),
      tally,
    ),
    benchIsSquad: called.length === 0,
    coach: coach ? coach.name.trim() : null,
  };
}

function rosterOf(club: ClubRow, attendeeIds: Set<string>): RosterPlayerView[] {
  return club.players_on_club
    .filter((player) => !player.isCoach && player.name.trim())
    .map((player) => ({
      id: player.id,
      name: player.name,
      shirtNumber: shirt(player.shirtNumber),
      convocado: attendeeIds.has(player.id),
    }))
    .sort((a, b) => Number(b.convocado) - Number(a.convocado) || a.name.localeCompare(b.name, "es"));
}

export function toMatchDetail(data: MatchDetailData, now: Date): MatchDetailView | null {
  const match = data.matches[0];
  if (!match) return null;
  const phase = phaseOf(match, now);
  const homeId = match.homeClub.id;
  const awayId = match.awayClub.id;
  const sideOf = (clubId: string): MatchSide => (clubId === homeId ? "home" : "away");
  const durationMinutes = asMatchDuration(match.tournament.durationMinutes);
  const start = kickoff(match);
  const tally = tallies(match);

  const attendees = { home: new Set<string>(), away: new Set<string>() };
  for (const row of match.matchAttendees_on_match) attendees[sideOf(row.club.id)].add(row.player.id);
  const reports = new Map(match.matchClubReports_on_match.map((row) => [row.club.id, row]));

  const goals = { home: 0, away: 0 };
  for (const goal of match.matchGoals_on_match) goals[sideOf(goal.club.id)] += 1;
  const cards = { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } };
  for (const card of match.matchCards_on_match) {
    const side = cards[sideOf(card.club.id)];
    if (card.color === "RED") side.red += 1;
    else side.yellow += 1;
  }

  const showScore = phase === "live" || phase === "pending" || phase === "final";
  const homeScore = showScore ? (count(match.homeScore) ?? goals.home) : null;
  const awayScore = showScore ? (count(match.awayScore) ?? goals.away) : null;
  const penaltiesHome = count(match.penaltiesHome);
  const penaltiesAway = count(match.penaltiesAway);
  const venue = courtPlaceLabel(match.court?.location, match.court?.name) || match.venue.trim();
  const mvps = match.matchClubReports_on_match
    .map((row) => row.mvp?.name?.trim())
    .filter((name): name is string => Boolean(name));

  const convocados = {
    home: squadOf(
      match.homeClub.players_on_club.filter((player) => attendees.home.has(player.id)),
      tally,
    ),
    away: squadOf(
      match.awayClub.players_on_club.filter((player) => attendees.away.has(player.id)),
      tally,
    ),
  };

  const stats = [
    { label: "Goles", home: goals.home, away: goals.away },
    { label: "Amarillas", home: cards.home.yellow, away: cards.away.yellow },
    { label: "Rojas", home: cards.home.red, away: cards.away.red },
    { label: "Convocados", home: attendees.home.size, away: attendees.away.size },
  ];

  const scoreText = homeScore != null && awayScore != null ? `${homeScore}–${awayScore}` : "vs";

  return {
    id: match.id,
    header: {
      phase,
      statusLabel: match.walkover ? "W.O." : STATUS_LABEL[phase],
      minuteLabel: phase === "live" && start != null ? liveMinuteLabel(start, now, durationMinutes) : null,
      home: {
        id: homeId,
        name: match.homeClub.name,
        href: `/${match.homeClub.slug}`,
        logoUrl: match.homeClub.logoUrl?.trim() || null,
        score: homeScore,
      },
      away: {
        id: awayId,
        name: match.awayClub.name,
        href: `/${match.awayClub.slug}`,
        logoUrl: match.awayClub.logoUrl?.trim() || null,
        score: awayScore,
      },
      penaltiesLabel:
        penaltiesHome != null && penaltiesAway != null ? `${penaltiesHome}–${penaltiesAway} pen.` : null,
      walkover: match.walkover,
      dateLabel: match.matchDate ? formatFriendlyDate(match.matchDate) : null,
      timeLabel: match.startTime ? formatFriendlyTime(match.startTime) : null,
      venue: venue || null,
      courtImage: match.court?.imageUrl?.trim() || null,
      tournamentName: match.tournament.name,
      tournamentHref: `/torneos/${match.tournament.id}`,
      category: match.tournament.category.name,
      round: match.roundLabel,
    },
    timeline: timelineOf(match, sideOf),
    lineups: {
      home: lineupOf("home", match.homeClub, reports.get(homeId)?.lineup, attendees.home, tally),
      away: lineupOf("away", match.awayClub, reports.get(awayId)?.lineup, attendees.away, tally),
    },
    stats,
    mvp: mvps.length > 0 ? mvps.join(" · ") : null,
    convocados,
    roster: {
      home: rosterOf(match.homeClub, attendees.home),
      away: rosterOf(match.awayClub, attendees.away),
    },
    liveEditable: match.status === "SCHEDULED" && !match.walkover,
    kickoffMs: start,
    durationMinutes,
    tournamentId: match.tournament.id,
    homeClubId: homeId,
    awayClubId: awayId,
    shareText: `${match.homeClub.name} ${scoreText} ${match.awayClub.name}`,
  };
}

type PreviewMatch = MatchPreviewData["matches"][number];

function resultFor(match: PreviewMatch, clubId: string): FormResult | null {
  const home = count(match.homeScore);
  const away = count(match.awayScore);
  if (home == null || away == null) return null;
  const mine = match.homeClub.id === clubId ? home : away;
  const theirs = match.homeClub.id === clubId ? away : home;
  return mine > theirs ? "G" : mine < theirs ? "P" : "E";
}

function formOf(matches: PreviewMatch[], clubId: string, tournamentId: string): FormPillView[] {
  return matches
    .filter(
      (match) =>
        match.tournament.id === tournamentId &&
        (match.homeClub.id === clubId || match.awayClub.id === clubId),
    )
    .flatMap((match) => {
      const result = resultFor(match, clubId);
      if (!result) return [];
      const rival = match.homeClub.id === clubId ? match.awayClub.name : match.homeClub.name;
      const mine = match.homeClub.id === clubId ? match.homeScore : match.awayScore;
      const theirs = match.homeClub.id === clubId ? match.awayScore : match.homeScore;
      return [{ id: match.id, result, title: `vs ${rival} ${mine}–${theirs}` }];
    })
    .slice(0, 5);
}

function standingOf(rows: MatchPreviewData["tournamentStandings"], clubId: string): StandingSummaryView {
  const row = rows.find((item) => item.club?.id === clubId);
  if (!row || !row.pj || row.standingRank == null) {
    return { label: null, rankLabel: null, points: null, breakdown: [] };
  }
  const rankLabel = `${row.standingRank}.º de ${rows.length}`;
  const points = row.pts ?? 0;
  return {
    label: `${rankLabel} · ${points} pts`,
    rankLabel,
    points,
    breakdown: [
      { label: "PJ", value: row.pj },
      { label: "G", value: row.g ?? 0 },
      { label: "E", value: row.e ?? 0 },
      { label: "P", value: row.p ?? 0 },
      { label: "GF", value: row.gf ?? 0 },
      { label: "GC", value: row.gc ?? 0 },
      { label: "DG", value: row.dg ?? 0 },
    ],
  };
}

export function toMatchPreview(
  data: MatchPreviewData,
  matchId: string,
  tournamentId: string,
  homeId: string,
  awayId: string,
): MatchPreviewView {
  const played = data.matches.filter((match) => match.id !== matchId);
  const meetings = played.filter(
    (match) =>
      (match.homeClub.id === homeId && match.awayClub.id === awayId) ||
      (match.homeClub.id === awayId && match.awayClub.id === homeId),
  );
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  for (const match of meetings) {
    const result = resultFor(match, homeId);
    if (result === "G") homeWins += 1;
    else if (result === "P") awayWins += 1;
    else if (result === "E") draws += 1;
  }
  const items: HeadToHeadItemView[] = meetings.slice(0, 5).map((match) => ({
    id: match.id,
    dateLabel: match.matchDate ? formatShortDate(match.matchDate) : "",
    line: `${match.homeClub.name} ${count(match.homeScore) ?? "–"}–${count(match.awayScore) ?? "–"} ${match.awayClub.name}`,
    tournament: match.tournament.name,
    href: matchPath(match.id),
  }));
  return {
    standings: {
      home: standingOf(data.tournamentStandings, homeId),
      away: standingOf(data.tournamentStandings, awayId),
      ready: data.tournamentStandings.some((row) => (row.pj ?? 0) > 0),
    },
    form: {
      home: formOf(played, homeId, tournamentId),
      away: formOf(played, awayId, tournamentId),
    },
    headToHead: { items, homeWins, draws, awayWins },
  };
}
