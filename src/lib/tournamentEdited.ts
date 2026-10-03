export const TOURNAMENT_EDITED = "tournament-edited";

export function notifyTournamentEdited() {
  window.dispatchEvent(new Event(TOURNAMENT_EDITED));
}
