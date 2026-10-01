import { useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../context/AuthContext";
import { functions } from "./firebase";

let inflight: Promise<void> | null = null;

function migrateClubAvailability() {
  if (!inflight) {
    const fn = httpsCallable<Record<string, never>, { ok: boolean }>(
      functions,
      "migrateClubAvailability",
    );
    inflight = fn({})
      .then(() => undefined)
      .catch((err) => {
        inflight = null;
        console.error(err);
      });
  }
  return inflight;
}

/** Una vez por sesión, mueve la disponibilidad vieja de cada torneo al club. */
export function useMigrateClubAvailability(isSuperAdmin: boolean) {
  const { platformConfig } = useAuth();
  const migrated = platformConfig?.availabilityMigrated === true;

  useEffect(() => {
    if (!isSuperAdmin || migrated || !platformConfig) return;
    void migrateClubAvailability();
  }, [isSuperAdmin, migrated, platformConfig]);
}
