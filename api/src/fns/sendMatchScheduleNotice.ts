import {
  assertSuperAdmin,
  markMatchScheduleNotice,
  matchScheduleNotice,
  platformBrand,
  presidentEmails,
} from "../db.js";
import { FnError } from "../errors.js";
import {
  gmailConfigured,
  scheduleEmailHtml,
  scheduleEmailText,
  sendGmail,
  unscheduledEmailHtml,
  unscheduledEmailText,
} from "../mail.js";
import type { FnHandler } from "./shared.js";

export function friendlyWhen(date: string, time: string) {
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

/** Motivos por los que un partido programado vuelve a «por programar»; el texto completa «quedó pendiente de reprogramar …». */
const UNSCHEDULE_REASONS: Record<string, string> = {
  courts: "porque cambió el horario de las canchas",
};

/**
 * Avisa a los Presidentes de ambos clubes que su partido quedó calendarizado o cambió. Con `reason`
 * (p. ej. "courts") y el partido ya sin fecha, avisa de que quedó pendiente de reprogramar, siempre que
 * antes se les hubiera avisado una fecha (schedule_notice_key).
 */
export const sendMatchScheduleNotice: FnHandler = async ({ auth, data }) => {
  await assertSuperAdmin(auth.uid, "Solo un superadmin puede calendarizar.");
  const matchId = String(data.matchId || "").trim();
  if (!matchId) throw new FnError("invalid-argument", "Falta el partido.");
  const reason = UNSCHEDULE_REASONS[String(data.reason || "")] || "";

  const result = await matchScheduleNotice(matchId);
  const match = result.match;
  if (!match) throw new FnError("not-found", "No se encontró el partido.");
  const date = match.matchDate || "";
  const time = match.startTime || "";
  if (!date || !time) {
    return reason ? await notifyUnscheduled(matchId, match, result.courts, reason) : { mailed: false };
  }

  const courtId = match.court?.id || "";
  const nextKey = `${date}|${time}|${courtId}`;
  const previousKey = match.scheduleNoticeKey || "";
  if (nextKey === previousKey) return { mailed: false };
  await markMatchScheduleNotice(matchId, nextKey);

  const [previousDate = "", previousTime = "", previousCourt = ""] = previousKey.split("|");
  const previousVenue = result.courts.find((court) => court.id === previousCourt)?.name || "";
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
};

type NoticeResult = Awaited<ReturnType<typeof matchScheduleNotice>>;

/** El partido perdió su fecha: se avisa la que tenía y se borra la llave para que la próxima se avise como nueva. */
async function notifyUnscheduled(
  matchId: string,
  match: NonNullable<NoticeResult["match"]>,
  courts: NoticeResult["courts"],
  reason: string,
) {
  const previousKey = match.scheduleNoticeKey || "";
  if (!previousKey) return { mailed: false };
  await markMatchScheduleNotice(matchId, "");
  const [previousDate = "", previousTime = "", previousCourt = ""] = previousKey.split("|");
  if (!previousDate || !previousTime) return { mailed: false };
  const previousVenue = courts.find((court) => court.id === previousCourt)?.name || "";
  const previous = `${friendlyWhen(previousDate, previousTime)}${previousVenue ? ` · ${previousVenue}` : ""}`;
  const homeName = match.homeClub.name || "Local";
  const awayName = match.awayClub.name || "Visitante";
  if (!gmailConfigured()) {
    console.warn("Gmail no está configurado; no se avisó el partido por reprogramar.");
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
      previous,
      reason,
    };
    for (const email of presidentEmails(side.club)) {
      const sent = await sendGmail({
        to: email,
        subject: `Partido por reprogramar: ${homeName} vs ${awayName}`,
        html: unscheduledEmailHtml(content),
        text: unscheduledEmailText(content),
        fromName: platformName,
      });
      mailed = mailed || sent;
    }
  }
  return { mailed };
}
