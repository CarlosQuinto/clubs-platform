import {
  adminFinanceSetup,
  adminFinanceSummary,
  adminLeagueCharges,
  adminLeagueExpenses,
  clubLeagueAccount,
  createLeagueCharge,
  dataConnect,
  deleteLeagueExpense,
  QueryFetchPolicy,
  saveLeagueExpense,
  saveLeagueFee,
  setLeagueChargePaid,
  setLeagueChargeStatus,
  type AdminFinanceSummaryVariables,
  type AdminLeagueChargesVariables,
  type CreateLeagueChargeVariables,
  type SaveLeagueExpenseVariables,
  type SaveLeagueFeeVariables,
  type SetLeagueChargeStatusVariables,
} from "../../infrastructure/dataconnect";
import { savedRow } from "../../shared/saved";

const fresh = { fetchPolicy: QueryFetchPolicy.SERVER_ONLY };

export async function loadFinanceSetup(seasonId?: string | null) {
  return (await adminFinanceSetup(dataConnect, { seasonId: seasonId ?? null }, fresh)).data;
}

export async function loadLeagueCharges(filters: AdminLeagueChargesVariables) {
  return (await adminLeagueCharges(dataConnect, filters, fresh)).data.charges;
}

export async function loadLeagueExpenses(seasonId?: string | null) {
  return (await adminLeagueExpenses(dataConnect, { seasonId: seasonId ?? null }, fresh)).data.expenses;
}

export async function loadFinanceSummary(vars: AdminFinanceSummaryVariables) {
  return (await adminFinanceSummary(dataConnect, vars, fresh)).data;
}

export async function loadClubLeagueAccount(clubId: string) {
  return (await clubLeagueAccount(dataConnect, { clubId }, fresh)).data.account;
}

/** Devuelve cuántos cobros de lo que ya pasó en la temporada se registraron al guardar. */
export async function saveFee(vars: SaveLeagueFeeVariables) {
  const result = await saveLeagueFee(dataConnect, vars);
  savedRow(result.data.fee);
  return result.data.created ?? 0;
}

/** «Cubierto / no cubierto». */
export async function markChargePaid(id: string, paid: boolean) {
  const result = await setLeagueChargePaid(dataConnect, { id, paid });
  savedRow(result.data.charge);
}

export async function createCharge(vars: CreateLeagueChargeVariables) {
  const result = await createLeagueCharge(dataConnect, vars);
  savedRow(result.data.charge);
}

export async function changeChargeStatus(vars: SetLeagueChargeStatusVariables) {
  const result = await setLeagueChargeStatus(dataConnect, vars);
  savedRow(result.data.charge);
}

export async function saveExpense(vars: SaveLeagueExpenseVariables) {
  const result = await saveLeagueExpense(dataConnect, vars);
  savedRow(result.data.expense);
}

export async function removeExpense(id: string) {
  const result = await deleteLeagueExpense(dataConnect, { id });
  savedRow(result.data.deleted);
}

