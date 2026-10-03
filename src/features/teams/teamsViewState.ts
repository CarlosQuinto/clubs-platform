import type { StandingRowView } from "../tournament/tournamentViewState";

export interface ClubCardView {
  href: string;
  name: string;
  locality: string;
  logoUrl: string | null;
  phoneLabel: string | null;
  phoneHref: string | null;
}

export interface ScopeOptionView {
  id: string;
  name: string;
}

export interface TeamsScopeView {
  seasonId: string;
  categoryId: string;
}

export interface TeamsPageModel {
  clubs: ClubCardView[];
  seasons: ScopeOptionView[];
  categories: ScopeOptionView[];
  defaultScope: TeamsScopeView;
  standingsFor: (scope: TeamsScopeView) => StandingRowView[];
}
