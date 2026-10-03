import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { InviteKind } from "./clubInvite";

export type SendPlatformAdminInviteResult = {
  kind: InviteKind;
  mailed: boolean;
  url: string;
};

export async function sendPlatformAdminInvite(email: string) {
  const fn = httpsCallable<{ email: string; mailOnly: boolean }, SendPlatformAdminInviteResult>(
    functions,
    "sendPlatformAdminInvite",
  );
  const res = await fn({ email, mailOnly: true });
  return res.data;
}
