-- Sesión y permisos: helpers que usan las funciones RPC, triggers sobre auth.users
-- (invitación obligatoria, perfil en public.users, primer superadmin) y rol de la API de correo.
SET ROLE postgres;

-- ---------- Helpers ----------

-- Uid de la sesión como texto (los ids de usuario de las tablas son varchar)
CREATE OR REPLACE FUNCTION public.current_uid()
RETURNS text
LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
  SELECT auth.uid()::text
$$;

-- Correo de la sesión (del JWT), en minúsculas; '' si no hay sesión
CREATE OR REPLACE FUNCTION public.session_email()
RETURNS text
LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
  SELECT lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
$$;

-- Clave email_key de invitaciones y administradores: minúsculas y «.» -> «,».
-- Debe coincidir con emailKey() de src/shared/paths.ts y con la API.
CREATE OR REPLACE FUNCTION public.email_key(p_email text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT replace(lower(btrim(p_email)), '.', ',')
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()::text)
$$;

-- true si la sesión tiene alguno de los roles indicados en el club (o es superadmin)
CREATE OR REPLACE FUNCTION public.has_club_role(p_club_id text, p_roles text[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()::text)
      OR EXISTS (
        SELECT 1 FROM club_members
        WHERE club_id = p_club_id
          AND user_id = auth.uid()::text
          AND role::text = ANY (p_roles)
      )
$$;

-- Timestamp en ISO 8601 UTC con «Z», como lo devolvía Data Connect
CREATE OR REPLACE FUNCTION public.api_ts(p_ts timestamptz)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT to_char(p_ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
$$;

-- Uid de la sesión; falla con 42501 si no hay nadie dentro (las funciones USER lo usan)
CREATE OR REPLACE FUNCTION public.require_uid()
RETURNS text
LANGUAGE plpgsql STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501', HINT = 'Debes iniciar sesión.';
  END IF;
  RETURN auth.uid()::text;
END
$$;

-- Expone una función RPC (firma (p jsonb)) al navegador: PUBLIC -> anon y authenticated; USER -> solo authenticated.
CREATE OR REPLACE PROCEDURE public.api_expose(p_fn text, p_level text)
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('REVOKE ALL ON FUNCTION public.%I(jsonb) FROM PUBLIC, anon, authenticated', p_fn);
  IF p_level = 'PUBLIC' THEN
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(jsonb) TO anon, authenticated', p_fn);
  ELSIF p_level = 'USER' THEN
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(jsonb) TO authenticated', p_fn);
  ELSE
    RAISE EXCEPTION 'Nivel desconocido: %', p_level;
  END IF;
END
$$;

-- ---------- Triggers sobre auth.users ----------

-- Registro solo con invitación (o primer usuario de la plataforma). GoTrue devuelve
-- «Database error saving new user»; el frontend lo traduce a «necesitas invitación».
CREATE OR REPLACE FUNCTION public.handle_auth_user_before_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(NEW.email, '')));
  v_key text := email_key(v_email);
BEGIN
  IF v_email = '' THEN
    RAISE EXCEPTION 'invite_required' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM platform_admins)
     OR EXISTS (SELECT 1 FROM signup_invites WHERE email_key = v_key)
     OR EXISTS (SELECT 1 FROM club_invites WHERE email_key = v_key)
     OR EXISTS (SELECT 1 FROM platform_admin_invites WHERE email_key = v_key)
  THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invite_required' USING ERRCODE = 'P0001',
    HINT = 'Necesitas una invitación para registrarte.';
END
$$;

-- Perfil en public.users y, si la plataforma no tiene administrador, el primer usuario lo es.
CREATE OR REPLACE FUNCTION public.handle_auth_user_after_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(NEW.email, '')));
  v_name text := left(coalesce(NEW.raw_user_meta_data ->> 'display_name', ''), 160);
BEGIN
  INSERT INTO users (id, email, display_name, updated_at)
  VALUES (NEW.id::text, v_email, v_name, now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = CASE WHEN EXCLUDED.display_name <> '' THEN EXCLUDED.display_name ELSE users.display_name END,
    updated_at = now();

  IF NOT EXISTS (SELECT 1 FROM platform_admins) THEN
    INSERT INTO platform_admins (user_id, email) VALUES (NEW.id::text, v_email);
  END IF;
  RETURN NEW;
END
$$;

-- Mantiene correo y nombre del perfil si cambian en la cuenta
CREATE OR REPLACE FUNCTION public.handle_auth_user_after_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(NEW.email, '')));
  v_name text := left(coalesce(NEW.raw_user_meta_data ->> 'display_name', ''), 160);
BEGIN
  UPDATE users SET
    email = v_email,
    display_name = CASE WHEN v_name <> '' THEN v_name ELSE display_name END,
    updated_at = now()
  WHERE id = NEW.id::text;
  RETURN NEW;
END
$$;

RESET ROLE;

DROP TRIGGER IF EXISTS on_auth_user_before_insert ON auth.users;
CREATE TRIGGER on_auth_user_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_before_insert();

DROP TRIGGER IF EXISTS on_auth_user_after_insert ON auth.users;
CREATE TRIGGER on_auth_user_after_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_after_insert();

DROP TRIGGER IF EXISTS on_auth_user_after_update ON auth.users;
CREATE TRIGGER on_auth_user_after_update
  AFTER UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_after_update();

-- ---------- Rol de la API de correo (api/) ----------
-- Lee y escribe las tablas directamente (sin RLS) y consulta auth.users para saber si un correo ya tiene cuenta.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'api_service') THEN
    CREATE ROLE api_service LOGIN NOINHERIT;
  END IF;
END
$$;
ALTER ROLE api_service WITH PASSWORD :'api_password';
GRANT USAGE ON SCHEMA public, auth, extensions TO api_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO api_service;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO api_service;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO api_service;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO api_service;
GRANT SELECT (id, email, created_at) ON auth.users TO api_service;
