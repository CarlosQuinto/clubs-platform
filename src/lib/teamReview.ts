import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type { InviteKind } from "./clubInvite";

export type ReviewTeamResult = {
  ok: boolean;
  action: "approve" | "reject";
  mailed: boolean;
  clubId?: string;
  slug?: string;
  kind?: InviteKind;
  url?: string;
};

export async function reviewTeamApplication(params: {
  applicationId: string;
  action: "approve" | "reject";
  localityId?: string;
}) {
  const fn = httpsCallable<typeof params, ReviewTeamResult>(
    functions,
    "reviewTeamApplication",
  );
  const res = await fn(params);
  return res.data;
}
