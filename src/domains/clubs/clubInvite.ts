import {
  acceptClubInvite,
  clubInviteLookup,
  dataConnect,
  declineClubInvite,
  myMemberships,
  QueryFetchPolicy,
} from "../../infrastructure/dataconnect";
import { invalidateMySpaces } from "../auth/mySpaces";
import type { Role } from "../auth/roles";

export type InviteLink = { clubId: string; emailKey: string; token: string };

export type ClubInviteInfo = {
  clubName: string;
  email: string;
  role: Role;
  slug: string;
};

/** null si el enlace ya no corresponde a una invitación pendiente. */
export async function findClubInvite(link: InviteLink): Promise<ClubInviteInfo | null> {
  const result = await clubInviteLookup(dataConnect, link, {
    fetchPolicy: QueryFetchPolicy.SERVER_ONLY,
  });
  const invite = result.data.clubInvites[0];
  if (!invite) return null;
  return {
    clubName: invite.club.name,
    email: invite.email,
    role: invite.role.toLowerCase() as Role,
    slug: invite.club.slug || invite.club.id,
  };
}

/** Slug del club si el usuario ya es miembro, por ejemplo porque aceptó al entrar. */
export async function memberClubSlug(userId: string, clubId: string) {
  const result = await myMemberships(dataConnect, { userId }, {
    fetchPolicy: QueryFetchPolicy.SERVER_ONLY,
  });
  const club = result.data.clubMembers.find((member) => member.club.id === clubId)?.club;
  return club ? club.slug || club.id : null;
}

const WRONG_SESSION = "La sesión no es del correo invitado.";

/** false si la sesión no es del correo invitado. */
export async function acceptInvite(link: InviteLink, displayName: string) {
  try {
    const result = await acceptClubInvite(dataConnect, { ...link, displayName });
    if (result.data.member == null) return false;
    invalidateMySpaces();
    return true;
  } catch (err) {
    if (err instanceof Error && err.message.includes(WRONG_SESSION)) return false;
    throw err;
  }
}

export async function declineInvite(link: InviteLink) {
  await declineClubInvite(dataConnect, link);
}

export const inviteRespondPath = (
  clubId: string,
  emailKeyValue: string,
  token: string,
) =>
  `/invitar?c=${encodeURIComponent(clubId)}&e=${encodeURIComponent(emailKeyValue)}&t=${encodeURIComponent(token)}`;
