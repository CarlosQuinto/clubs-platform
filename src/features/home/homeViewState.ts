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
