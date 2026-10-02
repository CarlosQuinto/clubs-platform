import { getFirestore, type DocumentData, type WriteBatch } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

/**
 * Ficha pública de un partido calendarizado.
 * La portada lee esta colección (campos de la tarjeta) en lugar del documento completo.
 */

const REGION = "us-central1";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const BATCH_SIZE = 400;

export interface MatchListingData {
  date: string;
  time: string;
  categoryId: string;
  tournamentId: string;
  venue: string;
  homeClubId: string;
  awayClubId: string;
  /** YYYY-MM-DDTHH:mm, comparable con la hora local del navegador. */
  startsAt: string;
}

function db() {
  return getFirestore();
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

/** null si el partido no debe aparecer en próximos: no está calendarizado o le falta fecha/hora. */
export function listingFromMatch(data: DocumentData | undefined): MatchListingData | null {
  if (!data || data.status !== "scheduled") return null;
  const date = text(data.date).trim();
  const time = text(data.time).trim();
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) return null;
  return {
    date,
    time,
    categoryId: text(data.categoryId),
    tournamentId: text(data.tournamentId),
    venue: text(data.venue),
    homeClubId: text(data.homeClubId),
    awayClubId: text(data.awayClubId),
    startsAt: `${date}T${time}`,
  };
}

async function commitOps(ops: Array<(batch: WriteBatch) => void>) {
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = db().batch();
    ops.slice(i, i + BATCH_SIZE).forEach((op) => op(batch));
    await batch.commit();
  }
}

export const syncMatchListing = onDocumentWritten(
  { document: "matches/{matchId}", region: REGION },
  async (event) => {
    const matchId = event.params.matchId;
    const before = event.data?.before.exists ? event.data.before.data() : undefined;
    const after = event.data?.after.exists ? event.data.after.data() : undefined;
    const previous = listingFromMatch(before);
    const listing = listingFromMatch(after);
    const ref = db().doc(`matchListings/${matchId}`);
    if (!listing) {
      if (previous) await ref.delete();
      return;
    }
    await ref.set(listing);
  },
);

/** Crea las fichas de los partidos ya calendarizados y borra las que ya no aplican. */
export const backfillMatchListings = onCall(
  { cors: true, region: REGION, timeoutSeconds: 300 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Inicia sesión para actualizar los próximos partidos.",
      );
    }
    const config = await db().doc("platform/config").get();
    const superAdmins = (config.data()?.superAdmins || []) as string[];
    if (!superAdmins.includes(request.auth.uid)) {
      throw new HttpsError(
        "permission-denied",
        "Solo un superadmin puede actualizar los próximos partidos.",
      );
    }

    const scheduled = await db().collection("matches").where("status", "==", "scheduled").get();
    const keep = new Set<string>();
    const ops: Array<(batch: WriteBatch) => void> = [];
    scheduled.docs.forEach((docSnap) => {
      const listing = listingFromMatch(docSnap.data());
      if (!listing) return;
      keep.add(docSnap.id);
      ops.push((batch) => batch.set(db().doc(`matchListings/${docSnap.id}`), listing));
    });

    const existing = await db().collection("matchListings").get();
    let removed = 0;
    existing.docs.forEach((docSnap) => {
      if (keep.has(docSnap.id)) return;
      removed += 1;
      ops.push((batch) => batch.delete(docSnap.ref));
    });

    await commitOps(ops);
    return { listings: keep.size, removed };
  },
);
