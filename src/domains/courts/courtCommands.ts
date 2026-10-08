import {
  adminCourts,
  type AdminCourtsData,
  type CourtHoldOutside,
  type MatchOutside,
  dataConnect,
  deleteCourt,
  deleteManualCourtHold,
  QueryFetchPolicy,
  saveCourt,
  saveCourtHold,
  saveCourtModule as saveCourtModuleRpc,
} from "../../infrastructure/dataconnect";
import { sessionUserId } from "../../infrastructure/auth";
import { savedRow } from "../../shared/saved";

export async function loadCourts(): Promise<AdminCourtsData> {
  return (await adminCourts(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export type { CourtHoldOutside, MatchOutside };

export type CourtModuleResult =
  | { saved: true; removed: CourtHoldOutside[]; unscheduledMatches: MatchOutside[] }
  | { saved: false; conflicts: CourtHoldOutside[]; matchConflicts: MatchOutside[] };

/**
 * Guarda interruptor, paso y franjas en una sola llamada. Si hay rentas o partidos programados fuera del
 * nuevo horario y no se fuerza, no guarda nada y los devuelve; con `force` elimina las rentas y deja los
 * partidos por programar, y devuelve ambos para avisar por correo.
 */
export async function saveCourtModule(
  enabled: boolean,
  slotMinutes: number,
  windows: { weekday: number; startTime: string; endTime: string }[],
  force = false,
): Promise<CourtModuleResult> {
  const result = await saveCourtModuleRpc(dataConnect, { enabled, slotMinutes, windows, force });
  const data = result.data;
  if (data.saved) {
    return { saved: true, removed: data.removed ?? [], unscheduledMatches: data.unscheduledMatches ?? [] };
  }
  if (data.conflicts?.length || data.matchConflicts?.length) {
    return { saved: false, conflicts: data.conflicts ?? [], matchConflicts: data.matchConflicts ?? [] };
  }
  savedRow(data.saved);
  throw new Error("No se pudo guardar.");
}

export async function upsertCourt(input: {
  id: string;
  name: string;
  description: string;
  hourlyRate: number;
  football: boolean;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
  /** "" sin ubicación. */
  location: string;
}) {
  // SaveCourt valida al superadmin con auth.uid en el servidor; ya no recibe userId.
  const result = await saveCourt(dataConnect, input);
  savedRow(result.data.court);
}

export async function removeCourt(id: string) {
  const result = await deleteCourt(dataConnect, { id });
  savedRow(result.data.court);
}

export async function upsertHold(input: {
  id: string;
  courtId: string;
  holdDate: string;
  startTime: string;
  endTime: string;
  note: string;
  guestEmail?: string;
  /** Club al que se le cobra la renta (finanzas de la liga). */
  clubId?: string | null;
  /** Apartado nuevo: si otro se le cruzó al mismo tiempo, el SQL lo quita. */
  fresh?: boolean;
}) {
  const result = await saveCourtHold(dataConnect, { userId: sessionUserId(), ...input });
  if (!result.data.hold) throw new Error(HOLD_REJECTED);
}

/** El SQL no guardó el apartado: el tramo se cruza, ya pasó o salió de la apertura. */
export const HOLD_REJECTED = "hold-rejected";

export async function removeManualHold(id: string) {
  const result = await deleteManualCourtHold(dataConnect, { id });
  savedRow(result.data.hold);
}
