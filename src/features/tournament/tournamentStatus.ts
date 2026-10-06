/** Insignia `home-status` según la fase del torneo (tarjetas de torneo y ficha). */
export const TOURNAMENT_STATUS = {
  active: { className: "is-active", label: "En curso" },
  upcoming: { className: "is-soon", label: "Próximamente" },
  finished: { className: "is-done", label: "Finalizado" },
} as const;

export type TournamentPhase = keyof typeof TOURNAMENT_STATUS;
