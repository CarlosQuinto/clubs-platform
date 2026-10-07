import type { AuthError, User as SupabaseUser } from "@supabase/supabase-js";
import { recoveryClient, supabase } from "./supabase";

/** Usuario de la sesión; solo lo que usa la interfaz. */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface UserCredential {
  user: User;
}

const toUser = (u: SupabaseUser | null | undefined): User | null =>
  u
    ? {
        uid: u.id,
        email: u.email ?? null,
        displayName: (u.user_metadata?.display_name as string | undefined) || null,
      }
    : null;

let current: User | null = null;

/**
 * Traduce los errores de GoTrue a los códigos `auth/*` que ya entiende authErrorMessage
 * (src/domains/auth/AuthContext.tsx).
 */
function wrap(error: AuthError): Error & { code: string } {
  const code = error.code || "";
  const message = error.message || "";
  let mapped = "auth/unknown";
  if (code === "invalid_credentials" || code === "user_not_found") mapped = "auth/invalid-credential";
  else if (code === "email_exists" || code === "user_already_exists") mapped = "auth/email-already-in-use";
  else if (code === "weak_password") mapped = "auth/weak-password";
  else if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit")
    mapped = "auth/too-many-requests";
  else if (code === "user_banned") mapped = "auth/user-disabled";
  else if (code === "validation_failed" && /email/i.test(message)) mapped = "auth/invalid-email";
  else if (code === "otp_expired" || code === "bad_code_verifier" || code === "flow_state_expired")
    mapped = "auth/expired-action-code";
  else if (/Database error saving new user/i.test(message) || /invite_required/i.test(message))
    mapped = "auth/operation-not-allowed";
  else if (/Failed to fetch|NetworkError|network/i.test(message)) mapped = "auth/network-request-failed";
  return Object.assign(new Error(message), { code: mapped });
}

/** Avisa con el estado inicial y en cada cambio de sesión (como onAuthStateChanged). */
export function watchSession(listener: (user: User | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    current = toUser(session?.user);
    listener(current);
  });
  return () => data.subscription.unsubscribe();
}

export const currentUser = () => current;

/** Uid de la sesión; falla si no hay nadie dentro. */
export function sessionUserId() {
  const uid = current?.uid;
  if (!uid) throw new Error("Debes iniciar sesión.");
  return uid;
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw wrap(error);
  const user = toUser(data.user);
  if (!user) throw Object.assign(new Error("Sin sesión."), { code: "auth/invalid-credential" });
  current = user;
  return { user };
}

/**
 * Crea la cuenta. El trigger de auth.users exige una invitación (o que la plataforma no tenga
 * administrador) y crea el perfil en public.users con el nombre.
 */
export async function signUp(email: string, password: string, displayName: string): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: displayName.trim() } },
  });
  if (error) throw wrap(error);
  const user = toUser(data.user);
  if (!user) throw Object.assign(new Error("No se pudo crear la cuenta."), { code: "auth/unknown" });
  current = user;
  return user;
}

export async function signOutSession() {
  const { error } = await supabase.auth.signOut();
  if (error) throw wrap(error);
  current = null;
}

/** Pide por correo el enlace para elegir una contraseña nueva (vuelve a /restablecer). */
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/restablecer`,
  });
  if (error) throw wrap(error);
}

const invalidResetLink = () =>
  Object.assign(new Error("El enlace no es válido."), { code: "auth/invalid-action-code" });

/** Lo que trae el enlace del correo: el token_hash actual o los tokens de los enlaces anteriores. */
type ResetLink = { tokenHash: string } | { accessToken: string; refreshToken: string };

// Se guarda en memoria al leer la URL: StrictMode monta /restablecer dos veces y la URL ya está limpia
// en la segunda. Una recarga lo pierde y la página pide un enlace nuevo.
let resetLink: ResetLink | null = null;

/** Saca el enlace de la URL (query o hash) y la deja limpia para que no se reutilice. */
function takeResetLinkFromUrl(): ResetLink | null {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const tokenHash = query.get("token_hash");
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  let found: ResetLink | null = null;
  if (tokenHash && query.get("type") === "recovery") found = { tokenHash };
  else if (accessToken && refreshToken && hash.get("type") === "recovery") found = { accessToken, refreshToken };
  if (found || query.has("token_hash") || hash.has("access_token") || hash.has("error")) {
    window.history.replaceState(null, "", window.location.pathname);
  }
  return found;
}

/**
 * El enlace de restablecer llega como /restablecer?token_hash=…&type=recovery (plantilla
 * api/templates/recovery.html). No se verifica aquí: GoTrue lo gasta al verificarlo, y hacerlo al abrir
 * la página lo dejaba inservible ante un prefetch del navegador, un escáner de correo o una recarga.
 * Se verifica en applyNewPassword, con recoveryClient, que no persiste nada: la app sigue sin sesión.
 * Devuelve el correo de la cuenta cuando se conoce (solo con los enlaces anteriores, que traían la
 * sesión en el hash) o falla si no hay enlace.
 */
export async function checkResetCode(): Promise<{ email: string | null }> {
  const fromUrl = takeResetLinkFromUrl();
  if (fromUrl) resetLink = fromUrl;
  if (!resetLink) {
    // Puede ser una recarga con la sesión efímera de un enlace viejo todavía en memoria
    const { data } = await recoveryClient.auth.getSession();
    if (data.session?.user.email) return { email: data.session.user.email };
    throw invalidResetLink();
  }
  if ("tokenHash" in resetLink) return { email: null };
  const { data, error } = await recoveryClient.auth.setSession({
    access_token: resetLink.accessToken,
    refresh_token: resetLink.refreshToken,
  });
  const email = data.session?.user.email;
  if (error || !email) {
    resetLink = null;
    throw error ? wrap(error) : invalidResetLink();
  }
  return { email };
}

/**
 * Verifica el enlace (un solo uso), guarda la contraseña nueva con esa sesión de recuperación y la
 * descarta: se entra con la contraseña nueva. Falla con auth/expired-action-code si el enlace venció.
 */
export async function applyNewPassword(password: string) {
  if (resetLink && "tokenHash" in resetLink) {
    const { error } = await recoveryClient.auth.verifyOtp({ type: "recovery", token_hash: resetLink.tokenHash });
    if (error) {
      resetLink = null;
      throw wrap(error);
    }
  } else {
    const { data } = await recoveryClient.auth.getSession();
    if (!data.session) throw invalidResetLink();
  }
  const { error } = await recoveryClient.auth.updateUser({ password });
  if (error) throw wrap(error);
  resetLink = null;
  await recoveryClient.auth.signOut({ scope: "local" });
}

/** Token de acceso actual para llamar a la API propia. */
export async function sessionAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
