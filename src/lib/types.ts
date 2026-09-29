/** Entidades de la plataforma (colecciones raíz gestionadas por el super administrador). */

export interface Category {
  id: string;
  name: string;
  /** Orden de visualización (1 = Primera división). */
  order: number;
}

export interface Season {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
}

export type TournamentStatus = "upcoming" | "active" | "finished";

/** Jugadores por lado: Fútbol 7, 9 u 11. */
export type FootballType = 7 | 9 | 11;

export const FOOTBALL_TYPES: FootballType[] = [7, 9, 11];

export function asFootballType(value: unknown): FootballType {
  return value === 7 || value === 9 ? value : 11;
}

export function footballTypeLabel(value?: unknown): string {
  return `Fútbol ${asFootballType(value)}`;
}

export interface Tournament {
  id: string;
  name: string;
  seasonId: string;
  categoryId: string;
  clubIds: string[];
  status: TournamentStatus;
  /**
   * Liga creada en la misma operación (varias divisiones).
   * Si falta, se agrupa por nombre dentro de la temporada.
   */
  groupId?: string;
  /**
   * Vueltas de la liga: 1 = solo ida, 2 = ida y vuelta.
   * Si falta, se asume 2.
   */
  legs?: 1 | 2;
  /**
   * Modalidad: 7, 9 u 11. Si falta, se asume 11.
   */
  footballType?: FootballType;
  /** Fecha de inicio (YYYY-MM-DD). Si falta, se usa la de la temporada. */
  startDate?: string;
  /** Posiciones finales al cerrar el torneo: posición (1, 2, 3...) → clubId. */
  podium?: Record<string, string>;
  description?: string;
}

export interface ClubSummary {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  localityId?: string;
  location?: string;
  presidentPhone?: string;
  active: boolean;
}

export interface GoalStat {
  scorer: string;
  assist?: string;
  isPenalty?: boolean;
  /** El gol cuenta para este lado, pero lo marcó un rival. */
  isOwnGoal?: boolean;
}

/** Estadísticas que cada club registra sobre su propio lado del partido. */
export interface MatchSide {
  attendees?: string[];
  lineup?: any;
  /** Goles a favor del club: goleador, asistencia, penal o autogol. */
  stats?: GoalStat[];
  goalkeepers?: { id: string; conceded?: number; saves?: number }[];
  mvp?: string;
  yellowCards?: string[];
  redCards?: string[];
  /** Snapshot de nombres para mostrar goleadores fuera del club. */
  playerNames?: Record<string, string>;
}

export type MatchStatus = "unscheduled" | "scheduled" | "played";

export interface Match {
  id: string;
  tournamentId: string;
  seasonId: string;
  categoryId: string;
  round: string;
  homeClubId: string;
  awayClubId: string;
  clubIds: string[];
  date?: string;
  time?: string;
  venue?: string;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  penaltiesHome?: number | null;
  penaltiesAway?: number | null;
  sides?: Record<string, MatchSide>;
}

export interface StandingRow {
  clubId: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

export interface ScorerRow {
  playerId: string;
  name: string;
  clubId: string;
  goals: number;
  assists: number;
}

/** Filtro de estadísticas (temporada/categoría); vacío = histórico. */
export interface StatsScope {
  seasonId?: string;
  categoryId?: string;
}

export interface PlatformSocial {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
}

export type InquiryStatus = "new" | "done";

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  topic?: string;
  status: InquiryStatus;
  createdAt?: { toDate?: () => Date } | null;
}

export type TeamApplicationStatus = "pending" | "approved" | "rejected";

export interface TeamApplication {
  id: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  teamName: string;
  status: TeamApplicationStatus;
  clubId?: string;
  createdAt?: { toDate?: () => Date } | null;
}
