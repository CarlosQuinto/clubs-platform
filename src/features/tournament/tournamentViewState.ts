import type { MatchNoShow } from "../../infrastructure/api/types";
import type { LiveMatchView, UpcomingMatchView } from "../matches/matchesViewState";
import type { TournamentPhase } from "./tournamentStatus";

export interface PodiumSlotView {
  placeLabel: string;
  clubName: string | null;
  clubHref: string | null;
  logoUrl: string | null;
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
  noShow: MatchNoShow | null;
}

/** Un partido del calendario: `fixture` si falta jugarlo, `result` si ya tiene marcador; `score` alimenta «Marcador». */
export interface CalendarCardView {
  score: CalendarMatchView;
  fixture: UpcomingMatchView | null;
  result: LiveMatchView | null;
}

export interface RoundView {
  label: string;
  collapsed: boolean;
  matches: CalendarCardView[];
}

export interface TournamentStandingView extends StandingRowView {
  /** Siglas del escudo cuando el club no tiene logo. */
  initials: string;
}

export interface TournamentScreenView {
  title: string;
  /** «Temporada · Categoría · Fútbol 7». */
  subtitle: string;
  phase: TournamentPhase;
  prize: string;
  durationMinutes: number;
  startDate: string;
  /** Fecha de inicio formateada (la del torneo o la de su temporada); "" si no hay. */
  startLabel: string;
  /** La temporada sigue activa: un torneo finalizado se puede reabrir. */
  seasonActive: boolean;
  /** Partidos sin jugar; al cerrar el torneo se desprograman. */
  pendingMatches: number;
  showPodium: boolean;
  podium: PodiumSlotView[];
  standings: TournamentStandingView[];
  scorers: ScorerRowView[];
  rounds: RoundView[];
}

export interface ScorePlayerView {
  id: string;
  name: string;
  /** false = de baja o eliminado: solo viene porque ya aparece en el partido; no se ofrece para nuevos registros. */
  active: boolean;
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
