import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  enrollmentEmailHtml,
  enrollmentEmailText,
  gmailConfigured,
  scheduleEmailHtml,
  scheduleEmailText,
  sendGmail,
} from "./mail";
import {
  asDuration,
  asSlot,
  fromMinutes,
  rangeFitsOpen,
  readWindows,
  toMinutes,
  weekdayOf,
} from "./slots";

const REGION = "us-central1" as const;
const CALLABLE = { cors: true, region: REGION };
const APP_URL = process.env.APP_URL || "https://clubs-platform-aem9u.web.app";

function db() {
  return getFirestore();
}

async function assertSuperAdmin(uid: string) {
  const config = await db().doc("platform/config").get();
  const superAdmins = (config.data()?.superAdmins || []) as string[];
  if (!superAdmins.includes(uid)) {
    throw new HttpsError("permission-denied", "Solo un superadmin puede calendarizar.");
  }
  return config.data() || {};
}

async function presidentEmails(clubId: string) {
  const members = await db().collection(`clubs/${clubId}/members`).where("role", "==", "admin").get();
  const fromMembers = members.docs
    .map((docSnap) => String(docSnap.data().email || "").trim().toLowerCase())
    .filter((email) => email.includes("@"));
  if (fromMembers.length) return [...new Set(fromMembers)];
  const invites = await db().collection(`clubs/${clubId}/invites`).where("role", "==", "admin").get();
  return [
    ...new Set(
      invites.docs
        .map((docSnap) => String(docSnap.data().email || "").trim().toLowerCase())
        .filter((email) => email.includes("@")),
    ),
  ];
}

function friendlyWhen(date: string, time: string) {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return `${date} ${time}`.trim();
  const label = new Date(year, month - 1, day).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return time ? `${label} a las ${time}` : label;
}

export const notifyTournamentEnrollment = onDocumentUpdated(
  { document: "tournaments/{tournamentId}", region: REGION },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    const previous = new Set((before.clubIds || []) as string[]);
    const added = ((after.clubIds || []) as string[]).filter((id) => !previous.has(id));
    if (!added.length) return;
    const tournamentId = event.params.tournamentId;
    const config = await db().doc("platform/config").get();
    const platformName = String(config.data()?.name || "la plataforma");
    const tournamentName = String(after.name || "el torneo");
    const startDate = typeof after.startDate === "string" ? after.startDate : "";
    for (const clubId of added) {
      const noticeRef = db().doc(`tournaments/${tournamentId}/notices/${clubId}`);
      const notice = await noticeRef.get();
      if (notice.exists) continue;
      const club = await db().doc(`clubs/${clubId}`).get();
      const clubName = String(club.data()?.name || "Tu equipo");
      const slug = String(club.data()?.slug || clubId);
      const actionUrl = `${APP_URL}/${slug}#disponibilidad`;
      const emails = await presidentEmails(clubId);
      if (gmailConfigured()) {
        for (const email of emails) {
          await sendGmail({
            to: email,
            subject: `${clubName} fue inscrito en ${tournamentName}`,
            html: enrollmentEmailHtml({
              platformName,
              clubName,
              tournamentName,
              startDate,
              actionUrl,
            }),
            text: enrollmentEmailText({
              platformName,
              clubName,
              tournamentName,
              startDate,
              actionUrl,
            }),
            fromName: platformName,
          });
        }
      } else {
        console.warn("Gmail no está configurado; no se avisó la inscripción.");
      }
      await noticeRef.set({
        sentAt: FieldValue.serverTimestamp(),
        emails,
      });
    }
  },
);

function rangesOverlap(a0: number, a1: number, b0: number, b1: number) {
  return a0 < b1 && b0 < a1;
}

export const scheduleMatch = onCall(CALLABLE, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión.");
  }
  const config = await assertSuperAdmin(request.auth.uid);
  const matchId = String(request.data?.matchId || "").trim();
  const date = String(request.data?.date || "").trim();
  const time = String(request.data?.time || "").trim();
  const venue = String(request.data?.venue || "").trim();
  const courtId = String(request.data?.courtId || "").trim();
  if (!matchId) throw new HttpsError("invalid-argument", "Falta el partido.");

  const matchSnap = await db().doc(`matches/${matchId}`).get();
  if (!matchSnap.exists) throw new HttpsError("not-found", "No se encontró el partido.");
  const match = matchSnap.data() || {};
  const tournamentSnap = await db().doc(`tournaments/${match.tournamentId}`).get();
  const tournament = tournamentSnap.data() || {};
  const courtsEnabled = config.courtsEnabled === true;
  const duration = asDuration(tournament.durationMinutes);
  const slot = asSlot(config.courtSlotMinutes);
  const openWindows = readWindows(config.courtOpenWindows);
  const scheduled = Boolean(date && time);

  if (courtId) {
    if (!courtsEnabled) {
      throw new HttpsError("failed-precondition", "El módulo de canchas está apagado.");
    }
    if (!scheduled) {
      throw new HttpsError("invalid-argument", "Elige fecha y hora para asignar cancha.");
    }
    const start = toMinutes(time);
    const day = weekdayOf(date);
    if (start == null || !day || start % slot !== 0) {
      throw new HttpsError(
        "invalid-argument",
        `La hora debe caer cada ${slot} minutos.`,
      );
    }
    const end = start + duration;
    if (!rangeFitsOpen(openWindows, day, start, end)) {
      throw new HttpsError(
        "failed-precondition",
        "Ese horario queda fuera de la apertura de las canchas.",
      );
    }
    const court = await db().doc(`courts/${courtId}`).get();
    if (!court.exists || court.data()?.active === false) {
      throw new HttpsError("failed-precondition", "Esa cancha no está disponible.");
    }
    const holds = await db().collection("courtHolds").where("date", "==", date).get();
    const taken = holds.docs.some((docSnap) => {
      const hold = docSnap.data();
      if (hold.courtId !== courtId) return false;
      if (hold.matchId === matchId) return false;
      const holdStart = toMinutes(String(hold.startTime || ""));
      const holdEnd = toMinutes(String(hold.endTime || ""));
      if (holdStart == null || holdEnd == null) return false;
      return rangesOverlap(start, end, holdStart, holdEnd);
    });
    if (taken) {
      throw new HttpsError("already-exists", "Esa cancha ya está ocupada en ese horario.");
    }
  }

  const previousDate = typeof match.date === "string" ? match.date : "";
  const previousTime = typeof match.time === "string" ? match.time : "";
  const previousVenue = typeof match.venue === "string" ? match.venue : "";
  const previousCourt = typeof match.courtId === "string" ? match.courtId : "";
  const previousKey = typeof match.scheduleNoticeKey === "string" ? match.scheduleNoticeKey : "";
  const nextKey = scheduled ? `${date}|${time}|${courtId}` : "";
  const played = match.status === "played";
  const hadSchedule = Boolean(previousDate && previousTime);

  const batch = db().batch();
  batch.update(matchSnap.ref, {
    date,
    time,
    venue,
    courtId,
    status: played ? "played" : scheduled ? "scheduled" : "unscheduled",
    scheduleNoticeKey: nextKey,
    updatedAt: new Date().toISOString(),
  });
  if (scheduled && tournamentSnap.exists && tournament.status === "upcoming") {
    batch.update(tournamentSnap.ref, { status: "active" });
  }
  const holdId = `match_${matchId}`;
  const oldHolds = await db().collection("courtHolds").where("matchId", "==", matchId).get();
  oldHolds.docs.forEach((docSnap) => {
    if (courtId && scheduled && docSnap.id === holdId) return;
    batch.delete(docSnap.ref);
  });
  if (courtId && scheduled) {
    const start = toMinutes(time) || 0;
    batch.set(db().doc(`courtHolds/${holdId}`), {
      courtId,
      date,
      startTime: time,
      endTime: fromMinutes(start + duration),
      source: "match",
      matchId,
      note: "",
    });
  }
  await batch.commit();

  const changed =
    date !== previousDate ||
    time !== previousTime ||
    courtId !== previousCourt ||
    venue !== previousVenue;
  if (scheduled && changed && nextKey !== previousKey) {
    const platformName = String(config.name || "la plataforma");
    const tournamentName = String(tournament.name || "el torneo");
    const homeId = String(match.homeClubId || "");
    const awayId = String(match.awayClubId || "");
    const [home, away] = await Promise.all([
      db().doc(`clubs/${homeId}`).get(),
      db().doc(`clubs/${awayId}`).get(),
    ]);
    const homeName = String(home.data()?.name || "Local");
    const awayName = String(away.data()?.name || "Visitante");
    const when = friendlyWhen(date, time);
    const previous = hadSchedule
      ? `${friendlyWhen(previousDate, previousTime)}${previousVenue ? ` · ${previousVenue}` : ""}`
      : undefined;
    const subject = previous
      ? `Partido reprogramado: ${homeName} vs ${awayName}`
      : `Partido calendarizado: ${homeName} vs ${awayName}`;
    const sides = [
      { clubId: homeId, clubName: homeName, rivalName: awayName },
      { clubId: awayId, clubName: awayName, rivalName: homeName },
    ];
    if (gmailConfigured()) {
      for (const side of sides) {
        if (!side.clubId) continue;
        const emails = await presidentEmails(side.clubId);
        for (const email of emails) {
          await sendGmail({
            to: email,
            subject,
            html: scheduleEmailHtml({
              platformName,
              clubName: side.clubName,
              rivalName: side.rivalName,
              tournamentName,
              when,
              venue,
              previous,
            }),
            text: scheduleEmailText({
              platformName,
              clubName: side.clubName,
              rivalName: side.rivalName,
              tournamentName,
              when,
              venue,
              previous,
            }),
            fromName: platformName,
          });
        }
      }
    } else {
      console.warn("Gmail no está configurado; no se avisó el partido.");
    }
  }

  return { ok: true };
});
