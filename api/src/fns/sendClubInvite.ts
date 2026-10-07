import { assertClubAdmin, clubMailInfo, platformBrand, userExists } from "../db.js";
import { FnError } from "../errors.js";
import { inviteEmailHtml, inviteEmailText, roleLabel, sendGmail } from "../mail.js";
import {
  EMAIL_RE,
  ROLES,
  TOKEN_RE,
  emailKey,
  inviteUrls,
  type FnHandler,
  type InviteKind,
} from "./shared.js";

/** Correo de invitación a un club. La invitación ya se guardó en SQL desde el panel. */
export const sendClubInvite: FnHandler = async ({ auth, data }) => {
  const clubId = String(data.clubId || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const role = String(data.role || "").trim();
  const token = String(data.token || "").trim();
  const hold = data.hold === true;
  if (
    !clubId ||
    email.length < 6 ||
    email.length > 100 ||
    !TOKEN_RE.test(token) ||
    !ROLES.includes(role as (typeof ROLES)[number])
  ) {
    throw new FnError("invalid-argument", "Datos de invitación incompletos.");
  }
  if (!EMAIL_RE.test(email)) {
    throw new FnError("invalid-argument", "El correo no es válido.");
  }

  await assertClubAdmin(auth.uid, clubId);

  const club = await clubMailInfo(clubId);
  if (!club || club.deletedAt) throw new FnError("not-found", "El club no existe.");

  const key = emailKey(email);
  const kind: InviteKind = (await userExists(email)) ? "accept" : "signup";
  const urls = inviteUrls(clubId, email, key, token, kind, club.slug || clubId);
  if (hold) {
    return { kind, mailed: false, url: urls.copyUrl, held: true };
  }
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
};
