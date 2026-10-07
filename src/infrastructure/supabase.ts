import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const SUPABASE_URL = env.supabaseUrl || "http://localhost:8000";
const SUPABASE_ANON_KEY = env.supabaseAnonKey || "anon";

/**
 * Cliente de la sesión normal (Auth, RPC y Storage).
 *
 * flowType «implicit» y detectSessionInUrl apagado: el enlace de restablecer contraseña trae un
 * `token_hash` que /restablecer verifica con `recoveryClient` al guardar la contraseña nueva, así funciona
 * en cualquier navegador (con PKCE solo valdría en el que lo pidió) y abrirlo no deja al usuario dentro.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Cliente efímero para cambiar la contraseña con el enlace del correo: nada se guarda en el navegador. */
export const recoveryClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: false,
    persistSession: false,
    autoRefreshToken: false,
  },
});
