import {
  addLiveMatchCard,
  addLiveMatchGoal,
  dataConnect,
  deleteLiveMatchCard,
  deleteLiveMatchGoal,
  finishLiveMatch,
} from "../../infrastructure/dataconnect";
import { savedRow } from "../../shared/saved";

/** Tipo de gol en el marcador en vivo. El autogol se suma al equipo elegido y lo marca un rival. */
export type LiveGoalKind = "goal" | "penalty" | "ownGoal";

/** El navegador genera el id: si la red falla y se reintenta, el evento no se duplica. */
function eventId() {
  return crypto.randomUUID();
}

export async function recordLiveGoal(input: {
  matchId: string;
  clubId: string;
  kind: LiveGoalKind;
  scorerId: string;
  assistId: string;
  minute: number | null;
}) {
  const result = await addLiveMatchGoal(dataConnect, {
    id: eventId(),
    matchId: input.matchId,
    clubId: input.clubId,
    scorerId: input.scorerId,
    assistId: input.kind === "goal" ? input.assistId : "",
    isPenalty: input.kind === "penalty",
    isOwnGoal: input.kind === "ownGoal",
    minute: input.minute,
  });
  savedRow(result.data.match);
}

export async function removeLiveGoal(matchId: string, goalId: string) {
  const result = await deleteLiveMatchGoal(dataConnect, { matchId, goalId });
  savedRow(result.data.match);
}

export async function recordLiveCard(input: {
  matchId: string;
  clubId: string;
  playerId: string;
  color: "YELLOW" | "RED";
  minute: number | null;
}) {
  const result = await addLiveMatchCard(dataConnect, {
    id: eventId(),
    matchId: input.matchId,
    clubId: input.clubId,
    playerId: input.playerId,
    color: input.color,
    minute: input.minute,
  });
  savedRow(result.data.match);
}

export async function removeLiveCard(matchId: string, cardId: string) {
  const result = await deleteLiveMatchCard(dataConnect, { matchId, cardId });
  savedRow(result.data.match);
}

/** Marca el partido como jugado con el marcador de sus goles; desde aquí cuenta en la tabla. */
export async function closeLiveMatch(matchId: string) {
  const result = await finishLiveMatch(dataConnect, { matchId });
  savedRow(result.data.match);
}
