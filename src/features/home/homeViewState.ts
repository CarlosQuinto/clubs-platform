import type { UpcomingMatchView } from "../matches/matchesViewState";

export interface HomeHeroView {
  images: string[];
  headline: string;
  tagline: string;
  courtsEnabled: boolean;
}

export interface HomeAdView {
  brand: string;
  imageUrl: string;
  href: string | null;
}

export interface HomeTournamentCard {
  id: string;
  href: string;
  name: string;
  playedMatches: number;
  categoryName: string;
  toneIndex: number;
  meta: string;
  startLabel: string | null;
  joinHref: string | null;
}

export interface HomePageModel {
  hero: HomeHeroView;
  ads: HomeAdView[];
  matches: UpcomingMatchView[];
  activeTournaments: HomeTournamentCard[];
  upcomingTournaments: HomeTournamentCard[];
}

/** Partido de hoy en la portada: «live» mientras se juega (más el margen), luego «finished». */
export interface LiveMatchView {
  id: string;
  tournamentHref: string;
  phase: "live" | "finished";
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
