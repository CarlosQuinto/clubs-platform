import type { LiveMatchView, UpcomingMatchView } from "../matches/matchesViewState";

export type { LiveMatchView };

export interface HomeStatView {
  value: number;
  label: string;
}

export interface HomeHeroView {
  images: string[];
  headline: string;
  tagline: string;
  courtsEnabled: boolean;
  /** Cifras reales de la plataforma; solo las mayores que cero. */
  stats: HomeStatView[];
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
  meta: string;
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
  matches: UpcomingMatchView[];
  activeTournaments: HomeTournamentCard[];
  upcomingTournaments: HomeTournamentCard[];
}
