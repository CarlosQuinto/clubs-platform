import type { AuthUser } from "../auth.js";
import { hitRequestThrottle } from "../db.js";

/** Contexto que recibe cada endpoint: equivale a `request.auth`, `request.data` y `request.rawRequest.ip`. */
export type FnContext = {
  auth: AuthUser;
  data: Record<string, unknown>;
  ip: string;
};

export type FnHandler = (ctx: FnContext) => Promise<unknown>;

export const APP_URL = (process.env.APP_URL || "http://localhost:8080").replace(/\/+$/, "");
export const ROLES = ["admin", "dt", "prensa", "tesorero"] as const;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/;
export const TOKEN_RE = /^[A-Za-z0-9]{16,64}$/;

export type InviteKind = "signup" | "accept";

export const emailKey = (email: string) => email.trim().toLowerCase().replace(/\./g, ",");

export function inviteUrls(
  clubId: string,
  email: string,
  key: string,
  token: string,
  kind: InviteKind,
  slug: string,
) {
  const accept = `${APP_URL}/invitar?c=${encodeURIComponent(clubId)}&e=${encodeURIComponent(key)}&t=${encodeURIComponent(token)}`;
  if (kind === "signup") {
    const signup = `${APP_URL}/registro?email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/${slug}`)}`;
    return {
      actionUrl: signup,
      declineUrl: undefined as string | undefined,
      copyUrl: signup,
    };
  }
  return {
    actionUrl: accept,
    declineUrl: `${accept}&accion=rechazar`,
    copyUrl: accept,
  };
}

/** Intentos de `id` en la ventana actual, contando este (tabla request_throttles). */
export async function throttleHits(id: string, windowSeconds: number) {
  return hitRequestThrottle(id, windowSeconds);
}
