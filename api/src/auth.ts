import { jwtVerify } from "jose";
import { FnError } from "./errors.js";

export type AuthUser = { uid: string; email: string };

const secret = (process.env.SUPABASE_JWT_SECRET || "").trim();
const key = new TextEncoder().encode(secret);

const unauthenticated = () => new FnError("unauthenticated", "Debes iniciar sesión.");

/**
 * Verifica la sesión de Supabase (JWT HS256 firmado por GoTrue con SUPABASE_JWT_SECRET, audiencia
 * `authenticated`). Equivale al `request.auth` de las callables: sin token o inválido no hay sesión.
 */
export async function verifySession(authorization: string | undefined): Promise<AuthUser> {
  const match = /^Bearer\s+(.+)$/i.exec((authorization || "").trim());
  const token = match?.[1]?.trim();
  if (!token) throw unauthenticated();
  if (!secret) {
    console.error("SUPABASE_JWT_SECRET no está configurado; no se puede verificar la sesión.");
    throw unauthenticated();
  }
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      audience: "authenticated",
    });
    const uid = typeof payload.sub === "string" ? payload.sub.trim() : "";
    if (!uid) throw unauthenticated();
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    return { uid, email };
  } catch (err) {
    if (err instanceof FnError) throw err;
    throw unauthenticated();
  }
}
