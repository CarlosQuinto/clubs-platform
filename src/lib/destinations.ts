import type { User } from "firebase/auth";
import {
  deleteDoc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { clubItemRef, emailKey, platformConfigRef } from "./paths";
import { ROLE_LABELS, type Role } from "./roles";
import type { ClubSummary } from "./types";

export type LoginDestination = {
  kind: "admin" | "club";
  path: string;
  title: string;
  subtitle: string;
  logoUrl?: string;
};

export async function resolveUserDestinations(
  user: User,
  clubs: ClubSummary[],
): Promise<LoginDestination[]> {
  const dests: LoginDestination[] = [];
  const config = await getDoc(platformConfigRef());
  const superAdmins = (config.data()?.superAdmins || []) as string[];
  if (superAdmins.includes(user.uid)) {
    dests.push({
      kind: "admin",
      path: "/admin",
      title: "Panel de administración",
      subtitle: "Clubes, competición y portada",
    });
  }

  const email = (user.email || "").toLowerCase();
  const memberships = await Promise.all(
    clubs.map(async (club) => {
      const memberRef = clubItemRef(club.id, "members", user.uid);
      const member = await getDoc(memberRef);
      let role = member.exists() ? (member.data().role as Role) : null;

      if (!role && email) {
        const inviteRef = clubItemRef(club.id, "invites", emailKey(email));
        const invite = await getDoc(inviteRef);
        if (invite.exists() && invite.data().kind !== "accept") {
          role = invite.data().role as Role;
          try {
            await setDoc(memberRef, {
              role,
              email,
              displayName: user.displayName || "",
              joinedAt: serverTimestamp(),
            });
            await deleteDoc(inviteRef).catch(() => {});
          } catch (err) {
            console.error("No se pudo reclamar la invitación:", err);
          }
        }
      }

      if (!role) return null;
      return { club, role };
    }),
  );

  for (const item of memberships) {
    if (!item) continue;
    dests.push({
      kind: "club",
      path: `/${item.club.slug || item.club.id}`,
      title: item.club.name,
      subtitle: ROLE_LABELS[item.role] || "Administración",
      logoUrl: item.club.logoUrl,
    });
  }

  dests.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "admin" ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
  return dests;
}
