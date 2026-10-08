import type { MatchPagePhase } from "../../domains/matches/liveMatchPhase";

export type MatchSide = "home" | "away";

export interface MatchTeamView {
  id: string;
  name: string;
  href: string;
  logoUrl: string | null;
  /** null = todavía no hay marcador que mostrar (antes del partido). */
  score: number | null;
}

export interface MatchHeaderView {
  phase: MatchPagePhase;
  /** «En vivo», «Final», «Por confirmar», «Próximo», «Por programar». */
  statusLabel: string;
  /** «37'» mientras se juega. */
  minuteLabel: string | null;
  home: MatchTeamView;
  away: MatchTeamView;
  /** «4–3 pen.» cuando hubo penales. */
  penaltiesLabel: string | null;
  walkover: boolean;
  /** «No se presentó X» o «3-0 por ingreso tardío» en un W.O. */
  walkoverNote: string | null;
  dateLabel: string | null;
  timeLabel: string | null;
  venue: string | null;
  courtImage: string | null;
  tournamentName: string;
  tournamentHref: string;
  category: string;
  round: string;
}

export type TimelineKind = "goal" | "penalty" | "ownGoal" | "yellow" | "red";

export interface TimelineEventView {
  /** Id de la fila (gol o tarjeta) para poder borrarla en vivo. */
  id: string;
  source: "goal" | "card";
  kind: TimelineKind;
  side: MatchSide;
  minuteLabel: string | null;
  playerName: string;
  /** Asistencia, «Penal» o «Autogol». */
  detail: string | null;
  /** «2–1» tras el gol; null en tarjetas. */
  scoreAfter: string | null;
}

export interface LineupTokenView {
  key: string;
  name: string;
  shortName: string;
  shirtNumber: string | null;
  imageUrl: string | null;
  goals: number;
  ownGoals: number;
  yellow: number;
  red: number;
  /** Posición en la cancha vertical compartida (% desde arriba / izquierda). */
  top: number;
  left: number;
}

export interface SquadPlayerView {
  id: string;
  name: string;
  shirtNumber: string | null;
  /** Posición registrada en la plantilla («Portero», «Defensa»…); vacío si no tiene. */
  position: string;
  goals: number;
  yellow: number;
  red: number;
}

export interface TeamLineupView {
  side: MatchSide;
  name: string;
  logoUrl: string | null;
  formation: string | null;
  /** Vacío si el club no guardó alineación. */
  starters: LineupTokenView[];
  /** Convocados (o plantilla) que no están en la alineación. */
  bench: SquadPlayerView[];
  /** true si `bench` es la plantilla completa porque no hay convocados ni alineación. */
  benchIsSquad: boolean;
  /** Director técnico (jugador marcado como DT en la plantilla); null si no hay. */
  coach: string | null;
}

export interface StatRowView {
  label: string;
  home: number;
  away: number;
}

export interface RosterPlayerView {
  id: string;
  name: string;
  shirtNumber: string | null;
  convocado: boolean;
}

export interface MatchDetailView {
  id: string;
  header: MatchHeaderView;
  timeline: TimelineEventView[];
  lineups: { home: TeamLineupView; away: TeamLineupView };
  stats: StatRowView[];
  mvp: string | null;
  /** Convocados por equipo (previa). */
  convocados: { home: SquadPlayerView[]; away: SquadPlayerView[] };
  /** Plantillas para el marcador en vivo del superadmin. */
  roster: { home: RosterPlayerView[]; away: RosterPlayerView[] };
  /** Se pueden registrar eventos en vivo (el partido sigue SCHEDULED). */
  liveEditable: boolean;
  /** Inicio programado (ms, hora local); null si no tiene fecha u hora. */
  kickoffMs: number | null;
  durationMinutes: number;
  tournamentId: string;
  homeClubId: string;
  awayClubId: string;
  /** Texto para compartir: «Local 2–1 Visitante». */
  shareText: string;
}

export type FormResult = "G" | "E" | "P";

export interface FormPillView {
  id: string;
  result: FormResult;
  /** «vs Rival 2–1». */
  title: string;
}

export interface StandingSummaryView {
  /** «3.º de 10 · 12 pts»; null si aún no juega. */
  label: string | null;
  /** «3.º de 10»; null si aún no juega. */
  rankLabel: string | null;
  /** Puntos acumulados; null si aún no juega. */
  points: number | null;
  /** Desglose PJ · G · E · P · GF · GC · DG en orden; vacío si aún no juega. */
  breakdown: { label: string; value: number }[];
}

export interface HeadToHeadItemView {
  id: string;
  dateLabel: string;
  /** «Local 2–1 Visitante», con los nombres de ese partido. */
  line: string;
  tournament: string;
  href: string;
}

export interface MatchPreviewView {
  standings: { home: StandingSummaryView; away: StandingSummaryView; ready: boolean };
  form: { home: FormPillView[]; away: FormPillView[] };
  headToHead: {
    items: HeadToHeadItemView[];
    homeWins: number;
    draws: number;
    awayWins: number;
  };
}
