import { assertSuperAdmin, platformAdminInviteMail, platformBrand, userExists } from "../db.js";
import { FnError } from "../errors.js";
import { platformAdminInviteEmailHtml, platformAdminInviteEmailText, sendGmail } from "../mail.js";
import {
  APP_URL,
  EMAIL_RE,
  emailKey,
  throttleHits,
  type FnHandler,
  type InviteKind,
} from "./shared.js";

const ADMIN_INVITE_WINDOW_SECONDS = 15 * 60;
const ADMIN_INVITE_LIMIT_PER_ADMIN = 20;
const ADMIN_INVITE_LIMIT_PER_EMAIL = 3;

/**
 * Correo de invitación a superadministrador. La invitación ya se guardó en SQL.
 * Limita por superadmin y por correo para que los reenvíos no sirvan para spam.
 */
export const sendPlatformAdminInvite: FnHandler = async ({ auth, data }) => {
  await assertSuperAdmin(auth.uid, "Solo un superadmin puede invitar.");

  const email = String(data.email || "").trim().toLowerCase();
  if (email.length > 100 || !EMAIL_RE.test(email)) {
    throw new FnError("invalid-argument", "El correo no es válido.");
  }
  if (
    (await throttleHits(`admin-invite-uid:${auth.uid}`, ADMIN_INVITE_WINDOW_SECONDS)) >
    ADMIN_INVITE_LIMIT_PER_ADMIN
  ) {
    throw new FnError("resource-exhausted", "Demasiadas invitaciones. Espera unos minutos.");
  }
  if (
    (await throttleHits(`admin-invite:${email}`, ADMIN_INVITE_WINDOW_SECONDS)) >
    ADMIN_INVITE_LIMIT_PER_EMAIL
  ) {
    throw new FnError("resource-exhausted", "Demasiados envíos a ese correo. Espera unos minutos.");
  }
  const invite = await platformAdminInviteMail(emailKey(email));
  if (!invite) {
    throw new FnError("not-found", "No hay una invitación para ese correo.");
  }
  const kind: InviteKind = (await userExists(email)) ? "accept" : "signup";
  const actionUrl =
    kind === "signup" ? `${APP_URL}/registro?email=${encodeURIComponent(email)}` : `${APP_URL}/login`;
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
};
