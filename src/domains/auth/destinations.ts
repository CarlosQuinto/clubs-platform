import type { User } from "../../infrastructure/auth";
import {
  acceptClubInvite,
  dataConnect,
  myOpenClubInvites,
  platformAdminById,
  QueryFetchPolicy,
} from "../../infrastructure/dataconnect";
import { emailKey } from "../../shared/paths";
import {
  ADMIN_SPACE,
  listMyClubSpaces,
  seedMySpaces,
  sortSpaces,
  type Space,
} from "./mySpaces";

export type LoginDestination = Space;

/** Acepta las invitaciones abiertas al correo de la sesión. */
export async function acceptPendingClubInvites(user: User) {
  const email = (user.email || "").toLowerCase();
  if (!email) return;
  const fresh = { fetchPolicy: QueryFetchPolicy.SERVER_ONLY };
  const invites = await myOpenClubInvites(dataConnect, { emailKey: emailKey(email) }, fresh);
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

export async function resolveUserDestinations(user: User): Promise<LoginDestination[]> {
  const dests: LoginDestination[] = [];
  const fresh = { fetchPolicy: QueryFetchPolicy.SERVER_ONLY };
  const admin = await platformAdminById(dataConnect, { id: user.uid }, fresh);
  if (admin.data.platformAdmin) dests.push(ADMIN_SPACE);

  await acceptPendingClubInvites(user);

  const clubs = await listMyClubSpaces();
  // El selector de la cabecera ya pudo consultar antes de aceptar las invitaciones.
  seedMySpaces(user.uid, clubs);
  dests.push(...clubs);
  return sortSpaces(dests);
}
