export interface TournamentOptionView {
  id: string;
  label: string;
}

/** Tarjeta de próximo partido (portada y /partidos); trae lo que pide el formulario de programar. */
export interface UpcomingMatchView {
  id: string;
  /** Página del partido. */
  href: string;
  isoDate: string;
  day: number;
  month: string;
  dateLabel: string;
  /** «HH:MM» guardado; "" si aún no tiene hora. */
  time: string;
  timeLabel: string | null;
  venue: string | null;
  homeClubId: string;
  awayClubId: string;
  homeName: string;
  awayName: string;
  homeLogo: string | null;
  awayLogo: string | null;
  categoryName: string;
  tournamentName: string;
  /** "" sin cancha. */
  courtId: string;
  durationMinutes: number;
  tournamentStartDate: string;
}

export interface MatchesPageModel {
  tournaments: TournamentOptionView[];
  matches: (UpcomingMatchView & { tournamentId: string })[];
}
