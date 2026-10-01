import { getDocs, query, where, writeBatch, type DocumentData } from "firebase/firestore";
import { db } from "./firebase";
import { courtHoldRef, matchRef, matchesCol, tournamentRef } from "./paths";
import { isPlayed } from "./stats";
import type { Match } from "./types";

function asMatch(id: string, data: DocumentData): Match {
  const status =
    data.status === "played" || data.status === "scheduled" || data.status === "unscheduled"
      ? data.status
      : "unscheduled";
  return {
    id,
    status,
    homeScore: typeof data.homeScore === "number" ? data.homeScore : null,
    awayScore: typeof data.awayScore === "number" ? data.awayScore : null,
    tournamentId: typeof data.tournamentId === "string" ? data.tournamentId : "",
  } as Match;
}

async function tournamentMatches(tournamentId: string) {
  const snap = await getDocs(
    query(matchesCol(), where("tournamentId", "==", tournamentId)),
  );
  return snap.docs.map((d) => asMatch(d.id, d.data()));
}

export async function previewTournamentDelete(tournamentId: string) {
  const matches = await tournamentMatches(tournamentId);
  if (matches.some(isPlayed)) return { blocked: true as const, pending: 0 };
  return { blocked: false as const, pending: matches.length };
}

/** Borra el torneo, sus partidos sin jugar y la reserva de cancha de cada uno. */
export async function deleteTournament(tournamentId: string) {
  const matches = await tournamentMatches(tournamentId);
  if (matches.some(isPlayed)) {
    throw new Error("played");
  }
  const refs = [
    ...matches.flatMap((match) => [
      matchRef(match.id),
      courtHoldRef(`match_${match.id}`),
    ]),
    tournamentRef(tournamentId),
  ];
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}
