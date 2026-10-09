// Jugadores en varios clubes (0010): buscar a uno de la liga y sumarlo a la plantilla del club.
import {
  addExistingPlayer as addExistingPlayerOp,
  dataConnect,
  QueryFetchPolicy,
  searchPlayers,
  type AddExistingPlayerVariables,
  type PlayerTournamentConflict,
  type SearchPlayerHit,
} from "../../infrastructure/dataconnect";
import { savedRow } from "../../shared/saved";
import { DATA_REVIEW_MESSAGE } from "../clubs/clubCommands";

export const ALREADY_IN_CLUB_MESSAGE = "Ese jugador ya está en la plantilla.";

/** Error con un motivo que se puede mostrar tal cual al usuario (el resto se traduce a un mensaje genérico). */
export class PlayerCommandError extends Error {}

export function tournamentConflictMessage(conflict: PlayerTournamentConflict) {
  return `Ya juega con ${conflict.clubName} en ${conflict.tournamentName}; un jugador solo puede representar a un club por torneo.`;
}

/** Mensaje para el formulario: el motivo si lo conocemos, si no el genérico recibido. */
export function playerErrorMessage(err: unknown, fallback: string) {
  return err instanceof PlayerCommandError ? err.message : fallback;
}

export async function findPlayers(clubId: string, q: string): Promise<SearchPlayerHit[]> {
  const result = await searchPlayers(dataConnect, { clubId, q }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
  return result.data.players ?? [];
}

export async function addExistingPlayer(vars: AddExistingPlayerVariables) {
  const result = await addExistingPlayerOp(dataConnect, vars);
  if (!result.data.player) {
    if (result.data.conflict) throw new PlayerCommandError(tournamentConflictMessage(result.data.conflict));
    if (result.data.reason === "ALREADY") throw new PlayerCommandError(ALREADY_IN_CLUB_MESSAGE);
    throw new PlayerCommandError(DATA_REVIEW_MESSAGE);
  }
  savedRow(result.data.player);
}
