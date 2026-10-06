import {
  adminCourts,
  type AdminCourtsData,
  clearCourtWindows,
  dataConnect,
  deleteCourt,
  deleteManualCourtHold,
  QueryFetchPolicy,
  saveCourt,
  saveCourtHold,
  saveCourtSettings,
  saveCourtWindow,
} from "../../infrastructure/dataconnect";
import { sessionUserId } from "../../infrastructure/auth";
import { savedRow } from "../../shared/saved";

export async function loadCourts(): Promise<AdminCourtsData> {
  return (await adminCourts(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })).data;
}

export async function saveCourtModule(enabled: boolean, slotMinutes: number, windows: {
  weekday: number;
  startTime: string;
  endTime: string;
}[]) {
  const userId = sessionUserId();
  const settings = await saveCourtSettings(dataConnect, { userId, enabled, slotMinutes });
  savedRow(settings.data.settings);
  await clearCourtWindows(dataConnect, { userId });
  for (const window of windows) {
    const result = await saveCourtWindow(dataConnect, {
      userId,
      id: crypto.randomUUID(),
      ...window,
    });
    savedRow(result.data.window);
  }
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
