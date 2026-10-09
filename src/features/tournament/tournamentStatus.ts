/** Insignia `home-status` según la fase del torneo (ficha del torneo). */
export const TOURNAMENT_STATUS = {
  active: { className: "is-active", label: "En curso" },
  upcoming: { className: "is-soon", label: "Próximamente" },
  finished: { className: "is-done", label: "Finalizado" },
} as const;

export type TournamentPhase = keyof typeof TOURNAMENT_STATUS;
