import { env } from "../env";
import { requestPasswordReset as authRequestPasswordReset, sessionAccessToken } from "../auth";

/**
 * Llamadas a la API de correo e invitaciones (api/, antes Cloud Functions).
 * Cada endpoint es POST ${VITE_API_URL}/<nombre> con la sesión en Authorization: Bearer.
 * Los errores llegan como { code, message } y se lanzan con code "functions/<code>",
 * igual que los HttpsError de antes (la interfaz hace err.code.includes("permission-denied"), etc.).
 */
async function callFn<Result>(name: string, body: unknown): Promise<Result> {
  const token = await sessionAccessToken();
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch (err) {
    throw Object.assign(new Error("Sin conexión con el servidor."), {
      code: "functions/unavailable",
      cause: err,
    });
  }
  const json = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
  if (!res.ok) {
    throw Object.assign(new Error(json.message || "Ocurrió un error. Inténtalo de nuevo."), {
      code: `functions/${json.code || "internal"}`,
    });
  }
  return json as Result;
}

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
  return callFn<SendInviteResult>("sendClubInvite", params);
}

export async function sendPlatformAdminInvite(email: string) {
  return callFn<SendInviteResult>("sendPlatformAdminInvite", { email, mailOnly: true });
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
  return callFn<ReviewTeamResult>("reviewTeamApplication", params);
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
  /** «Pagado: $X · Resta: $Y (se paga al llegar)», en el alta y el cambio. */
  paymentLabel?: string;
};

export async function sendCourtBookingNotice(input: CourtBookingNotice) {
  const result = await callFn<{ mailed: boolean }>("sendCourtBookingNotice", input);
  return result.mailed === true;
}

/** Restablecer contraseña: lo envía GoTrue (plantilla api/templates/recovery.html). */
export async function requestPasswordReset(email: string) {
  try {
    await authRequestPasswordReset(email);
  } catch (err) {
    const code = (err as { code?: string }).code || "";
    if (code === "auth/too-many-requests") {
      throw Object.assign(new Error("Demasiados intentos."), { code: "functions/resource-exhausted" });
    }
    if (code === "auth/invalid-email") {
      throw Object.assign(new Error("El correo no es válido."), { code: "functions/invalid-argument" });
    }
    throw Object.assign(new Error("No se pudo enviar el correo."), { code: "functions/unavailable" });
  }
}

/**
 * Correo a los Presidentes de ambos clubes. Si falla, el partido ya quedó guardado. Con `reason` el partido
 * acaba de quedar sin fecha (p. ej. "courts": cambió el horario de canchas) y se avisa que se reprogramará.
 */
export function notifyMatchScheduled(matchId: string, reason?: "courts") {
  void callFn<{ mailed: boolean }>("sendMatchScheduleNotice", reason ? { matchId, reason } : { matchId }).catch(
    (err: unknown) => console.error(err),
  );
}

/** Correo a cada club recién inscrito para que cargue su disponibilidad. */
export function notifyTournamentEnrollment(tournamentId: string, clubIds: string[]) {
  if (!clubIds.length) return;
  void callFn<{ notified: number }>("sendTournamentEnrollmentNotice", { tournamentId, clubIds }).catch(
    (err: unknown) => console.error(err),
  );
}
