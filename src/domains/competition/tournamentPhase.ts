import { TournamentStatus } from "../../infrastructure/dataconnect";

export type TournamentPhase = "upcoming" | "active" | "finished";

/** Fase que se muestra: un torneo «UPCOMING» cuya fecha de inicio ya llegó cuenta como en curso. */
export function tournamentPhase(
  status: TournamentStatus,
  startDate: string | null | undefined,
  today: string,
): TournamentPhase {
  if (status === TournamentStatus.FINISHED) return "finished";
  if (status === TournamentStatus.ACTIVE) return "active";
  const start = startDate?.slice(0, 10) || "";
  return start && start <= today ? "active" : "upcoming";
}
