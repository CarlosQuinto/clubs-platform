export interface PodiumSlotView {
  placeLabel: string;
  clubName: string | null;
  clubHref: string | null;
}

export interface StandingRowView {
  rank: number;
  clubId?: string;
  clubName: string;
  clubHref: string | null;
  clubSlug?: string | null;
  logoUrl?: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface ScorerRowView {
  playerId: string;
  name: string;
  clubId: string;
  clubName: string;
  clubLogo: string | null;
  imageUrl: string;
  goals: number;
  assists: number;
}

export interface ClubMark {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
}

export interface CalendarMatchView {
  id: string;
  round: string;
  isoDate: string;
  time: string;
  venue: string;
  courtId: string;
  home: ClubMark;
  away: ClubMark;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  walkover: boolean;
}

export interface RoundView {
  label: string;
  collapsed: boolean;
  matches: CalendarMatchView[];
}

export interface TournamentScreenView {
  title: string;
  chips: string[];
  prize: string;
  durationMinutes: number;
  startDate: string;
  showPodium: boolean;
  podium: PodiumSlotView[];
  standings: StandingRowView[];
  scorers: ScorerRowView[];
  rounds: RoundView[];
}

export interface SummarySideView {
  goals: string[];
  yellow: string[];
  red: string[];
}

export interface MatchSummaryView {
  home: SummarySideView;
  away: SummarySideView;
}

export interface ScorePlayerView {
  id: string;
  name: string;
}

export interface ScoreGoalView {
  scorerId: string;
  assistId: string;
  isPenalty: boolean;
  isOwnGoal: boolean;
  /** Minuto registrado en vivo; null si no se anotó. */
  minute: number | null;
}

export interface ScoreCardView {
  playerId: string;
  minute: number | null;
}

export interface MatchScoreSheetView {
  homeScore: number;
  awayScore: number;
  homeClubId: string;
  awayClubId: string;
  homeName: string;
  awayName: string;
  homePlayers: ScorePlayerView[];
  awayPlayers: ScorePlayerView[];
  homeGoals: ScoreGoalView[];
  awayGoals: ScoreGoalView[];
  homeYellow: ScoreCardView[];
  homeRed: ScoreCardView[];
  awayYellow: ScoreCardView[];
  awayRed: ScoreCardView[];
}
