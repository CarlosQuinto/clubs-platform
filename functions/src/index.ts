import { randomBytes } from "crypto";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  gmailConfigured,
  inviteEmailHtml,
  inviteEmailText,
  platformAdminInviteEmailHtml,
  platformAdminInviteEmailText,
  passwordResetEmailHtml,
  passwordResetEmailText,
  roleLabel,
  sendGmail,
  teamApprovedEmailHtml,
  teamApprovedEmailText,
  teamRejectedEmailHtml,
  teamRejectedEmailText,
} from "./mail";

initializeApp();
const db = getFirestore();
const auth = getAuth();

const APP_URL = process.env.APP_URL || "https://clubs-platform-aem9u.web.app";
const ROLES = ["admin", "dt", "prensa", "tesorero"] as const;

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

async function assertClubAdmin(uid: string, clubId: string) {
  const config = await db.doc("platform/config").get();
  const superAdmins = (config.data()?.superAdmins || []) as string[];
  if (superAdmins.includes(uid)) return;
  const member = await db.doc(`clubs/${clubId}/members/${uid}`).get();
  if (member.data()?.role === "admin") return;
  throw new HttpsError(
    "permission-denied",
    "Solo el presidente o un superadmin puede invitar.",
  );
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

export const sendClubInvite = onCall(CALLABLE, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión para invitar.");
  }
  const clubId = String(request.data?.clubId || "").trim();
  const email = String(request.data?.email || "").trim().toLowerCase();
  const role = String(request.data?.role || "").trim();
  if (!clubId || !email || !ROLES.includes(role as (typeof ROLES)[number])) {
    throw new HttpsError("invalid-argument", "Datos de invitación incompletos.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "El correo no es válido.");
  }

  await assertClubAdmin(request.auth.uid, clubId);

  const club = await db.doc(`clubs/${clubId}`).get();
  if (!club.exists) {
    throw new HttpsError("not-found", "El club no existe.");
  }
  const clubName = String(club.data()?.name || clubId);
  const key = emailKey(email);

  const existingMember = await db
    .collection(`clubs/${clubId}/members`)
    .where("email", "==", email)
    .limit(1)
    .get();
  if (!existingMember.empty) {
    throw new HttpsError(
      "already-exists",
      "Esa persona ya es administrador del club.",
    );
  }

  const kind: InviteKind = (await userExists(email)) ? "accept" : "signup";
  const token = randomBytes(24).toString("hex");
  const slug = String(club.data()?.slug || clubId);
  const urls = inviteUrls(clubId, email, key, token, kind, slug);

  await db.doc(`clubs/${clubId}/invites/${key}`).set({
    email,
    role,
    token,
    kind,
    invitedBy: request.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (kind === "signup") {
    await db.doc(`signupInvites/${key}`).set(
      {
        email,
        clubId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    await db.doc(`signupInvites/${key}`).delete().catch(() => undefined);
  }

  const platformName = await platformDisplayName();
  const content = {
    kind,
    platformName,
    clubName,
    role,
    actionUrl: urls.actionUrl,
    declineUrl: urls.declineUrl,
  };
  const html = inviteEmailHtml(content);
  const text = inviteEmailText(content);
  const subject =
    kind === "signup"
      ? `Te invitaron a ${clubName} en ${platformName}`
      : `¿Aceptas ser ${roleLabel(role)} de ${clubName}?`;

  await db.collection("mail").add({
    to: [email],
    message: { subject, html },
    createdAt: FieldValue.serverTimestamp(),
    meta: { clubId, kind },
  });

  const mailed = await sendGmail({
    to: email,
    subject,
    html,
    text,
    fromName: platformName,
  });

  return {
    kind,
    mailed,
    url: urls.copyUrl,
  };
});

const DEFAULT_CLUB_DESCRIPTION =
  "Club conformado por auténticos amantes del fútbol. Más que un equipo, una familia en la cancha.";
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1511886929837-354d827aae26?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
const RESERVED_SLUGS = [
  "admin",
  "login",
  "registro",
  "invitar",
  "restablecer",
  "registrar-equipo",
  "contacto",
  "solicitudes",
  "clubes",
  "equipos",
  "torneos",
  "temporadas",
  "categorias",
  "api",
];

function normalizeSlug(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function assertSuperAdmin(uid: string) {
  const config = await db.doc("platform/config").get();
  const superAdmins = (config.data()?.superAdmins || []) as string[];
  if (!superAdmins.includes(uid)) {
    throw new HttpsError(
      "permission-denied",
      "Solo un superadmin puede revisar solicitudes.",
    );
  }
}

async function slugTaken(slug: string) {
  if (RESERVED_SLUGS.includes(slug)) return true;
  const snap = await db.collection("clubs").where("slug", "==", slug).limit(1).get();
  return !snap.empty;
}

async function uniqueClubSlug(teamName: string) {
  const base = normalizeSlug(teamName) || "equipo";
  let slug = base;
  let n = 2;
  while (await slugTaken(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

async function platformContact() {
  const snap = await db.doc("platform/config").get();
  const data = snap.data() || {};
  return {
    name: String(data.name || "").trim() || DEFAULT_PLATFORM_NAME,
    whatsapp: String(data.social?.whatsapp || "").trim(),
  };
}

export const reviewTeamApplication = onCall(CALLABLE, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión para revisar solicitudes.");
  }
  await assertSuperAdmin(request.auth.uid);

  const applicationId = String(request.data?.applicationId || "").trim();
  const action = String(request.data?.action || "").trim();
  if (!applicationId || !["approve", "reject"].includes(action)) {
    throw new HttpsError("invalid-argument", "La revisión no es válida.");
  }

  const appRef = db.doc(`teamApplications/${applicationId}`);
  const appSnap = await appRef.get();
  if (!appSnap.exists) {
    throw new HttpsError("not-found", "La solicitud no existe.");
  }
  const app = appSnap.data() || {};
  if (String(app.status || "pending") !== "pending") {
    throw new HttpsError("failed-precondition", "Esa solicitud ya fue revisada.");
  }

  const teamName = String(app.teamName || "").trim();
  const captainName = String(app.captainName || "").trim();
  const captainEmail = String(app.captainEmail || "").trim().toLowerCase();
  const captainPhone = String(app.captainPhone || "").trim();
  if (!teamName || !captainEmail) {
    throw new HttpsError("failed-precondition", "La solicitud está incompleta.");
  }

  const brand = await platformContact();

  if (action === "reject") {
    await appRef.update({
      status: "rejected",
      reviewedAt: FieldValue.serverTimestamp(),
    });
    const actionUrl = `${APP_URL}/registrar-equipo`;
    const content = {
      platformName: brand.name,
      teamName,
      captainName,
      actionUrl,
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

  const localityId = String(request.data?.localityId || "").trim();
  if (!localityId) {
    throw new HttpsError("invalid-argument", "Elige una localidad.");
  }
  const locality = await db.doc(`localities/${localityId}`).get();
  if (!locality.exists) {
    throw new HttpsError("not-found", "La localidad no existe.");
  }
  const localityName = String(locality.data()?.name || "");
  const slug = await uniqueClubSlug(teamName);
  const clubRef = db.collection("clubs").doc();
  const clubId = clubRef.id;

  await clubRef.set({
    slug,
    name: teamName,
    localityId,
    location: localityName,
    description: DEFAULT_CLUB_DESCRIPTION,
    heroImages: [DEFAULT_HERO_IMAGE],
    defaultLineups: {},
    presidentPhone: captainPhone,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
  });

  const key = emailKey(captainEmail);
  const kind: InviteKind = (await userExists(captainEmail)) ? "accept" : "signup";
  const token = randomBytes(24).toString("hex");
  const urls = inviteUrls(clubId, captainEmail, key, token, kind, slug);

  await db.doc(`clubs/${clubId}/invites/${key}`).set({
    email: captainEmail,
    role: "admin",
    token,
    kind,
    invitedBy: request.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
  });
  if (kind === "signup") {
    await db.doc(`signupInvites/${key}`).set(
      {
        email: captainEmail,
        clubId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    await db.doc(`signupInvites/${key}`).delete().catch(() => undefined);
  }

  await appRef.update({
    status: "approved",
    clubId,
    slug,
    reviewedAt: FieldValue.serverTimestamp(),
  });

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

  return {
    ok: true,
    action,
    mailed,
    clubId,
    slug,
    kind,
    url: urls.copyUrl,
  };
});

export const getClubInvite = onCall(CALLABLE, async (request) => {
  const clubId = String(request.data?.clubId || "").trim();
  const emailKeyParam = String(request.data?.emailKey || "").trim();
  const token = String(request.data?.token || "").trim();
  if (!clubId || !emailKeyParam || !token) {
    throw new HttpsError("invalid-argument", "Falta la invitación.");
  }
  const snap = await db.doc(`clubs/${clubId}/invites/${emailKeyParam}`).get();
  if (!snap.exists || snap.data()?.token !== token) {
    throw new HttpsError("not-found", "La invitación no es válida o ya expiró.");
  }
  const club = await db.doc(`clubs/${clubId}`).get();
  const data = snap.data() || {};
  const clubData = club.data() || {};
  return {
    clubId,
    slug: String(clubData.slug || clubId),
    clubName: String(clubData.name || clubId),
    email: String(data.email || ""),
    role: String(data.role || ""),
    kind: (data.kind as InviteKind) || "signup",
  };
});

export const respondClubInvite = onCall(CALLABLE, async (request) => {
  const clubId = String(request.data?.clubId || "").trim();
  const emailKeyParam = String(request.data?.emailKey || "").trim();
  const token = String(request.data?.token || "").trim();
  const action = String(request.data?.action || "").trim();
  if (!clubId || !emailKeyParam || !token || !["accept", "decline"].includes(action)) {
    throw new HttpsError("invalid-argument", "Solicitud incompleta.");
  }

  const inviteRef = db.doc(`clubs/${clubId}/invites/${emailKeyParam}`);
  const snap = await inviteRef.get();
  if (!snap.exists || snap.data()?.token !== token) {
    throw new HttpsError("not-found", "La invitación no es válida o ya expiró.");
  }
  const data = snap.data() || {};
  const email = String(data.email || "").toLowerCase();
  const role = String(data.role || "admin");

  if (action === "decline") {
    await inviteRef.delete();
    await db.doc(`signupInvites/${emailKeyParam}`).delete().catch(() => undefined);
    return { ok: true, action };
  }

  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Inicia sesión con el correo invitado para aceptar.",
    );
  }
  const authEmail = (request.auth.token.email || "").toLowerCase();
  if (authEmail !== email) {
    throw new HttpsError(
      "permission-denied",
      `Entra con ${email} para aceptar esta invitación.`,
    );
  }

  await db.doc(`clubs/${clubId}/members/${request.auth.uid}`).set({
    role,
    email,
    displayName: request.auth.token.name || "",
    joinedAt: FieldValue.serverTimestamp(),
  });
  await inviteRef.delete();
  await db.doc(`signupInvites/${emailKeyParam}`).delete().catch(() => undefined);
  const club = await db.doc(`clubs/${clubId}`).get();
  return {
    ok: true,
    action,
    clubId,
    slug: String(club.data()?.slug || clubId),
  };
});

const DEFAULT_PLATFORM_NAME = "Clubs Platform";

async function platformDisplayName() {
  const snap = await db.doc("platform/config").get();
  const name = String(snap.data()?.name || "").trim();
  return name || DEFAULT_PLATFORM_NAME;
}

export const sendPlatformAdminInvite = onCall(CALLABLE, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Inicia sesión para invitar.");
  }
  await assertSuperAdmin(request.auth.uid);

  const email = String(request.data?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "El correo no es válido.");
  }

  const config = await db.doc("platform/config").get();
  const adminEmails = (config.data()?.superAdminEmails || {}) as Record<string, string>;
  if (Object.values(adminEmails).some((value) => String(value).toLowerCase() === email)) {
    throw new HttpsError("already-exists", "Ese correo ya es administrador.");
  }

  const key = emailKey(email);
  const kind: InviteKind = (await userExists(email)) ? "accept" : "signup";
  const actionUrl =
    kind === "signup"
      ? `${APP_URL}/registro?email=${encodeURIComponent(email)}`
      : `${APP_URL}/login`;

  await db.doc(`platform/config/invites/${key}`).set(
    {
      email,
      invitedBy: request.auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  if (kind === "signup") {
    await db.doc(`signupInvites/${key}`).set(
      {
        email,
        platform: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  const platformName = await platformDisplayName();
  const content = { kind, platformName, actionUrl };
  const subject =
    kind === "signup"
      ? `Te invitaron a administrar ${platformName}`
      : `Acepta administrar ${platformName}`;
  const html = platformAdminInviteEmailHtml(content);
  const text = platformAdminInviteEmailText(content);

  await db.collection("mail").add({
    to: [email],
    message: { subject, html },
    createdAt: FieldValue.serverTimestamp(),
    meta: { kind, platform: true },
  });

  const mailed = await sendGmail({
    to: email,
    subject,
    html,
    text,
    fromName: platformName,
  });

  return { kind, mailed, url: actionUrl };
});

async function sendCustomPasswordReset(email: string) {
  const platformName = await platformDisplayName();
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

export {
  ensureTournamentTables,
  rebuildAllTournamentTables,
  syncTournamentTablesOnClubs,
  syncTournamentTablesOnMatch,
} from "./tournamentTables";

export { notifyTournamentEnrollment, scheduleMatch } from "./scheduling";

export { backfillMatchListings, syncMatchListing } from "./matchListings";

export { migrateClubAvailability } from "./availability";

/** Recupera contraseña: solo envía si el correo ya tiene cuenta. Nunca crea usuarios. */
export const requestPasswordReset = onCall(CALLABLE, async (request) => {
  const email = String(request.data?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "El correo no es válido.");
  }
  if (await userExists(email)) {
    if (gmailConfigured()) await sendCustomPasswordReset(email);
    else await sendFirebasePasswordReset(email);
  }
  return { ok: true };
});
