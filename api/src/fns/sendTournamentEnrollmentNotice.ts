import {
  assertSuperAdmin,
  platformBrand,
  presidentEmails,
  recordTournamentNotice,
  tournamentEnrollmentNotice,
} from "../db.js";
import { FnError } from "../errors.js";
import { enrollmentEmailHtml, enrollmentEmailText, gmailConfigured, sendGmail } from "../mail.js";
import { APP_URL, type FnHandler } from "./shared.js";

/** Avisa una sola vez a cada club recién inscrito para que cargue su disponibilidad. */
export const sendTournamentEnrollmentNotice: FnHandler = async ({ auth, data }) => {
  await assertSuperAdmin(auth.uid, "Solo un superadmin puede inscribir equipos.");
  const tournamentId = String(data.tournamentId || "").trim();
  const clubIds: string[] = Array.isArray(data.clubIds)
    ? data.clubIds.map((id: unknown) => String(id || "").trim()).filter(Boolean)
    : [];
  if (!tournamentId || !clubIds.length) {
    throw new FnError("invalid-argument", "Faltan el torneo o los equipos.");
  }

  const tournament = await tournamentEnrollmentNotice(tournamentId);
  if (!tournament) throw new FnError("not-found", "No se encontró el torneo.");
  const wanted = new Set(clubIds);
  const clubs = tournament.clubs.filter((club) => wanted.has(club.id));
  const { name: platformName } = await platformBrand();
  const tournamentName = tournament.name || "el torneo";
  const startDate = tournament.startDate || "";

  let notified = 0;
  for (const club of clubs) {
    const recorded = await recordTournamentNotice(tournamentId, club.id);
    if (recorded == null) continue;
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
};
