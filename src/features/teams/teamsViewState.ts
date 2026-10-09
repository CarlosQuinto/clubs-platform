import type { StandingRowView } from "../tournament/tournamentViewState";

export interface ClubCardView {
  /** Id y slug del club: el menú «⋯» del superadmin los usa para administrarlo. */
  id: string;
  slug: string;
  /** Teléfono tal cual (vacío salvo para el superadmin, que es quien lo edita). */
  presidentPhone: string;
  href: string;
  name: string;
  initials: string;
  locality: string;
  logoUrl: string | null;
  phoneLabel: string | null;
  phoneHref: string | null;
}

/** Club desactivado, solo para el superadmin: desde aquí llega a su página y lo reactiva. */
export interface HiddenClubCardView extends ClubCardView {
  reason: string;
}

export interface TeamStandingView extends StandingRowView {
  initials: string;
}

export type DirectoryEmptyView = null | "none" | "loading" | "search";

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
  hiddenClubs: HiddenClubCardView[];
  seasons: ScopeOptionView[];
  categories: ScopeOptionView[];
  defaultScope: TeamsScopeView;
  standingsFor: (scope: TeamsScopeView) => TeamStandingView[];
}
