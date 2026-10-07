/**
 * Variables de entorno del frontend (se fijan al compilar; ver .env.example).
 *
 * - VITE_SUPABASE_URL: URL pública del gateway (Kong), p. ej. http://localhost:8000 o https://tu-dominio/api
 * - VITE_SUPABASE_ANON_KEY: clave anon (JWT firmado con JWT_SECRET; la genera npm run docker:env)
 * - VITE_API_URL: API de correo e invitaciones; por defecto ${VITE_SUPABASE_URL}/fn (ruta de Kong)
 */
const read = (key: string) => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return (value ?? "").trim().replace(/\/+$/, "");
};

const supabaseUrl = read("VITE_SUPABASE_URL");
const supabaseAnonKey = read("VITE_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env: la app no podrá conectarse. " +
      "Genera las claves con `npm run docker:env` y copia las líneas VITE_* al .env de la raíz.",
  );
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  apiUrl: read("VITE_API_URL") || `${supabaseUrl}/fn`,
  /** Prefijo de las URL públicas del bucket de imágenes */
  mediaPublicBase: `${supabaseUrl}/storage/v1/object/public/media/`,
} as const;
