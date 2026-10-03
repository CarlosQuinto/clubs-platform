import { getDataConnect } from "firebase-admin/data-connect";
import { HttpsError } from "firebase-functions/v2/https";

export const DEFAULT_PLATFORM_NAME = "Clubs Platform";

/** Conector `functions`: operaciones NO_ACCESS que solo corre el Admin SDK. */
export function sql() {
  return getDataConnect({
    location: "us-east4",
    serviceId: "clubs-platform-aem9u-service",
    connector: "functions",
  });
}

type AdminGate = {
  platformAdmin?: { email: string } | null;
  clubMember?: { role: string } | null;
};

async function adminGate(userId: string, clubId: string) {
  const result = await sql().executeQuery<AdminGate, { userId: string; clubId: string }>(
    "FunctionsAdminGate",
    { userId, clubId },
  );
  return result.data;
}

export async function assertSuperAdmin(uid: string, message = "Solo un superadmin puede hacer esto.") {
  const gate = await adminGate(uid, "");
  if (!gate.platformAdmin) throw new HttpsError("permission-denied", message);
}

export async function assertClubAdmin(uid: string, clubId: string) {
  const gate = await adminGate(uid, clubId);
  if (gate.platformAdmin) return;
  if (gate.clubMember?.role === "ADMIN") return;
  throw new HttpsError(
    "permission-denied",
    "Solo el presidente o un superadmin puede invitar.",
  );
}

export async function platformBrand() {
  const result = await sql().executeQuery<{
    platformSettings?: { name: string; whatsapp?: string | null } | null;
  }>("MailBrand");
  const settings = result.data.platformSettings;
  return {
    name: settings?.name?.trim() || DEFAULT_PLATFORM_NAME,
    whatsapp: settings?.whatsapp?.trim() || "",
  };
}

type MailRecipients = {
  clubMembers_on_club: { email: string }[];
  clubInvites_on_club: { email: string }[];
};

/** Correos de los Presidentes; si nadie aceptó aún, los de sus invitaciones. */
export function presidentEmails(club: MailRecipients) {
  const clean = (rows: { email: string }[]) => [
    ...new Set(
      rows.map((row) => row.email.trim().toLowerCase()).filter((email) => email.includes("@")),
    ),
  ];
  const members = clean(club.clubMembers_on_club);
  return members.length ? members : clean(club.clubInvites_on_club);
}
