import {
  dataConnect,
  matchDetail,
  matchPreview,
  type MatchDetailData,
  type MatchPreviewData,
  QueryFetchPolicy,
} from "../../infrastructure/dataconnect";

export async function loadMatchDetail(id: string): Promise<MatchDetailData> {
  const result = await matchDetail(dataConnect, { id }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
  return result.data;
}

export async function loadMatchPreview(input: {
  tournamentId: string;
  homeClubId: string;
  awayClubId: string;
}): Promise<MatchPreviewData> {
  const result = await matchPreview(dataConnect, input, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
  return result.data;
}
