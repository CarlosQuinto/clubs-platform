import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export async function scheduleMatch(input: {
  matchId: string;
  date: string;
  time: string;
  venue: string;
  courtId: string;
}) {
  const fn = httpsCallable<typeof input, { ok: boolean }>(functions, "scheduleMatch");
  await fn(input);
}
