import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

const CALLABLE = { cors: true, region: "us-central1" as const };

function db() {
  return getFirestore();
}

async function assertSuperAdmin(uid: string) {
  const config = await db().doc("platform/config").get();
  const superAdmins = (config.data()?.superAdmins || []) as string[];
  if (!superAdmins.includes(uid)) {
    throw new HttpsError("permission-denied", "Solo un superadmin puede mover la disponibilidad.");
  }
}

/**
 * Copia tournaments/{id}/availability/{clubId} a clubs/{clubId}/availability/windows
 * y borra el documento del torneo. Si el club ya tiene una copia más reciente, se queda con esa.
 */
export const migrateClubAvailability = onCall(CALLABLE, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión.");
  }
  await assertSuperAdmin(request.auth.uid);

  const configRef = db().doc("platform/config");
  const config = await configRef.get();
  if (config.data()?.availabilityMigrated === true) {
    return { ok: true, moved: 0 };
  }

  const tournaments = await db().collection("tournaments").get();
  let moved = 0;
  for (const tournament of tournaments.docs) {
    const avail = await tournament.ref.collection("availability").get();
    for (const docSnap of avail.docs) {
      const clubId = docSnap.id;
      const data = docSnap.data();
      const target = db().doc(`clubs/${clubId}/availability/windows`);
      const existing = await target.get();
      const incomingAt = typeof data.updatedAt === "string" ? data.updatedAt : "";
      const existingAt =
        existing.exists && typeof existing.data()?.updatedAt === "string"
          ? existing.data()!.updatedAt
          : "";
      if (!existing.exists || incomingAt > existingAt) {
        await target.set({
          windows: Array.isArray(data.windows) ? data.windows : [],
          updatedAt: incomingAt || new Date().toISOString(),
          updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : "",
        });
        moved += 1;
      }
      await docSnap.ref.delete();
    }
  }

  await configRef.set({ availabilityMigrated: true }, { merge: true });
  return { ok: true, moved };
});
