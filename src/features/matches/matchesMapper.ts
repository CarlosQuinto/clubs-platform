import { type MatchesPageData, TournamentStatus } from "../../infrastructure/dataconnect";
import { formatFriendlyDate, formatFriendlyTime } from "../../shared/helpers";
import { matchPath } from "../../shared/paths";
import type { MatchesPageModel, UpcomingMatchView } from "./matchesViewState";

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const LIVE = new Set<TournamentStatus>([TournamentStatus.ACTIVE, TournamentStatus.UPCOMING]);

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function dateParts(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { day, month: MONTHS[month - 1] || "", year };
}

export function toMatchesPage(data: MatchesPageData, today: string): MatchesPageModel {
  const tournaments = [...data.tournaments]
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name, "es") ||
        a.category.name.localeCompare(b.category.name, "es"),
    )
    .map((tournament) => ({
      id: tournament.id,
      label: tournament.category.name
        ? `${tournament.name} · ${tournament.category.name}`
        : tournament.name,
    }));
  const liveIds = new Set(tournaments.map((tournament) => tournament.id));

  const matches = data.matches.flatMap((match) => {
    if (!match.matchDate || match.matchDate < today) return [];
    if (!LIVE.has(match.tournament.status) || !liveIds.has(match.tournament.id)) return [];
    const date = dateParts(match.matchDate);
    if (!date) return [];
    const venue = match.venue.trim();
    const card: UpcomingMatchView & { tournamentId: string } = {
      id: match.id,
      tournamentId: match.tournament.id,
      href: matchPath(match.id),
      isoDate: match.matchDate,
      day: date.day,
      month: date.month,
      year: date.year,
      dateLabel: formatFriendlyDate(match.matchDate),
      timeLabel: match.startTime ? formatFriendlyTime(match.startTime) : null,
      venue: venue || null,
      homeName: match.homeClub.name,
      awayName: match.awayClub.name,
      homeLogo: match.homeClub.logoUrl?.trim() || null,
      awayLogo: match.awayClub.logoUrl?.trim() || null,
      subtitle: [match.tournament.category.name, match.tournament.name].filter(Boolean).join(" · "),
      courtId: match.court?.id || null,
    };
    return [card];
  });

  return { tournaments, matches };
}

export function filterMatches(
  matches: MatchesPageModel["matches"],
  tournamentId: string,
  query: string,
) {
  const needle = fold(query);
  return matches.filter((match) => {
    if (tournamentId && match.tournamentId !== tournamentId) return false;
    if (!needle) return true;
    return fold(match.homeName).includes(needle) || fold(match.awayName).includes(needle);
  });
}
