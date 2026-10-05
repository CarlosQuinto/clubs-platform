import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export type InviteKind = "signup" | "accept";

export type SendInviteResult = {
  kind: InviteKind;
  mailed: boolean;
  url: string;
  held?: boolean;
};

/** Correo de invitación a un club. Con hold, solo resuelve el tipo y no envía. */
export async function sendClubInvite(params: {
  clubId: string;
  email: string;
  role: string;
  token: string;
  hold?: boolean;
}) {
  const fn = httpsCallable<typeof params, SendInviteResult>(functions, "sendClubInvite");
  return (await fn(params)).data;
}

export async function sendPlatformAdminInvite(email: string) {
  const fn = httpsCallable<{ email: string; mailOnly: boolean }, SendInviteResult>(
    functions,
    "sendPlatformAdminInvite",
  );
  return (await fn({ email, mailOnly: true })).data;
}

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
  prepared?: boolean;
  teamName?: string;
  captainName?: string;
  captainEmail?: string;
  slug?: string;
  clubId?: string;
  token?: string;
  emailKey?: string;
}) {
  const fn = httpsCallable<typeof params, ReviewTeamResult>(functions, "reviewTeamApplication");
  return (await fn(params)).data;
}

export type CourtBookingNotice = {
  to: string;
  kind: "created" | "updated" | "cancelled";
  dateLabel: string;
  note: string;
  slots: {
    courtName: string;
    startLabel: string;
    endLabel: string;
    durationLabel: string;
    priceLabel: string;
  }[];
};

export async function sendCourtBookingNotice(input: CourtBookingNotice) {
  const fn = httpsCallable<CourtBookingNotice, { mailed: boolean }>(
    functions,
    "sendCourtBookingNotice",
  );
  return (await fn(input)).data.mailed === true;
}

export async function requestPasswordReset(email: string) {
  const fn = httpsCallable<{ email: string }, { ok: boolean }>(functions, "requestPasswordReset");
  await fn({ email });
}

/** Correo a los Presidentes de ambos clubes. Si falla, el partido ya quedó guardado. */
export function notifyMatchScheduled(matchId: string) {
  const fn = httpsCallable<{ matchId: string }, { mailed: boolean }>(
    functions,
    "sendMatchScheduleNotice",
  );
  void fn({ matchId }).catch((err: unknown) => console.error(err));
}

/** Correo a cada club recién inscrito para que cargue su disponibilidad. */
export function notifyTournamentEnrollment(tournamentId: string, clubIds: string[]) {
  if (!clubIds.length) return;
  const fn = httpsCallable<{ tournamentId: string; clubIds: string[] }, { notified: number }>(
    functions,
    "sendTournamentEnrollmentNotice",
  );
  void fn({ tournamentId, clubIds }).catch((err: unknown) => console.error(err));
}
