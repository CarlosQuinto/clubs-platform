import {
  adminCompetition,
  type AdminCompetitionData,
  createCategory,
  createSeason,
  createTournament,
  dataConnect,
  deleteSeason,
  QueryFetchPolicy,
  setSeasonActive,
} from "../../infrastructure/dataconnect";
import { sessionUserId } from "../../infrastructure/auth";
import { savedRow } from "../../shared/saved";

export async function loadCompetition(): Promise<AdminCompetitionData> {
  return (await adminCompetition(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function addSeason(input: {
  name: string;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
}) {
  const result = await createSeason(dataConnect, { userId: sessionUserId(), id: crypto.randomUUID(), ...input });
  savedRow(result.data.season);
}

export async function toggleSeason(id: string, active: boolean) {
  const result = await setSeasonActive(dataConnect, { userId: sessionUserId(), id, active });
  savedRow(result.data.season);
}

export async function removeSeason(id: string) {
  const result = await deleteSeason(dataConnect, { userId: sessionUserId(), id });
  savedRow(result.data.season);
}

export async function addCategory(name: string, sortOrder: number) {
  const id = crypto.randomUUID();
  const result = await createCategory(dataConnect, { userId: sessionUserId(), id, name, sortOrder });
  savedRow(result.data.category);
  return id;
}

export async function addTournament(input: {
  name: string;
  seasonId: string;
  categoryId: string;
  groupId: string;
  footballType: string;
  durationMinutes: number;
  startDate: string;
  description: string;
}) {
  const result = await createTournament(dataConnect, { userId: sessionUserId(), id: crypto.randomUUID(), ...input });
  savedRow(result.data.tournament);
}
