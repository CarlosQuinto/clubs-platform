export interface TournamentCardView {
  id: string;
  href: string;
  name: string;
  categoryName: string;
  toneIndex: number;
  meta: string;
  startLabel: string | null;
  joinHref: string | null;
  playedMatches: number;
}

export interface TournamentArchiveView {
  active: TournamentCardView[];
  upcoming: TournamentCardView[];
  finished: TournamentCardView[];
}
