export interface TournamentOptionView {
  id: string;
  label: string;
}

export interface UpcomingMatchView {
  id: string;
  /** Página del partido. */
  href: string;
  isoDate: string;
  day: number;
  month: string;
  year: number;
  dateLabel: string;
  timeLabel: string | null;
  venue: string | null;
  homeName: string;
  awayName: string;
  homeLogo: string | null;
  awayLogo: string | null;
  subtitle: string;
  courtId: string | null;
}

export interface MatchesPageModel {
  tournaments: TournamentOptionView[];
  matches: (UpcomingMatchView & { tournamentId: string })[];
}
