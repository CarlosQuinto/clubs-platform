import {
  dataConnect,
  matchScoreSheet,
  matchSlotHints,
  matchSummary,
  QueryFetchPolicy,
  scheduleCourts,
} from "../../infrastructure/dataconnect";
import { addDays, todayIso } from "../../domains/courts/courts";
import { toMatchScoreSheet, toMatchSummary, toSlotHints } from "./tournamentMapper";
import type { MatchScoreSheetView, MatchSummaryView } from "./tournamentViewState";

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
