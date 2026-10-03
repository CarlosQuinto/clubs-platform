import type { TournamentEditorData } from "../../../dataconnect/generated";
import { asMatchDuration, type ClubSummary, type Match, type Tournament } from "../../lib/types";

export interface TournamentEditorModel {
  tournament: Tournament;
  clubs: ClubSummary[];
  matches: Match[];
  seasonStart?: string;
  seasonEnd?: string;
  categoryLabel: string;
}

export function toTournamentEditor(data: TournamentEditorData): TournamentEditorModel | null {
  const row = data.tournaments[0];
  if (!row) return null;
  const tournament: Tournament = {
    id: row.id,
    name: row.name,
    seasonId: row.season.id,
    categoryId: "",
    clubIds: row.tournamentClubs_on_tournament.map((item) => item.club.id),
    status: "upcoming",
    legs: row.legs === 1 ? 1 : 2,
    footballType: row.footballType === "FUT_7" ? 7 : row.footballType === "FUT_9" ? 9 : 11,
    durationMinutes: asMatchDuration(row.durationMinutes),
    startDate: row.startDate || undefined,
  };
  const clubs: ClubSummary[] = data.clubs.map((club) => ({
    id: club.id,
    slug: club.id,
    name: club.name,
    active: club.active,
  }));
  const matches: Match[] = data.matches.map((match) => ({
    id: match.id,
    tournamentId: row.id,
    seasonId: row.season.id,
    categoryId: "",
    round: match.roundLabel.replace(/^jornada\s+/i, "").trim() || match.roundLabel,
    homeClubId: match.homeClub.id,
    awayClubId: match.awayClub.id,
    clubIds: [match.homeClub.id, match.awayClub.id],
    status: match.status === "PLAYED" ? "played" : match.status === "SCHEDULED" ? "scheduled" : "unscheduled",
    date: match.matchDate || undefined,
    time: match.startTime || undefined,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    walkover: match.walkover,
  }));
  return {
    tournament,
    clubs,
    matches,
    seasonStart: row.season.startDate || undefined,
    seasonEnd: row.season.endDate || undefined,
    categoryLabel: row.category.name || "—",
  };
}
