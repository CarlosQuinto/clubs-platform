import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

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
  const result = await fn(input);
  return result.data.mailed === true;
}
