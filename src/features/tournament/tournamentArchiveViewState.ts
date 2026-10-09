/** Tarjeta de torneo «Carbón y Oro»: la usan la portada y /torneos. */
export interface TournamentTileView {
  id: string;
  href: string;
  name: string;
  playedMatches: number;
  categoryName: string;
  meta: string;
  startLabel: string | null;
  startDate: string | null;
  clubsLabel: string;
  prize: string;
  joinHref: string | null;
}

export interface TournamentArchiveView {
  active: TournamentTileView[];
  upcoming: TournamentTileView[];
  finished: TournamentTileView[];
}
