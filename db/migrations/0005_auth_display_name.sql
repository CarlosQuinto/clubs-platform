-- El nombre con el que se crea la cuenta («Crear cuenta», /registro) sigue la misma regla que el formulario:
-- espacios simples y 40 caracteres como máximo (src/shared/textLimits.ts personName). Antes se recortaba a 160.

CREATE OR REPLACE FUNCTION public.handle_auth_user_after_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(NEW.email, '')));
  v_name text := left(regexp_replace(btrim(coalesce(NEW.raw_user_meta_data ->> 'display_name', '')), '\s+', ' ', 'g'), 40);
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

CREATE OR REPLACE FUNCTION public.handle_auth_user_after_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(NEW.email, '')));
  v_name text := left(regexp_replace(btrim(coalesce(NEW.raw_user_meta_data ->> 'display_name', '')), '\s+', ' ', 'g'), 40);
BEGIN
  UPDATE users SET
    email = v_email,
    display_name = CASE WHEN v_name <> '' THEN v_name ELSE display_name END,
    updated_at = now()
  WHERE id = NEW.id::text;
  RETURN NEW;
END
$$;
