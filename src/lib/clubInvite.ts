import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { Role } from "./roles";

export type InviteKind = "signup" | "accept";

export type SendClubInviteResult = {
  kind: InviteKind;
  mailed: boolean;
  url: string;
};

export async function sendClubInvite(params: {
  clubId: string;
  email: string;
  role: Role;
  mailOnly?: boolean;
  token?: string;
  slug?: string;
  clubName?: string;
}) {
  const fn = httpsCallable<typeof params, SendClubInviteResult>(
    functions,
    "sendClubInvite",
  );
  const res = await fn(params);
  return res.data;
}

export async function getClubInvite(params: {
  clubId: string;
  emailKey: string;
  token: string;
}) {
  const fn = httpsCallable<
    typeof params,
    {
      clubId: string;
      slug: string;
      clubName: string;
      email: string;
      role: string;
      kind: InviteKind;
    }
  >(functions, "getClubInvite");
  const res = await fn(params);
  return res.data;
}

export async function respondClubInvite(params: {
  clubId: string;
  emailKey: string;
  token: string;
  action: "accept" | "decline";
}) {
  const fn = httpsCallable<
    typeof params,
    { ok: boolean; action: string; clubId?: string; slug?: string }
  >(functions, "respondClubInvite");
  const res = await fn(params);
  return res.data;
}

export const inviteRespondPath = (
  clubId: string,
  emailKeyValue: string,
  token: string,
) =>
  `/invitar?c=${encodeURIComponent(clubId)}&e=${encodeURIComponent(emailKeyValue)}&t=${encodeURIComponent(token)}`;
