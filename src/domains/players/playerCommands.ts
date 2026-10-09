// Jugadores en varios clubes (0010): buscar a uno de la liga y sumarlo a la plantilla del club.
// /admin → Jugadores: alta con club opcional, edición de la persona, fichas por club y fusión de duplicados.
import {
  addExistingPlayer as addExistingPlayerOp,
  adminMergePlayers,
  adminPlayer,
  adminSavePlayer,
  adminSearchPlayers,
  dataConnect,
  deletePlayer,
  QueryFetchPolicy,
  savePlayer,
  searchPlayers,
  type AddExistingPlayerVariables,
  type AdminMergePlayersData,
  type AdminPlayerData,
  type AdminPlayerHit,
  type AdminPlayerMembership,
  type AdminSavePlayerVariables,
  type PlayerTournamentConflict,
  type SearchPlayerHit,
} from "../../infrastructure/dataconnect";
import { savedRow } from "../../shared/saved";
import { DATA_REVIEW_MESSAGE } from "../clubs/clubCommands";

export const ALREADY_IN_CLUB_MESSAGE = "Ese jugador ya está en la plantilla.";

/** Error con un motivo que se puede mostrar tal cual al usuario (el resto se traduce a un mensaje genérico). */
export class PlayerCommandError extends Error {}

/** Aviso, no error: ya juega ese torneo con otro club; se guardó igual. */
export function tournamentConflictMessage(conflict: PlayerTournamentConflict) {
  return `Ojo: ya juega con ${conflict.clubName} en ${conflict.tournamentName}. Si anota con los dos equipos, cuenta para cada club.`;
}

/** Mensaje para el formulario: el motivo si lo conocemos, si no el genérico recibido. */
export function playerErrorMessage(err: unknown, fallback: string) {
  return err instanceof PlayerCommandError ? err.message : fallback;
}

export async function findPlayers(clubId: string, q: string): Promise<SearchPlayerHit[]> {
  const result = await searchPlayers(dataConnect, { clubId, q }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
  return result.data.players ?? [];
}

/** Devuelve el aviso de torneo compartido si lo hay; lanza si no se pudo fichar. */
export async function addExistingPlayer(vars: AddExistingPlayerVariables): Promise<PlayerTournamentConflict | null> {
  const result = await addExistingPlayerOp(dataConnect, vars);
  if (!result.data.player) {
    if (result.data.reason === "ALREADY") throw new PlayerCommandError(ALREADY_IN_CLUB_MESSAGE);
    throw new PlayerCommandError(DATA_REVIEW_MESSAGE);
  }
  savedRow(result.data.player);
  return result.data.conflict ?? null;
}

// ---------- /admin → Jugadores (solo superadmin) ----------

/** q vacío trae los creados más recientemente; free = solo jugadores sin club. */
export async function findAdminPlayers(q: string, free: boolean): Promise<AdminPlayerHit[]> {
  const result = await adminSearchPlayers(dataConnect, { q, free }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
  return result.data.players ?? [];
}

export type AdminPlayer = NonNullable<AdminPlayerData["player"]>;

export async function loadAdminPlayer(id: string): Promise<AdminPlayer | null> {
  const result = await adminPlayer(dataConnect, { id }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
  return result.data.player ?? null;
}

/** Crea (con club opcional) o edita a la persona; lanza si el servidor lo rechazó. */
export async function saveAdminPlayer(vars: AdminSavePlayerVariables) {
  const result = await adminSavePlayer(dataConnect, vars);
  if (!result.data.player) throw new PlayerCommandError(DATA_REVIEW_MESSAGE);
}

/** Cambia dorsal, posición, variante o el activo de su ficha en un club, conservando los datos de la persona. */
export async function updateMembership(
  player: AdminPlayer,
  membership: AdminPlayerMembership,
  changes: { shirtNumber: string; position: string; variant: string; active: boolean },
): Promise<PlayerTournamentConflict | null> {
  const result = await savePlayer(dataConnect, {
    id: player.id,
    clubId: membership.club.id,
    name: player.name,
    shirtNumber: changes.shirtNumber,
    position: changes.position,
    isCoach: membership.isCoach,
    active: changes.active,
    detail: { variant: changes.variant, birthDate: player.birthDate ?? "", imageUrl: player.imageUrl },
  });
  if (!result.data.player) throw new PlayerCommandError(DATA_REVIEW_MESSAGE);
  return result.data.conflict ?? null;
}

/** Lo quita de la plantilla de un club (borrado lógico): sus números ahí se conservan. */
export async function removeFromClub(clubId: string, playerId: string) {
  const result = await deletePlayer(dataConnect, { clubId, id: playerId });
  savedRow(result.data.deleted);
}

export type MergeResult = NonNullable<AdminMergePlayersData["merged"]>;

/** Pasa todo lo de sourceId a targetId y borra sourceId. No se puede deshacer. */
export async function mergePlayers(sourceId: string, targetId: string): Promise<MergeResult> {
  const result = await adminMergePlayers(dataConnect, { sourceId, targetId });
  if (!result.data.merged) throw new PlayerCommandError("No se pudo unir: revisa que los dos jugadores sigan existiendo.");
  return result.data.merged;
}
