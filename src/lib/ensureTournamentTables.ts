import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

/** Pide al servidor las tablas materializadas de un torneo que todavía no las tiene. */
export async function ensureTournamentTables(tournamentId: string) {
  const fn = httpsCallable<{ tournamentId: string }, { created: boolean }>(
    functions,
    "ensureTournamentTables",
  );
  const res = await fn({ tournamentId });
  return res.data;
}
