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

/** Tarjeta de marcador (portada «En vivo» y ficha de torneo): «live» mientras se juega (más el margen), luego «finished». */
export interface LiveMatchView {
  id: string;
  /** Página del partido. */
  href: string;
  phase: "live" | "finished";
  /** Terminó por hora pero el superadmin aún no lo finaliza: el marcador puede cambiar. */
  pending: boolean;
  /** «74'» mientras está en vivo; null si ya terminó. */
  minuteLabel: string | null;
  homeName: string;
  awayName: string;
  homeLogo: string | null;
  awayLogo: string | null;
  /** null = todavía sin resultado guardado. */
  homeScore: number | null;
  awayScore: number | null;
  /** «4–3 pen.» cuando hubo penales. */
  penaltiesLabel: string | null;
  walkover: boolean;
  subtitle: string;
  timeLabel: string;
  venue: string | null;
}
