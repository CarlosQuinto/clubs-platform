import type { UpcomingMatchView } from "../matches/matchesViewState";

export interface HomeStatView {
  value: number;
  label: string;
}

export interface HomeHeroView {
  images: string[];
  headline: string;
  tagline: string;
  courtsEnabled: boolean;
  /** «Temporada 2026 · 3 torneos en curso»; null sin torneos vigentes. */
  seasonLabel: string | null;
  /** Cifras reales de la plataforma; solo las mayores que cero. */
  stats: HomeStatView[];
}

export interface HomeAdView {
  brand: string;
  imageUrl: string;
  href: string | null;
}

/** Próximo partido de la portada: la categoría va en un chip aparte del torneo. */
export interface HomeMatchView extends UpcomingMatchView {
  categoryName: string;
  tournamentName: string;
}

export interface HomeTournamentCard {
  id: string;
  href: string;
  name: string;
  phase: "active" | "upcoming";
  playedMatches: number;
  categoryName: string;
  meta: string;
  description: string;
  /** «Inició:» o «Inicia:» con la fecha; null si no hay fecha. */
  startLabel: string | null;
  startDate: string | null;
  clubsLabel: string;
  prize: string;
  joinHref: string | null;
}

export interface HomePageModel {
  hero: HomeHeroView;
  ads: HomeAdView[];
  matches: HomeMatchView[];
  activeTournaments: HomeTournamentCard[];
  upcomingTournaments: HomeTournamentCard[];
}

/** Partido de hoy en la portada: «live» mientras se juega (más el margen), luego «finished». */
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
