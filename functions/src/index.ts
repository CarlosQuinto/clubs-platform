import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  gmailConfigured,
  inviteEmailHtml,
  inviteEmailText,
  platformAdminInviteEmailHtml,
  platformAdminInviteEmailText,
  passwordResetEmailHtml,
  passwordResetEmailText,
  courtBookingEmailHtml,
  courtBookingEmailText,
  courtBookingSubject,
  type CourtBookingKind,
  type CourtBookingSlot,
  roleLabel,
  sendGmail,
  teamApprovedEmailHtml,
  teamApprovedEmailText,
  teamRejectedEmailHtml,
  teamRejectedEmailText,
} from "./mail";
import { assertClubAdmin, assertSuperAdmin, platformBrand, sql } from "./sql";

initializeApp();
const auth = getAuth();

const APP_URL = process.env.APP_URL || "https://clubs-platform-aem9u.web.app";
const ROLES = ["admin", "dt", "prensa", "tesorero"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailKey = (email: string) =>
  email.trim().toLowerCase().replace(/\./g, ",");

type InviteKind = "signup" | "accept";

async function userExists(email: string) {
  try {
    await auth.getUserByEmail(email);
    return true;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "auth/user-not-found") return false;
    throw err;
  }
}

function inviteUrls(
  clubId: string,
  email: string,
  key: string,
  token: string,
  kind: InviteKind,
  slug: string,
) {
  const accept = `${APP_URL}/invitar?c=${encodeURIComponent(clubId)}&e=${encodeURIComponent(key)}&t=${encodeURIComponent(token)}`;
  if (kind === "signup") {
    const signup = `${APP_URL}/registro?email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/${slug}`)}`;
    return {
      actionUrl: signup,
      declineUrl: undefined as string | undefined,
      copyUrl: signup,
    };
  }
  return {
    actionUrl: accept,
    declineUrl: `${accept}&accion=rechazar`,
    copyUrl: accept,
  };
}

const CALLABLE = { cors: true, region: "us-central1" as const };

/** Correo de invitación a un club. La invitación ya se guardó en SQL desde el panel. */
export const sendClubInvite = onCall(CALLABLE, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión para invitar.");
  }
  const clubId = String(request.data?.clubId || "").trim();
  const email = String(request.data?.email || "").trim().toLowerCase();
  const role = String(request.data?.role || "").trim();
  const token = String(request.data?.token || "").trim();
  if (!clubId || !email || !token || !ROLES.includes(role as (typeof ROLES)[number])) {
    throw new HttpsError("invalid-argument", "Datos de invitación incompletos.");
  }
  if (!EMAIL_RE.test(email)) {
    throw new HttpsError("invalid-argument", "El correo no es válido.");
  }

  await assertClubAdmin(request.auth.uid, clubId);

  const found = await sql().executeQuery<
    { club?: { id: string; name: string; slug: string } | null },
    { clubId: string }
  >("ClubMailInfo", { clubId });
  const club = found.data.club;
  if (!club) throw new HttpsError("not-found", "El club no existe.");

  const key = emailKey(email);
  const kind: InviteKind = (await userExists(email)) ? "accept" : "signup";
  const urls = inviteUrls(clubId, email, key, token, kind, club.slug || clubId);
  const { name: platformName } = await platformBrand();
  const content = {
    kind,
    platformName,
    clubName: club.name,
    role,
    actionUrl: urls.actionUrl,
    declineUrl: urls.declineUrl,
  };
  const mailed = await sendGmail({
    to: email,
    subject:
      kind === "signup"
        ? `Te invitaron a ${club.name} en ${platformName}`
        : `¿Aceptas ser ${roleLabel(role)} de ${club.name}?`,
    html: inviteEmailHtml(content),
    text: inviteEmailText(content),
    fromName: platformName,
  });
  return { kind, mailed, url: urls.copyUrl };
});

type TeamApplicationMailData = {
  teamApplication?: {
    teamName: string;
    captainName: string;
    captainEmail: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    slug?: string | null;
    club?: { id: string; slug: string } | null;
  } | null;
};

/** Correo al capitán después de aprobar o rechazar su solicitud en SQL. */
export const reviewTeamApplication = onCall(CALLABLE, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión para revisar solicitudes.");
  }
  await assertSuperAdmin(request.auth.uid, "Solo un superadmin puede revisar solicitudes.");

  const applicationId = String(request.data?.applicationId || "").trim();
  const action = String(request.data?.action || "").trim();
  if (!applicationId || !["approve", "reject"].includes(action)) {
    throw new HttpsError("invalid-argument", "La revisión no es válida.");
  }

  const found = await sql().executeQuery<TeamApplicationMailData, { id: string }>(
    "TeamApplicationMail",
    { id: applicationId },
  );
  const application = found.data.teamApplication;
  if (!application) throw new HttpsError("not-found", "La solicitud no existe.");
  const expected = action === "approve" ? "APPROVED" : "REJECTED";
  if (application.status !== expected) {
    throw new HttpsError("failed-precondition", "La solicitud todavía no se revisó.");
  }
  const teamName = application.teamName.trim();
  const captainName = application.captainName.trim();
  const captainEmail = application.captainEmail.trim().toLowerCase();
  const brand = await platformBrand();
  const kind: InviteKind = (await userExists(captainEmail)) ? "accept" : "signup";

  if (action === "reject") {
    const content = {
      platformName: brand.name,
      teamName,
      captainName,
      actionUrl: `${APP_URL}/registrar-equipo`,
      whatsapp: brand.whatsapp,
    };
    const mailed = await sendGmail({
      to: captainEmail,
      subject: `No registramos a ${teamName}`,
      html: teamRejectedEmailHtml(content),
      text: teamRejectedEmailText(content),
      fromName: brand.name,
    });
    return { ok: true, action, mailed };
  }

  const clubId = application.club?.id || "";
  const slug = application.club?.slug || application.slug || "";
  const token = String(request.data?.token || "").trim();
  if (!clubId || !token) {
    throw new HttpsError("invalid-argument", "Faltan los datos del correo.");
  }
  const key = String(request.data?.emailKey || emailKey(captainEmail));
  const urls = inviteUrls(clubId, captainEmail, key, token, kind, slug);
  const content = {
    kind,
    platformName: brand.name,
    teamName,
    captainName,
    actionUrl: urls.actionUrl,
  };
  const mailed = await sendGmail({
    to: captainEmail,
    subject: `${teamName} ya está en ${brand.name}`,
    html: teamApprovedEmailHtml(content),
    text: teamApprovedEmailText(content),
    fromName: brand.name,
  });
  return { ok: true, action, mailed, clubId, slug, kind, url: urls.copyUrl };
});

/** Correo de invitación a superadministrador. La invitación ya se guardó en SQL. */
export const sendPlatformAdminInvite = onCall(CALLABLE, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión para invitar.");
  }
  await assertSuperAdmin(request.auth.uid, "Solo un superadmin puede invitar.");

  const email = String(request.data?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new HttpsError("invalid-argument", "El correo no es válido.");
  }
  const invite = await sql().executeQuery<
    { platformAdminInvite?: { email: string } | null },
    { emailKey: string }
  >("PlatformAdminInviteMail", { emailKey: emailKey(email) });
  if (!invite.data.platformAdminInvite) {
    throw new HttpsError("not-found", "No hay una invitación para ese correo.");
  }
  const kind: InviteKind = (await userExists(email)) ? "accept" : "signup";
  const actionUrl =
    kind === "signup"
      ? `${APP_URL}/registro?email=${encodeURIComponent(email)}`
      : `${APP_URL}/login`;
  const { name: platformName } = await platformBrand();
  const content = { kind, platformName, actionUrl };
  const mailed = await sendGmail({
    to: email,
    subject:
      kind === "signup"
        ? `Te invitaron a administrar ${platformName}`
        : `Acepta administrar ${platformName}`,
    html: platformAdminInviteEmailHtml(content),
    text: platformAdminInviteEmailText(content),
    fromName: platformName,
  });
  return { kind, mailed, url: actionUrl };
});

async function sendCustomPasswordReset(email: string) {
  const { name: platformName } = await platformBrand();
  const firebaseLink = await auth.generatePasswordResetLink(email);
  const oobCode = new URL(firebaseLink).searchParams.get("oobCode");
  if (!oobCode) {
    console.error("El enlace de restablecimiento no incluyó oobCode.");
    return;
  }
  const actionUrl = `${APP_URL}/restablecer?oobCode=${encodeURIComponent(oobCode)}`;
  const content = { platformName, email, actionUrl };
  const sent = await sendGmail({
    to: email,
    subject: `Restablece tu contraseña de ${platformName}`,
    html: passwordResetEmailHtml(content),
    text: passwordResetEmailText(content),
    fromName: platformName,
  });
  if (!sent) {
    console.error("No se pudo enviar el correo de restablecimiento por Gmail.");
  }
}

async function sendFirebasePasswordReset(email: string) {
  const apiKey = process.env.WEB_API_KEY;
  if (!apiKey) {
    await auth.generatePasswordResetLink(email);
    console.warn(
      "WEB_API_KEY no está configurada en la función; no se envió el correo de restablecimiento.",
    );
    return;
  }
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    console.error("sendOobCode error:", res.status, body);
  }
}

export { sendMatchScheduleNotice, sendTournamentEnrollmentNotice } from "./notices";

/** Avisa por correo una renta de cancha: alta, cambio o cancelación. */
export const sendCourtBookingNotice = onCall(CALLABLE, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión para avisar la renta.");
  }
  const to = String(request.data?.to || "").trim().toLowerCase();
  const kind = String(request.data?.kind || "") as CourtBookingKind;
  const dateLabel = String(request.data?.dateLabel || "").trim();
  const note = String(request.data?.note || "");
  const rawSlots = Array.isArray(request.data?.slots) ? request.data.slots : [];
  if (!EMAIL_RE.test(to)) {
    throw new HttpsError("invalid-argument", "El correo no es válido.");
  }
  if (kind !== "created" && kind !== "updated" && kind !== "cancelled") {
    throw new HttpsError("invalid-argument", "El aviso no es válido.");
  }
  const slots: CourtBookingSlot[] = rawSlots.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const courtName = String(row.courtName || "").trim();
    const startLabel = String(row.startLabel || "").trim();
    const endLabel = String(row.endLabel || "").trim();
    const durationLabel = String(row.durationLabel || "").trim();
    const priceLabel = String(row.priceLabel || "").trim();
    if (!courtName || !startLabel || !endLabel) return [];
    return [{ courtName, startLabel, endLabel, durationLabel, priceLabel }];
  });
  if (!slots.length || !dateLabel) {
    throw new HttpsError("invalid-argument", "Faltan los datos de la renta.");
  }
  const { name: platformName } = await platformBrand();
  const content = { platformName, kind, dateLabel, note, slots };
  const mailed = await sendGmail({
    to,
    subject: courtBookingSubject(kind, platformName),
    html: courtBookingEmailHtml(content),
    text: courtBookingEmailText(content),
    fromName: platformName,
  });
  return { mailed };
});

/** Recupera contraseña: solo envía si el correo ya tiene cuenta. Nunca crea usuarios. */
export const requestPasswordReset = onCall(CALLABLE, async (request) => {
  const email = String(request.data?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new HttpsError("invalid-argument", "El correo no es válido.");
  }
  if (await userExists(email)) {
    if (gmailConfigured()) await sendCustomPasswordReset(email);
    else await sendFirebasePasswordReset(email);
  }
  return { ok: true };
});
