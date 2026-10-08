import { walkoverNote } from "../../domains/matches/noShow";
import {
  FootballType,
  type MatchScoreSheetData,
  type MatchSlotHintsData,
  MatchStatus,
  type TournamentScreenData,
  TournamentStatus,
} from "../../infrastructure/dataconnect";
import { courtPlaceLabel, suggestSlots, toMinutes } from "../../domains/courts/courts";
import { tournamentPhase } from "../../domains/competition/tournamentPhase";
import { formatFriendlyDate, formatFriendlyTime, formatShortDate } from "../../shared/helpers";
import { matchPath } from "../../shared/paths";
import { asCourtSlot, asMatchDuration, type Court, type CourtHold, type TimeWindow, type Weekday } from "../../shared/types";
import { clubInitials } from "../teams/teamsMapper";
import type { LiveMatchView, UpcomingMatchView } from "../matches/matchesViewState";
import type {
  CalendarCardView,
  CalendarMatchView,
  ClubMark,
  MatchScoreSheetView,
  PodiumSlotView,
  RoundView,
  ScoreCardView,
  ScoreGoalView,
  TournamentScreenView,
} from "./tournamentViewState";

const FOOTBALL_LABEL: Record<FootballType, string> = {
  [FootballType.FUT_7]: "Fútbol 7",
  [FootballType.FUT_9]: "Fútbol 9",
  [FootballType.FUT_11]: "Fútbol 11",
};

const PODIUM_ORDER = [2, 1, 3] as const;

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const PLACE_LABEL: Record<number, string> = {
  1: "Campeón",
  2: "Subcampeón",
  3: "Tercero",
};

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatCalendarDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormat.format(date);
}

function count(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function clubHref(slug: string | null | undefined): string | null {
  const clean = slug?.trim();
  return clean ? `/${clean}` : null;
}

function roundNumber(label: string | null | undefined): string {
  const trimmed = label?.trim() || "";
  const prefixed = trimmed.match(/^jornada\s+(.+)$/i);
  return (prefixed ? prefixed[1] : trimmed) || "—";
}

function mark(
  club: { id: string; name: string; slug?: string | null; logoUrl?: string | null } | null | undefined,
): ClubMark {
  return {
    id: club?.id || "",
    name: club?.name || "Club",
    slug: club?.slug?.trim() || null,
    logoUrl: club?.logoUrl?.trim() || null,
  };
}

function toPodium(
  places: TournamentScreenData["tournaments"][number]["tournamentPodiums_on_tournament"],
): PodiumSlotView[] {
  return PODIUM_ORDER.map((place) => {
    const slot = places.find((item) => item.place === place);
    return {
      placeLabel: PLACE_LABEL[place],
      clubName: slot?.club.name ?? null,
      clubHref: clubHref(slot?.club.slug),
      logoUrl: slot?.club.logoUrl?.trim() || null,
    };
  });
}

type ScreenMatch = TournamentScreenData["matches"][number];

function dateParts(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { day, month: MONTHS[month - 1] || "" };
}

function score(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Tarjeta de próximo partido (la misma de portada y /partidos), sin categoría ni torneo: ya están en la cabecera. */
function toFixture(
  match: CalendarMatchView,
  durationMinutes: number,
  startDate: string,
): UpcomingMatchView {
  const date = dateParts(match.isoDate);
  return {
    id: match.id,
    href: matchPath(match.id),
    isoDate: date ? match.isoDate : "",
    day: date?.day ?? 0,
    month: date?.month ?? "",
    dateLabel: date ? formatFriendlyDate(match.isoDate) : "",
    time: match.time,
    timeLabel: match.time ? formatFriendlyTime(match.time) : null,
    venue: match.venue || null,
    homeClubId: match.home.id,
    awayClubId: match.away.id,
    homeName: match.home.name,
    awayName: match.away.name,
    homeLogo: match.home.logoUrl,
    awayLogo: match.away.logoUrl,
    categoryName: "",
    tournamentName: "",
    courtId: match.courtId,
    durationMinutes,
    tournamentStartDate: startDate,
  };
}

/** Tarjeta de marcador (la de «Resultados de hoy» en la portada) con la fecha del partido. */
function toResult(match: CalendarMatchView, row: ScreenMatch): LiveMatchView {
  const penaltiesHome = score(row.penaltiesHome);
  const penaltiesAway = score(row.penaltiesAway);
  return {
    id: match.id,
    href: matchPath(match.id),
    phase: "finished",
    pending: false,
    minuteLabel: null,
    homeName: match.home.name,
    awayName: match.away.name,
    homeLogo: match.home.logoUrl,
    awayLogo: match.away.logoUrl,
    homeScore: match.homeScore ?? 0,
    awayScore: match.awayScore ?? 0,
    penaltiesLabel:
      penaltiesHome != null && penaltiesAway != null ? `${penaltiesHome}–${penaltiesAway} pen.` : null,
    walkover: match.walkover,
    walkoverNote: match.noShow ? walkoverNote(true, match.noShow, match.home.name, match.away.name) : null,
    subtitle: formatShortDate(match.isoDate),
    timeLabel: match.time ? formatFriendlyTime(match.time) : "",
    venue: match.venue || null,
  };
}

function toRounds(matches: ScreenMatch[], durationMinutes: number, startDate: string): RoundView[] {
  const rounds: RoundView[] = [];
  for (const match of matches) {
    const label = roundNumber(match.roundLabel);
    const row: CalendarMatchView = {
      id: match.id,
      round: label,
      isoDate: match.matchDate || "",
      time: match.startTime || "",
      venue: courtPlaceLabel(match.court?.location, match.court?.name) || match.venue.trim(),
      courtId: match.court?.id || "",
      home: mark(match.homeClub),
      away: mark(match.awayClub),
      homeScore: match.homeScore ?? null,
      awayScore: match.awayScore ?? null,
      played: match.status === MatchStatus.PLAYED,
      walkover: match.walkover,
      noShow: match.noShow ?? null,
    };
    const card: CalendarCardView = {
      score: row,
      fixture: row.played ? null : toFixture(row, durationMinutes, startDate),
      result: row.played ? toResult(row, match) : null,
    };
    const current = rounds[rounds.length - 1];
    if (current && current.label === label) current.matches.push(card);
    else rounds.push({ label, collapsed: false, matches: [card] });
  }
  const open: RoundView[] = [];
  const finished: RoundView[] = [];
  for (const round of rounds) {
    const collapsed = round.matches.length > 0 && round.matches.every((match) => match.score.played);
    (collapsed ? finished : open).push({ ...round, collapsed });
  }
  return [...open, ...finished];
}

export function toTournamentScreen(data: TournamentScreenData, today: string): TournamentScreenView {
  const tournament = data.tournaments[0];
  if (!tournament) throw new Error("La respuesta no trae torneo.");
  const podium = toPodium(tournament.tournamentPodiums_on_tournament);
  const durationMinutes = asMatchDuration(tournament.durationMinutes);
  const startDate = tournament.startDate || "";
  return {
    title: tournament.name,
    subtitle: [
      tournament.season.name,
      tournament.category.name,
      FOOTBALL_LABEL[tournament.footballType],
    ]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" · "),
    phase: tournamentPhase(tournament.status, startDate || tournament.season.startDate, today),
    prize: (tournament.prize ?? "").trim(),
    durationMinutes,
    startDate,
    startLabel: formatCalendarDate(startDate || tournament.season.startDate),
    seasonActive: tournament.season.active,
    pendingMatches: data.matches.filter((match) => match.status !== MatchStatus.PLAYED).length,
    showPodium:
      tournament.status === TournamentStatus.FINISHED && podium.some((slot) => slot.clubName),
    podium,
    standings: data.tournamentStandings.map((row, index) => ({
      rank: count(row.standingRank) || index + 1,
      clubId: row.club?.id || "",
      clubName: row.club?.name || "Club",
      clubHref: clubHref(row.club?.slug),
      clubSlug: row.club?.slug?.trim() || null,
      logoUrl: row.club?.logoUrl?.trim() || null,
      initials: clubInitials(row.club?.name || "Club"),
      played: count(row.pj),
      won: count(row.g),
      drawn: count(row.e),
      lost: count(row.p),
      goalsFor: count(row.gf),
      goalsAgainst: count(row.gc),
      goalDiff: count(row.dg),
      points: count(row.pts),
    })),
    scorers: data.tournamentScorers.map((row) => ({
      playerId: row.player?.id || row.playerName || "",
      name: row.playerName?.trim() || "Sin nombre",
      clubId: row.club?.id || "",
      clubName: row.club?.name || "",
      clubLogo: row.club?.logoUrl?.trim() || null,
      imageUrl: row.player?.imageUrl?.trim() || "",
      goals: count(row.goals),
      assists: count(row.assists),
    })),
    rounds: toRounds(data.matches, durationMinutes, startDate),
  };
}

function playersOf(
  club: NonNullable<MatchScoreSheetData["matches"][number]["homeClub"]> | null | undefined,
) {
  return (club?.players_on_club ?? [])
    .filter((player) => player.name.trim())
    .map((player) => ({ id: player.id, name: player.name }));
}

function goalsOf(
  rows: MatchScoreSheetData["matches"][number]["matchGoals_on_match"],
  clubId: string,
): ScoreGoalView[] {
  return rows
    .filter((goal) => goal.club.id === clubId)
    .map((goal) => ({
      scorerId: goal.scorer?.id || "",
      assistId: goal.assist?.id || "",
      isPenalty: goal.isPenalty,
      isOwnGoal: goal.isOwnGoal,
      minute: goal.minute ?? null,
    }));
}

function cardsOf(
  rows: MatchScoreSheetData["matches"][number]["matchCards_on_match"],
  clubId: string,
  color: "YELLOW" | "RED",
): ScoreCardView[] {
  return rows
    .filter((card) => card.club.id === clubId && card.color === color && card.player?.id)
    .map((card) => ({ playerId: card.player!.id, minute: card.minute ?? null }));
}

function asWindow(row: { weekday: number; startTime: string; endTime: string }): TimeWindow | null {
  if (row.weekday < 1 || row.weekday > 7) return null;
  if (toMinutes(row.startTime) == null || toMinutes(row.endTime) == null) return null;
  if (row.startTime >= row.endTime) return null;
  return { day: row.weekday as Weekday, start: row.startTime, end: row.endTime };
}

function windowsOf(rows: { weekday: number; startTime: string; endTime: string }[]): TimeWindow[] {
  return rows.flatMap((row) => {
    const window = asWindow(row);
    return window ? [window] : [];
  });
}

export function toSlotHints(
  data: MatchSlotHintsData,
  homeClubId: string,
  awayClubId: string,
  fromDate: string,
  durationMinutes: number,
  ignoreMatchId: string,
) {
  const courts: Court[] = data.courts.map((court) => ({
    id: court.id,
    name: court.name,
    description: "",
    location: court.location ?? "",
    hourlyRate: 0,
    active: true,
    order: court.sortOrder,
    football: true,
  }));
  const holds: CourtHold[] = data.courtHolds.map((hold) => ({
    id: hold.match?.id || hold.court.id,
    courtId: hold.court.id,
    date: hold.holdDate,
    startTime: hold.startTime,
    endTime: hold.endTime,
    source: hold.match ? "match" : "manual",
    matchId: hold.match?.id,
  }));
  const clubWindows = (clubId: string) =>
    windowsOf(data.clubs.find((club) => club.id === clubId)?.clubAvailabilityWindows_on_club ?? []);
  const clubBusy = data.matches.flatMap((match) => {
    if (match.id === ignoreMatchId || !match.matchDate || !match.startTime) return [];
    const involved = match.homeClub.id === homeClubId || match.awayClub.id === homeClubId
      || match.homeClub.id === awayClubId || match.awayClub.id === awayClubId;
    if (!involved) return [];
    const start = toMinutes(match.startTime);
    if (start == null) return [];
    return [{
      date: match.matchDate,
      start,
      end: start + asMatchDuration(match.tournament.durationMinutes),
    }];
  });
  return {
    courts,
    openWindows: windowsOf(data.courtOpenWindows),
    slotMinutes: asCourtSlot(data.platformSettings?.courtSlotMinutes),
    suggestions: suggestSlots({
      fromDate,
      days: 21,
      slotMinutes: asCourtSlot(data.platformSettings?.courtSlotMinutes),
      duration: asMatchDuration(durationMinutes),
      openWindows: windowsOf(data.courtOpenWindows),
      homeWindows: clubWindows(homeClubId),
      awayWindows: clubWindows(awayClubId),
      courts,
      holds,
      ignoreMatchId,
      clubBusy,
    }),
  };
}

export function toMatchScoreSheet(data: MatchScoreSheetData): MatchScoreSheetView | null {
  const match = data.matches[0];
  if (!match?.homeClub || !match.awayClub) return null;
  return {
    homeScore: count(match.homeScore),
    awayScore: count(match.awayScore),
    homeClubId: match.homeClub.id,
    awayClubId: match.awayClub.id,
    homeName: match.homeClub.name,
    awayName: match.awayClub.name,
    homePlayers: playersOf(match.homeClub),
    awayPlayers: playersOf(match.awayClub),
    homeGoals: goalsOf(match.matchGoals_on_match, match.homeClub.id),
    awayGoals: goalsOf(match.matchGoals_on_match, match.awayClub.id),
    homeYellow: cardsOf(match.matchCards_on_match, match.homeClub.id, "YELLOW"),
    homeRed: cardsOf(match.matchCards_on_match, match.homeClub.id, "RED"),
    awayYellow: cardsOf(match.matchCards_on_match, match.awayClub.id, "YELLOW"),
    awayRed: cardsOf(match.matchCards_on_match, match.awayClub.id, "RED"),
  };
}
