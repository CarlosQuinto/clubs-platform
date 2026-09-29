import { randomBytes } from "crypto";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { inviteEmailHtml, roleLabel, sendMail } from "./mail";

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
) {
  const accept = `${APP_URL}/invitar?c=${encodeURIComponent(clubId)}&e=${encodeURIComponent(key)}&t=${encodeURIComponent(token)}`;
  if (kind === "signup") {
    const signup = `${APP_URL}/registro?email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/${clubId}`)}`;
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
  const urls = inviteUrls(clubId, email, key, token, kind);

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

  const html = inviteEmailHtml({
    kind,
    clubName,
    role,
    actionUrl: urls.actionUrl,
    declineUrl: urls.declineUrl,
  });
  const subject =
    kind === "signup"
      ? `Crea tu cuenta para unirte a ${clubName}`
      : `¿Aceptas el rol de ${roleLabel(role)} en ${clubName}?`;

  await db.collection("mail").add({
    to: [email],
    message: { subject, html },
    createdAt: FieldValue.serverTimestamp(),
    meta: { clubId, kind },
  });

  const mailed = await sendMail({ to: email, subject, html });

  return {
    kind,
    mailed,
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
  return {
    clubId,
    clubName: String(club.data()?.name || clubId),
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
  return { ok: true, action, clubId };
});

async function sendFirebasePasswordReset(email: string) {
  const apiKey = process.env.WEB_API_KEY;
  if (!apiKey) {
    await auth.generatePasswordResetLink(email);
    console.warn("WEB_API_KEY no está configurada; no se envió el correo.");
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

/** Recupera contraseña: solo envía si el correo ya tiene cuenta. Nunca crea usuarios. */
export const requestPasswordReset = onCall(CALLABLE, async (request) => {
  const email = String(request.data?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "El correo no es válido.");
  }
  if (await userExists(email)) {
    await sendFirebasePasswordReset(email);
  }
  return { ok: true };
});
