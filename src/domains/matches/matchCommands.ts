import {
  activateTournament,
  clearMatchCourtHolds,
  clearMatchEvents,
  courtBusyOnDate,
  dataConnect,
  insertMatchCard,
  insertTimedMatchGoal,
  QueryFetchPolicy,
  saveMatchCourtHold,
  saveMatchScore,
  scheduleOfficialMatch,
} from "../../infrastructure/dataconnect";
import { courtsFreeAt } from "../courts/courts";
import type { Court, CourtHold, CourtSlotMinutes, TimeWindow } from "../../shared/types";
import { sessionUserId } from "../../infrastructure/auth";
import { notifyMatchScheduled } from "../../infrastructure/functions/callables";

export interface MatchGoalInput {
  scorerId: string;
  assistId: string;
  isPenalty: boolean;
  isOwnGoal: boolean;
  minute: number | null;
}

export interface MatchCardInput {
  playerId: string;
  minute: number | null;
}

function minutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return null;
  return hours * 60 + mins;
}

function endTime(start: string, durationMinutes: number) {
  const startMinutes = minutes(start);
  if (startMinutes == null) return start;
  const total = startMinutes + durationMinutes;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export async function freeCourtsAt(input: {
  date: string;
  time: string;
  durationMinutes: number;
  ignoreMatchId: string;
  courts: Court[];
  openWindows: TimeWindow[];
  slotMinutes: CourtSlotMinutes;
}) {
  const busy = await courtBusyOnDate(
    dataConnect,
    { date: input.date },
    { fetchPolicy: QueryFetchPolicy.SERVER_ONLY },
  );
  const holds: CourtHold[] = busy.data.courtHolds.map((hold) => ({
    id: hold.match?.id || hold.court.id,
    courtId: hold.court.id,
    date: input.date,
    startTime: hold.startTime,
    endTime: hold.endTime,
    source: hold.match ? "match" : "manual",
    matchId: hold.match?.id,
  }));
  return courtsFreeAt({
    courts: input.courts,
    holds,
    openWindows: input.openWindows,
    date: input.date,
    time: input.time,
    slotMinutes: input.slotMinutes,
    duration: input.durationMinutes,
    ignoreMatchId: input.ignoreMatchId,
  });
}

export async function saveMatchSchedule(input: {
  matchId: string;
  date: string;
  time: string;
  venue: string;
  courtId: string;
  durationMinutes: number;
  courts: Court[];
  openWindows: TimeWindow[];
  slotMinutes: CourtSlotMinutes;
}) {
  const userId = sessionUserId();
  const finish = endTime(input.time, input.durationMinutes);
  if (input.courtId) {
    const free = await freeCourtsAt({
      date: input.date,
      time: input.time,
      durationMinutes: input.durationMinutes,
      ignoreMatchId: input.matchId,
      courts: input.courts,
      openWindows: input.openWindows,
      slotMinutes: input.slotMinutes,
    });
    if (!free.some((court) => court.id === input.courtId)) {
      throw new Error("Esa cancha no está disponible en esa fecha y hora.");
    }
  }
  const scheduled = await scheduleOfficialMatch(dataConnect, {
    id: input.matchId,
    matchDate: input.date,
    startTime: input.time,
    venue: input.venue,
    courtId: input.courtId || null,
  });
  if (scheduled.data.match == null) throw new Error("No se pudo guardar.");
  await clearMatchCourtHolds(dataConnect, { userId, matchId: input.matchId });
  if (input.courtId) {
    const hold = await saveMatchCourtHold(dataConnect, {
      userId,
      id: `match_${input.matchId}`,
      courtId: input.courtId,
      holdDate: input.date,
      startTime: input.time,
      endTime: finish,
      matchId: input.matchId,
    });
    if (hold.data.courtHold == null) throw new Error("No se pudo guardar.");
  }
  notifyMatchScheduled(input.matchId);
}

export async function saveMatchEvents(input: {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homeClubId: string;
  awayClubId: string;
  homeGoals: MatchGoalInput[];
  awayGoals: MatchGoalInput[];
  homeYellow: MatchCardInput[];
  awayYellow: MatchCardInput[];
  homeRed: MatchCardInput[];
  awayRed: MatchCardInput[];
  names: Record<string, string>;
}) {
  const userId = sessionUserId();
  const saved = await saveMatchScore(dataConnect, {
    userId,
    id: input.matchId,
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    walkover: false,
  });
  if (saved.data.match == null) throw new Error("No se pudo guardar.");
  await clearMatchEvents(dataConnect, { userId, matchId: input.matchId });
  await activateTournament(dataConnect, { userId, matchId: input.matchId });
  const sides = [
    { clubId: input.homeClubId, goals: input.homeGoals, yellow: input.homeYellow, red: input.homeRed },
    { clubId: input.awayClubId, goals: input.awayGoals, yellow: input.awayYellow, red: input.awayRed },
  ];
  for (const side of sides) {
    let order = 0;
    for (const goal of side.goals) {
      // Un gol en vivo «Sin asignar» conserva su fila por el minuto.
      if (!goal.scorerId && goal.minute == null) continue;
      order += 1;
      const created = await insertTimedMatchGoal(dataConnect, {
        matchId: input.matchId,
        clubId: side.clubId,
        sortOrder: order,
        scorerId: goal.scorerId,
        assistId: goal.isOwnGoal || goal.isPenalty ? "" : goal.assistId,
        isPenalty: goal.isPenalty,
        isOwnGoal: goal.isOwnGoal,
        minute: goal.minute,
      });
      if (created.data.goal == null) throw new Error("No se pudo guardar.");
    }
    const cards = [
      ...side.yellow.map((card) => ({ ...card, color: "YELLOW" })),
      ...side.red.map((card) => ({ ...card, color: "RED" })),
    ];
    for (const card of cards) {
      if (!card.playerId) continue;
      const created = await insertMatchCard(dataConnect, {
        userId,
        matchId: input.matchId,
        clubId: side.clubId,
        playerId: card.playerId,
        playerName: input.names[card.playerId] || "",
        color: card.color,
        minute: card.minute,
      });
      if (created.data.card == null) throw new Error("No se pudo guardar.");
    }
  }
}
