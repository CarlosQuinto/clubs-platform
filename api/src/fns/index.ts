import type { FnHandler } from "./shared.js";
import { reviewTeamApplication } from "./reviewTeamApplication.js";
import { sendClubInvite } from "./sendClubInvite.js";
import { sendCourtBookingNotice } from "./sendCourtBookingNotice.js";
import { sendMatchScheduleNotice } from "./sendMatchScheduleNotice.js";
import { sendPlatformAdminInvite } from "./sendPlatformAdminInvite.js";
import { sendTournamentEnrollmentNotice } from "./sendTournamentEnrollmentNotice.js";

/** Endpoints POST /fn/<nombre>; todos exigen sesión. Mismos nombres que las callables originales. */
export const functions: Record<string, FnHandler> = {
  sendClubInvite,
  reviewTeamApplication,
  sendPlatformAdminInvite,
  sendCourtBookingNotice,
  sendMatchScheduleNotice,
  sendTournamentEnrollmentNotice,
};
