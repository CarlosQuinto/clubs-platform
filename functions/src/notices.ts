import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  enrollmentEmailHtml,
  enrollmentEmailText,
  gmailConfigured,
  scheduleEmailHtml,
  scheduleEmailText,
  sendGmail,
} from "./mail";
import { assertSuperAdmin, platformBrand, presidentEmails, sql } from "./sql";

const CALLABLE = { cors: true, region: "us-central1" as const };
const APP_URL = process.env.APP_URL || "https://clubs-platform-aem9u.web.app";

type NoticeClub = {
  id: string;
  name: string;
  slug?: string;
  clubMembers_on_club: { email: string }[];
  clubInvites_on_club: { email: string }[];
};

type MatchScheduleNoticeData = {
  match?: {
    id: string;
    matchDate?: string | null;
    startTime?: string | null;
    venue: string;
    status: string;
    scheduleNoticeKey?: string | null;
    court?: { id: string; name: string } | null;
    tournament: { name: string };
    homeClub: NoticeClub;
    awayClub: NoticeClub;
  } | null;
  courts: { id: string; name: string }[];
};

type TournamentEnrollmentNoticeData = {
  tournament?: {
    name: string;
    startDate?: string | null;
    tournamentClubs_on_tournament: { club: NoticeClub & { slug: string } }[];
  } | null;
};

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

/** Avisa a los Presidentes de ambos clubes que su partido quedó calendarizado o cambió. */
export const sendMatchScheduleNotice = onCall(CALLABLE, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Inicia sesión.");
  await assertSuperAdmin(request.auth.uid, "Solo un superadmin puede calendarizar.");
  const matchId = String(request.data?.matchId || "").trim();
  if (!matchId) throw new HttpsError("invalid-argument", "Falta el partido.");

  const result = await sql().executeQuery<MatchScheduleNoticeData, { matchId: string }>(
    "MatchScheduleNotice",
    { matchId },
  );
  const match = result.data.match;
  if (!match) throw new HttpsError("not-found", "No se encontró el partido.");
  const date = match.matchDate || "";
  const time = match.startTime || "";
  if (!date || !time) return { mailed: false };

  const courtId = match.court?.id || "";
  const nextKey = `${date}|${time}|${courtId}`;
  const previousKey = match.scheduleNoticeKey || "";
  if (nextKey === previousKey) return { mailed: false };
  await sql().executeMutation("MarkMatchScheduleNotice", { matchId, key: nextKey });

  const [previousDate = "", previousTime = "", previousCourt = ""] = previousKey.split("|");
  const previousVenue = result.data.courts.find((court) => court.id === previousCourt)?.name || "";
  const previous =
    previousDate && previousTime
      ? `${friendlyWhen(previousDate, previousTime)}${previousVenue ? ` · ${previousVenue}` : ""}`
      : undefined;
  const venue = match.venue || match.court?.name || "";
  const when = friendlyWhen(date, time);
  const homeName = match.homeClub.name || "Local";
  const awayName = match.awayClub.name || "Visitante";
  const subject = previous
    ? `Partido reprogramado: ${homeName} vs ${awayName}`
    : `Partido calendarizado: ${homeName} vs ${awayName}`;
  if (!gmailConfigured()) {
    console.warn("Gmail no está configurado; no se avisó el partido.");
    return { mailed: false };
  }

  const { name: platformName } = await platformBrand();
  const sides = [
    { club: match.homeClub, clubName: homeName, rivalName: awayName },
    { club: match.awayClub, clubName: awayName, rivalName: homeName },
  ];
  let mailed = false;
  for (const side of sides) {
    const content = {
      platformName,
      clubName: side.clubName,
      rivalName: side.rivalName,
      tournamentName: match.tournament.name || "el torneo",
      when,
      venue,
      previous,
    };
    for (const email of presidentEmails(side.club)) {
      const sent = await sendGmail({
        to: email,
        subject,
        html: scheduleEmailHtml(content),
        text: scheduleEmailText(content),
        fromName: platformName,
      });
      mailed = mailed || sent;
    }
  }
  return { mailed };
});

/** Avisa una sola vez a cada club recién inscrito para que cargue su disponibilidad. */
export const sendTournamentEnrollmentNotice = onCall(CALLABLE, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Inicia sesión.");
  await assertSuperAdmin(request.auth.uid, "Solo un superadmin puede inscribir equipos.");
  const tournamentId = String(request.data?.tournamentId || "").trim();
  const clubIds: string[] = Array.isArray(request.data?.clubIds)
    ? request.data.clubIds.map((id: unknown) => String(id || "").trim()).filter(Boolean)
    : [];
  if (!tournamentId || !clubIds.length) {
    throw new HttpsError("invalid-argument", "Faltan el torneo o los equipos.");
  }

  const result = await sql().executeQuery<TournamentEnrollmentNoticeData, { tournamentId: string }>(
    "TournamentEnrollmentNotice",
    { tournamentId },
  );
  const tournament = result.data.tournament;
  if (!tournament) throw new HttpsError("not-found", "No se encontró el torneo.");
  const wanted = new Set(clubIds);
  const clubs = tournament.tournamentClubs_on_tournament
    .map((row) => row.club)
    .filter((club) => wanted.has(club.id));
  const { name: platformName } = await platformBrand();
  const tournamentName = tournament.name || "el torneo";
  const startDate = tournament.startDate || "";

  let notified = 0;
  for (const club of clubs) {
    const recorded = await sql().executeMutation<{ notice?: unknown }, { tournamentId: string; clubId: string }>(
      "RecordTournamentNotice",
      { tournamentId, clubId: club.id },
    );
    if (recorded.data.notice == null) continue;
    if (!gmailConfigured()) {
      console.warn("Gmail no está configurado; no se avisó la inscripción.");
      continue;
    }
    const clubName = club.name || "Tu equipo";
    const content = {
      platformName,
      clubName,
      tournamentName,
      startDate,
      actionUrl: `${APP_URL}/${club.slug || club.id}#disponibilidad`,
    };
    for (const email of presidentEmails(club)) {
      const sent = await sendGmail({
        to: email,
        subject: `${clubName} fue inscrito en ${tournamentName}`,
        html: enrollmentEmailHtml(content),
        text: enrollmentEmailText(content),
        fromName: platformName,
      });
      if (sent) notified += 1;
    }
  }
  return { notified };
});
