import { platformBrand } from "../db.js";
import { FnError } from "../errors.js";
import {
  courtBookingEmailHtml,
  courtBookingEmailText,
  courtBookingSubject,
  sendGmail,
  type CourtBookingKind,
  type CourtBookingSlot,
} from "../mail.js";
import { EMAIL_RE, type FnHandler } from "./shared.js";

/** Avisa por correo una renta de cancha: alta, cambio o cancelación. */
export const sendCourtBookingNotice: FnHandler = async ({ data }) => {
  const to = String(data.to || "").trim().toLowerCase();
  const kind = String(data.kind || "") as CourtBookingKind;
  const dateLabel = String(data.dateLabel || "").trim();
  const note = String(data.note || "");
  const rawSlots: unknown[] = Array.isArray(data.slots) ? data.slots : [];
  if (!EMAIL_RE.test(to)) {
    throw new FnError("invalid-argument", "El correo no es válido.");
  }
  if (kind !== "created" && kind !== "updated" && kind !== "cancelled") {
    throw new FnError("invalid-argument", "El aviso no es válido.");
  }
  const slots: CourtBookingSlot[] = rawSlots.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const courtName = String(row.courtName || "").trim();
    const startLabel = String(row.startLabel || "").trim();
    const endLabel = String(row.endLabel || "").trim();
    const durationLabel = String(row.durationLabel || "").trim();
    const priceLabel = String(row.priceLabel || "").trim();
    if (!courtName || !startLabel || !endLabel) return [];
    return [{ courtName, startLabel, endLabel, durationLabel, priceLabel }];
  });
  if (!slots.length || !dateLabel) {
    throw new FnError("invalid-argument", "Faltan los datos de la renta.");
  }
  const { name: platformName } = await platformBrand();
  const content = { platformName, kind, dateLabel, note, slots };
  const mailed = await sendGmail({
    to,
    subject: courtBookingSubject(kind, platformName),
    html: courtBookingEmailHtml(content),
    text: courtBookingEmailText(content),
    fromName: platformName,
  });
  return { mailed };
};
