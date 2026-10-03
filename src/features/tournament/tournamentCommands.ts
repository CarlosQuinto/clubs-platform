import { QueryFetchPolicy } from "firebase/data-connect";
import {
  activateTournament,
  clearMatchCourtHolds,
  clearMatchEvents,
  courtBusyOnDate,
  insertMatchCard,
  insertMatchGoal,
  matchScoreSheet,
  matchSummary,
  saveMatchCourtHold,
  matchSlotHints,
  saveMatchScore,
  scheduleCourts,
  scheduleOfficialMatch,
} from "../../../dataconnect/generated";
import { addDays, courtsFreeAt, todayIso } from "../../lib/courts";
import type { Court, CourtHold, CourtSlotMinutes, TimeWindow } from "../../lib/types";
import { auth } from "../../lib/firebase";
import { dataConnect } from "../../lib/sqlConnect";
import { toMatchScoreSheet, toMatchSummary, toSlotHints } from "./tournamentMapper";
import type { MatchScoreSheetView, MatchSummaryView, ScoreGoalView } from "./tournamentViewState";

function sessionUserId() {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Debes iniciar sesión.");
  return userId;
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

export async function loadSlotHints(input: {
  homeClubId: string;
  awayClubId: string;
  startDate: string;
  durationMinutes: number;
  ignoreMatchId: string;
}) {
  const today = todayIso();
  const from = input.startDate && input.startDate > today ? input.startDate : today;
  const result = await matchSlotHints(
    dataConnect,
    {
      homeId: input.homeClubId,
      awayId: input.awayClubId,
      from,
      until: addDays(from, 20),
    },
    { fetchPolicy: QueryFetchPolicy.SERVER_ONLY },
  );
  return toSlotHints(
    result.data,
    input.homeClubId,
    input.awayClubId,
    from,
    input.durationMinutes,
    input.ignoreMatchId,
  );
}

export async function loadCourts() {
  const result = await scheduleCourts(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
  return result.data.courts.map((court) => ({ id: court.id, name: court.name }));
}

export async function loadMatchSummary(
  matchId: string,
  homeClubId: string,
  awayClubId: string,
): Promise<MatchSummaryView> {
  const result = await matchSummary(dataConnect, { matchId }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
  return toMatchSummary(result.data, homeClubId, awayClubId);
}

export async function loadMatchScoreSheet(matchId: string): Promise<MatchScoreSheetView | null> {
  const result = await matchScoreSheet(dataConnect, { matchId }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
  return toMatchScoreSheet(result.data);
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
  if (!input.courtId) return;
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

export async function saveMatchEvents(input: {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homeClubId: string;
  awayClubId: string;
  homeGoals: ScoreGoalView[];
  awayGoals: ScoreGoalView[];
  homeYellow: string[];
  awayYellow: string[];
  homeRed: string[];
  awayRed: string[];
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
      if (!goal.scorerId) continue;
      order += 1;
      const created = await insertMatchGoal(dataConnect, {
        userId,
        matchId: input.matchId,
        clubId: side.clubId,
        sortOrder: order,
        scorerId: goal.scorerId,
        scorerName: input.names[goal.scorerId] || "",
        assistId: goal.isOwnGoal || goal.isPenalty ? "" : goal.assistId,
        assistName: goal.isOwnGoal || goal.isPenalty ? "" : input.names[goal.assistId] || "",
        isPenalty: goal.isPenalty,
        isOwnGoal: goal.isOwnGoal,
      });
      if (created.data.goal == null) throw new Error("No se pudo guardar.");
    }
    for (const playerId of side.yellow) {
      if (!playerId) continue;
      const created = await insertMatchCard(dataConnect, {
        userId,
        matchId: input.matchId,
        clubId: side.clubId,
        playerId,
        playerName: input.names[playerId] || "",
        color: "YELLOW",
      });
      if (created.data.card == null) throw new Error("No se pudo guardar.");
    }
    for (const playerId of side.red) {
      if (!playerId) continue;
      const created = await insertMatchCard(dataConnect, {
        userId,
        matchId: input.matchId,
        clubId: side.clubId,
        playerId,
        playerName: input.names[playerId] || "",
        color: "RED",
      });
      if (created.data.card == null) throw new Error("No se pudo guardar.");
    }
  }
}
