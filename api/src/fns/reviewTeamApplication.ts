import { assertSuperAdmin, platformBrand, teamApplicationMail, userExists } from "../db.js";
import { FnError } from "../errors.js";
import {
  sendGmail,
  teamApprovedEmailHtml,
  teamApprovedEmailText,
  teamRejectedEmailHtml,
  teamRejectedEmailText,
} from "../mail.js";
import { APP_URL, emailKey, inviteUrls, type FnHandler, type InviteKind } from "./shared.js";

/** Correo al capitán después de aprobar o rechazar su solicitud en SQL. */
export const reviewTeamApplication: FnHandler = async ({ auth, data }) => {
  await assertSuperAdmin(auth.uid, "Solo un superadmin puede revisar solicitudes.");

  const applicationId = String(data.applicationId || "").trim();
  const action = String(data.action || "").trim();
  if (!applicationId || !["approve", "reject"].includes(action)) {
    throw new FnError("invalid-argument", "La revisión no es válida.");
  }

  const application = await teamApplicationMail(applicationId);
  if (!application) throw new FnError("not-found", "La solicitud no existe.");
  const expected = action === "approve" ? "APPROVED" : "REJECTED";
  if (application.status !== expected) {
    throw new FnError("failed-precondition", "La solicitud todavía no se revisó.");
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
  const token = String(data.token || "").trim();
  if (!clubId || !token) {
    throw new FnError("invalid-argument", "Faltan los datos del correo.");
  }
  const key = String(data.emailKey || emailKey(captainEmail));
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
};
