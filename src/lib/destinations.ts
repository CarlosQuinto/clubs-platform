import type { User } from "firebase/auth";
import {
  acceptClubInvite,
  myMemberships,
  myOpenClubInvites,
  platformAdminById,
  type MemberRole,
} from "../../dataconnect/generated";
import { dataConnect } from "./sqlConnect";
import { emailKey } from "./paths";
import { ROLE_LABELS, type Role } from "./roles";

export type LoginDestination = {
  kind: "admin" | "club";
  path: string;
  title: string;
  subtitle: string;
  logoUrl?: string;
};

const ROLE_FROM_SQL: Record<MemberRole, Role> = {
  ADMIN: "admin",
  DT: "dt",
  PRENSA: "prensa",
  TESORERO: "tesorero",
};

export async function resolveUserDestinations(user: User): Promise<LoginDestination[]> {
  const dests: LoginDestination[] = [];
  const admin = await platformAdminById(dataConnect, { id: user.uid });
  if (admin.data.platformAdmin) {
    dests.push({
      kind: "admin",
      path: "/admin",
      title: "Panel de administración",
      subtitle: "Clubes, competición y portada",
    });
  }

  const email = (user.email || "").toLowerCase();
  if (email) {
    const invites = await myOpenClubInvites(dataConnect, { emailKey: emailKey(email) });
    for (const invite of invites.data.clubInvites) {
      if (!invite.token) continue;
      await acceptClubInvite(dataConnect, {
        clubId: invite.club.id,
        emailKey: emailKey(email),
        token: invite.token,
        displayName: user.displayName || "",
      }).catch((err: unknown) => {
        console.error("No se pudo aceptar la invitación:", err);
      });
    }
  }

  const memberships = await myMemberships(dataConnect, { userId: user.uid });
  for (const member of memberships.data.clubMembers) {
    const role = ROLE_FROM_SQL[member.role];
    dests.push({
      kind: "club",
      path: `/${member.club.slug || member.club.id}`,
      title: member.club.name,
      subtitle: ROLE_LABELS[role] || "Administración",
      logoUrl: member.club.logoUrl || undefined,
    });
  }

  dests.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "admin" ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
  return dests;
}
