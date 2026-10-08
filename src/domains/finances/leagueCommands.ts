import {
  addLeaguePayment,
  adminFinanceSetup,
  adminFinanceSummary,
  adminLeagueCharges,
  adminLeagueExpenses,
  clubLeagueAccount,
  createLeagueCharge,
  dataConnect,
  deleteLeagueExpense,
  deleteLeaguePayment,
  generateMonthlyPageCharges,
  generateSeasonCharges,
  QueryFetchPolicy,
  saveLeagueExpense,
  saveLeagueFee,
  setLeagueChargeStatus,
  type AddLeaguePaymentVariables,
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

export async function saveFee(vars: SaveLeagueFeeVariables) {
  const result = await saveLeagueFee(dataConnect, vars);
  savedRow(result.data.fee);
}

export async function createCharge(vars: CreateLeagueChargeVariables) {
  const result = await createLeagueCharge(dataConnect, vars);
  savedRow(result.data.charge);
}

export async function changeChargeStatus(vars: SetLeagueChargeStatusVariables) {
  const result = await setLeagueChargeStatus(dataConnect, vars);
  savedRow(result.data.charge);
}

export async function addPayment(vars: AddLeaguePaymentVariables) {
  const result = await addLeaguePayment(dataConnect, vars);
  savedRow(result.data.payment);
}

export async function removePayment(id: string) {
  const result = await deleteLeaguePayment(dataConnect, { id });
  savedRow(result.data.deleted);
}

export async function saveExpense(vars: SaveLeagueExpenseVariables) {
  const result = await saveLeagueExpense(dataConnect, vars);
  savedRow(result.data.expense);
}

export async function removeExpense(id: string) {
  const result = await deleteLeagueExpense(dataConnect, { id });
  savedRow(result.data.deleted);
}

/** Devuelve cuántos cargos nuevos se crearon (0 si ya existían). */
export async function generateSeason(seasonId: string) {
  const result = await generateSeasonCharges(dataConnect, { seasonId });
  savedRow(result.data.created);
  return result.data.created ?? 0;
}

/** month = 'YYYY-MM'. configured = false si la página no se cobra por mes en esa temporada. */
export async function generateMonth(month: string) {
  const result = await generateMonthlyPageCharges(dataConnect, { month });
  savedRow(result.data.created);
  return { created: result.data.created ?? 0, configured: result.data.configured === true };
}
