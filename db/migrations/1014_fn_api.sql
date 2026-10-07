-- Funciones para la API de correo (api/), que entra con el rol api_service. No son RPC del navegador:
-- no pasan por api_expose y solo api_service puede ejecutarlas.
SET ROLE postgres;

-- GoTrue activa RLS en auth.users sin políticas: api_service lee 0 filas aunque tenga SELECT.
-- SECURITY DEFINER (dueño postgres, BYPASSRLS) responde si el correo ya tiene cuenta, y nada más.
CREATE OR REPLACE FUNCTION public.api_user_exists(p_email text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(btrim(coalesce(p_email, ''))))
$$;
REVOKE ALL ON FUNCTION public.api_user_exists(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.api_user_exists(text) TO api_service;

RESET ROLE;
