-- Funciones RPC del panel /admin (antes dataconnect/connector/admin.gql).
--
-- Convenciones (ver 1010_fn_public.sql y CLAUDE.md):
-- - Una función por operación, nombre_en_snake(p jsonb) RETURNS jsonb, SECURITY DEFINER.
-- - Lecturas: solo el superadmin (require_platform_admin()); AdminClubPeople también el presidente del club.
-- - Mutaciones: una clave por paso del .gql; NULL = permiso denegado o validación fallida (savedRow()).
--   El userId que mandaba el cliente se ignora siempre: la sesión es auth.uid().
--   Con variables vacías ninguna mutación debe fallar: solo devuelve NULL.
-- - Las validaciones de texto son idénticas a src/shared/textLimits.ts.
SET ROLE postgres;

-- Falla si la sesión no es superadmin. 42501 es lo que el cliente y scripts/db/check.mjs tratan como
-- error de permiso (P0001 se reserva a los mensajes de negocio).
CREATE OR REPLACE FUNCTION public.require_platform_admin()
RETURNS void LANGUAGE plpgsql STABLE SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM require_uid();
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;
END
$$;

-- ---------- Lecturas ----------

CREATE OR REPLACE FUNCTION public.admin_clubs(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM require_platform_admin();
  RETURN jsonb_build_object(
    'localities', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name) ORDER BY l.name, l.id), '[]'::jsonb)
      FROM localities l),
    'clubs', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'slug', c.slug, 'name', c.name, 'location', c.location, 'presidentPhone', c.president_phone,
        'active', c.active, 'disabledReason', c.disabled_reason,
        'locality', (SELECT jsonb_build_object('id', l.id, 'name', l.name) FROM localities l WHERE l.id = c.locality_id))
        ORDER BY c.name, c.id), '[]'::jsonb)
      FROM clubs c WHERE c.deleted_at IS NULL));
END
$$;
CALL api_expose('admin_clubs', 'USER');

-- Busca por nombre sin acentos; devuelve filas planas (localityId en vez de relación)
CREATE OR REPLACE FUNCTION public.search_admin_clubs(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_term text := btrim(coalesce(p ->> 'term', ''));
BEGIN
  PERFORM require_platform_admin();
  RETURN jsonb_build_object('clubs', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'slug', c.slug, 'name', c.name, 'active', c.active,
      'disabledReason', c.disabled_reason, 'localityId', c.locality_id) ORDER BY c.name, c.id), '[]'::jsonb)
    FROM clubs c
    WHERE c.deleted_at IS NULL
      AND char_length(v_term) BETWEEN 3 AND 30
      AND v_term ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ]+)( [A-Za-z0-9À-ÖØ-öø-ÿ]+)*$'
      AND translate(lower(c.name), 'áàäâéèëêíìïîóòöôúùüûñÿ', 'aaaaeeeeiiiioooouuuuny')
        LIKE '%' || translate(lower(v_term), 'áàäâéèëêíìïîóòöôúùüûñÿ', 'aaaaeeeeiiiioooouuuuny') || '%'));
END
$$;
CALL api_expose('search_admin_clubs', 'USER');

-- Miembros e invitaciones de un club: superadmin o presidente de ese club (lo usa MembersModal)
CREATE OR REPLACE FUNCTION public.admin_club_people(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_club text := p ->> 'clubId';
BEGIN
  PERFORM require_uid();
  IF NOT has_club_role(v_club, ARRAY['ADMIN']) THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'clubMembers', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('email', m.email, 'displayName', m.display_name,
        'role', to_jsonb(m.role), 'user', jsonb_build_object('id', m.user_id)) ORDER BY m.display_name, m.email), '[]'::jsonb)
      FROM club_members m WHERE m.club_id = v_club),
    'clubInvites', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('emailKey', i.email_key, 'email', i.email, 'role', to_jsonb(i.role),
        'token', i.token, 'kind', to_jsonb(i.kind)) ORDER BY i.email), '[]'::jsonb)
      FROM club_invites i WHERE i.club_id = v_club));
END
$$;
CALL api_expose('admin_club_people', 'USER');

CREATE OR REPLACE FUNCTION public.admin_competition(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM require_platform_admin();
  RETURN jsonb_build_object(
    'seasons', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'startDate', to_jsonb(s.start_date),
        'endDate', to_jsonb(s.end_date), 'active', s.active) ORDER BY s.start_date DESC NULLS LAST, s.id), '[]'::jsonb)
      FROM seasons s),
    'categories', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'sortOrder', c.sort_order)
        ORDER BY c.sort_order, c.id), '[]'::jsonb)
      FROM categories c),
    'tournaments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'status', to_jsonb(t.status), 'season', jsonb_build_object('id', t.season_id)) ORDER BY t.id), '[]'::jsonb)
      FROM tournaments t));
END
$$;
CALL api_expose('admin_competition', 'USER');

CREATE OR REPLACE FUNCTION public.admin_cover(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM require_platform_admin();
  RETURN jsonb_build_object(
    'platformSettings', (
      SELECT jsonb_build_object('name', s.name, 'motto', s.motto, 'headline', s.headline, 'tagline', s.tagline,
        'logoUrl', s.logo_url, 'instagram', s.instagram, 'facebook', s.facebook, 'x', s.x, 'youtube', s.youtube,
        'whatsapp', s.whatsapp)
      FROM platform_settings s WHERE s.id = 'config'),
    'platformHeroImages', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', h.id, 'position', h.position, 'url', h.url) ORDER BY h.position), '[]'::jsonb)
      FROM platform_hero_images h));
END
$$;
CALL api_expose('admin_cover', 'USER');

CREATE OR REPLACE FUNCTION public.admin_ads(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM require_platform_admin();
  RETURN jsonb_build_object('ads', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'brand', a.brand, 'imageUrl', a.image_url, 'href', a.href, 'startsOn', to_jsonb(a.starts_on),
      'endsOn', to_jsonb(a.ends_on), 'status', to_jsonb(a.status), 'sortOrder', a.sort_order,
      'adPlacements_on_ad', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('placement', to_jsonb(ap.placement)) ORDER BY ap.placement), '[]'::jsonb)
        FROM ad_placements ap WHERE ap.ad_id = a.id))
      ORDER BY a.sort_order, a.brand, a.id), '[]'::jsonb)
    FROM ads a));
END
$$;
CALL api_expose('admin_ads', 'USER');

CREATE OR REPLACE FUNCTION public.admin_inbox(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM require_platform_admin();
  RETURN jsonb_build_object(
    'localities', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name) ORDER BY l.name, l.id), '[]'::jsonb)
      FROM localities l),
    'inquiries', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'email', i.email, 'phone', i.phone,
        'topic', i.topic, 'message', i.message, 'status', to_jsonb(i.status), 'createdAt', api_ts(i.created_at))
        ORDER BY i.created_at DESC, i.id), '[]'::jsonb)
      FROM inquiries i),
    'teamApplications', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'captainName', a.captain_name, 'captainEmail', a.captain_email,
        'captainPhone', a.captain_phone, 'teamName', a.team_name, 'status', to_jsonb(a.status), 'slug', a.slug,
        'createdAt', api_ts(a.created_at),
        'club', CASE WHEN a.club_id IS NULL THEN NULL ELSE jsonb_build_object('id', a.club_id) END)
        ORDER BY a.created_at DESC, a.id), '[]'::jsonb)
      FROM team_applications a));
END
$$;
CALL api_expose('admin_inbox', 'USER');

-- El parámetro «from» del original está retirado: se devuelven todos los apartados
CREATE OR REPLACE FUNCTION public.admin_courts(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM require_platform_admin();
  RETURN jsonb_build_object(
    'platformSettings', (
      SELECT jsonb_build_object('courtsEnabled', s.courts_enabled, 'courtSlotMinutes', s.court_slot_minutes)
      FROM platform_settings s WHERE s.id = 'config'),
    'courtOpenWindows', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', w.id, 'weekday', w.weekday, 'startTime', w.start_time,
        'endTime', w.end_time) ORDER BY w.weekday, w.start_time, w.id), '[]'::jsonb)
      FROM court_open_windows w),
    'courts', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'description', c.description,
        'location', c.location, 'hourlyRate', c.hourly_rate, 'active', c.active, 'sortOrder', c.sort_order,
        'imageUrl', c.image_url, 'football', c.football) ORDER BY c.sort_order, c.name, c.id), '[]'::jsonb)
      FROM courts c),
    'courtHolds', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', h.id, 'holdDate', to_jsonb(h.hold_date), 'startTime', h.start_time,
        'endTime', h.end_time, 'source', to_jsonb(h.source), 'note', h.note, 'guestEmail', h.guest_email,
        'court', jsonb_build_object('id', h.court_id),
        'match', (SELECT jsonb_build_object('id', m.id,
            'homeClub', (SELECT jsonb_build_object('name', c.name) FROM clubs c WHERE c.id = m.home_club_id),
            'awayClub', (SELECT jsonb_build_object('name', c.name) FROM clubs c WHERE c.id = m.away_club_id),
            'tournament', (SELECT jsonb_build_object('durationMinutes', t.duration_minutes,
              'startDate', to_jsonb(coalesce(t.start_date, s.start_date)))
              FROM tournaments t JOIN seasons s ON s.id = t.season_id WHERE t.id = m.tournament_id))
          FROM matches m WHERE m.id = h.match_id))
        ORDER BY h.hold_date, h.start_time, h.id), '[]'::jsonb)
      FROM court_holds h));
END
$$;
CALL api_expose('admin_courts', 'USER');

-- ---------- Localidades y clubes ----------

CREATE OR REPLACE FUNCTION public.create_locality(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_name text := btrim(regexp_replace(coalesce(p ->> 'name', ''), ' {2,}', ' ', 'g'));
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('locality', NULL); END IF;
  INSERT INTO localities (id, name, created_at)
  SELECT p ->> 'id', initcap(v_name), now()
  WHERE p ->> 'id' IS NOT NULL
    AND char_length(v_name) BETWEEN 3 AND 50
    AND v_name ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ,]+)( [A-Za-z0-9À-ÖØ-öø-ÿ,]+)*$'
    AND NOT EXISTS (SELECT 1 FROM localities WHERE lower(name) = lower(v_name))
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('locality', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('create_locality', 'USER');

CREATE OR REPLACE FUNCTION public.create_club(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_slug text := p ->> 'slug';
  v_name text := btrim(coalesce(p ->> 'name', ''));
  v_location text := btrim(coalesce(p ->> 'location', ''));
  v_phone text := btrim(coalesce(p ->> 'presidentPhone', ''));
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('club', NULL); END IF;
  INSERT INTO clubs (id, slug, name, description, locality_id, location, president_phone, created_by_id, created_at)
  -- left(): el WHERE ya limita el largo; evita que el plan falle con 22001 antes de evaluarlo
  SELECT p ->> 'id', left(v_slug, 40), initcap(v_name), coalesce(p ->> 'description', ''), p ->> 'localityId', v_location, v_phone, v_uid, now()
  WHERE p ->> 'id' IS NOT NULL
    AND char_length(v_name) BETWEEN 3 AND 30
    AND v_name ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.-]+)*$'
    AND char_length(v_slug) BETWEEN 3 AND 40
    AND v_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    -- Rutas reservadas de la SPA
    AND v_slug NOT IN (
      'admin', 'login', 'registro', 'invitar', 'registrar-equipo', 'contacto',
      'solicitudes', 'clubes', 'equipos', 'torneos', 'temporadas', 'categorias',
      'canchas', 'api', 'partido', 'partidos'
    )
    AND NOT EXISTS (SELECT 1 FROM clubs WHERE slug = v_slug)
    AND EXISTS (SELECT 1 FROM localities WHERE id = p ->> 'localityId')
    AND (
      v_location = ''
      OR (
        char_length(v_location) BETWEEN 3 AND 50
        AND v_location ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ,.]+)( [A-Za-z0-9À-ÖØ-öø-ÿ,.]+)*$'
      )
    )
    AND (v_phone = '' OR v_phone ~ '^\+?[0-9]{10,15}$')
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('club', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('create_club', 'USER');

CREATE OR REPLACE FUNCTION public.insert_club_hero(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('hero', NULL); END IF;
  INSERT INTO club_hero_images (id, club_id, position, url)
  SELECT (p ->> 'id')::uuid, p ->> 'clubId', 0, p ->> 'url'
  WHERE p ->> 'id' IS NOT NULL AND p ->> 'url' IS NOT NULL
    AND EXISTS (SELECT 1 FROM clubs WHERE id = p ->> 'clubId')
  ON CONFLICT (club_id, position) DO UPDATE SET url = EXCLUDED.url
  RETURNING club_id INTO v_club;
  RETURN jsonb_build_object('hero', CASE WHEN v_club IS NULL THEN NULL ELSE jsonb_build_object('id', v_club) END);
END
$$;
CALL api_expose('insert_club_hero', 'USER');

-- Desactivar exige un motivo (se muestra en la página del club); activar lo borra
CREATE OR REPLACE FUNCTION public.set_club_active(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_active boolean := (p ->> 'active')::boolean;
  v_reason text := btrim(coalesce(p ->> 'reason', ''));
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('club', NULL); END IF;
  UPDATE clubs
  SET active = v_active,
      disabled_reason = CASE WHEN v_active THEN NULL ELSE v_reason END
  WHERE id = p ->> 'id' AND deleted_at IS NULL
    AND (
      v_active
      OR (
        char_length(v_reason) BETWEEN 5 AND 100
        AND v_reason ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.,:;¡!¿?()''"-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.,:;¡!¿?()''"-]+)*$'
      )
    )
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('club', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('set_club_active', 'USER');

-- Borrado lógico: jugadores, partidos y finanzas se conservan para el historial de la liga.
-- Los miembros se quedan (sin acceso, el club ya no se lista) por si se restaura por SQL.
CREATE OR REPLACE FUNCTION public.delete_club(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club_id text := p ->> 'id';
  v_invite text;
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('invites', NULL, 'signups', NULL, 'club', NULL);
  END IF;
  WITH d AS (DELETE FROM club_invites WHERE club_id = v_club_id RETURNING email_key)
  SELECT min(email_key) INTO v_invite FROM d;
  DELETE FROM signup_invites WHERE club_id = v_club_id;
  UPDATE clubs SET active = false, deleted_at = now()
  WHERE id = v_club_id AND deleted_at IS NULL
  RETURNING id INTO v_id;
  RETURN jsonb_build_object(
    'invites', CASE WHEN v_invite IS NULL THEN NULL ELSE jsonb_build_object('id', v_invite) END,
    'signups', NULL,
    'club', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('delete_club', 'USER');

-- ---------- Invitaciones y miembros de club (superadmin o presidente del club) ----------

CREATE OR REPLACE FUNCTION public.save_club_invite(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_key text := p ->> 'emailKey';
  v_email text := btrim(coalesce(p ->> 'email', ''));
  v_role text := p ->> 'role';
  v_token text := p ->> 'token';
  v_kind text := p ->> 'kind';
  v_id text;
BEGIN
  IF NOT has_club_role(v_club, ARRAY['ADMIN']) THEN RETURN jsonb_build_object('invite', NULL); END IF;
  INSERT INTO club_invites (club_id, email_key, email, role, token, kind, invited_by_id, created_at)
  SELECT v_club, v_key, lower(v_email),
    CASE v_role
      WHEN 'ADMIN' THEN 'ADMIN'::member_role
      WHEN 'DT' THEN 'DT'::member_role
      WHEN 'PRENSA' THEN 'PRENSA'::member_role
      WHEN 'TESORERO' THEN 'TESORERO'::member_role
    END,
    v_token,
    CASE v_kind
      WHEN 'SIGNUP' THEN 'SIGNUP'::invite_kind
      WHEN 'ACCEPT' THEN 'ACCEPT'::invite_kind
    END,
    v_uid, now()
  WHERE char_length(v_email) BETWEEN 6 AND 100
    AND v_email = lower(v_email)
    AND v_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[a-z]{2,}$'
    AND v_key = email_key(v_email)
    AND v_role IN ('ADMIN', 'DT', 'PRENSA', 'TESORERO')
    AND v_token ~ '^[A-Za-z0-9]{16,64}$'
    AND v_kind IN ('SIGNUP', 'ACCEPT')
    AND NOT EXISTS (SELECT 1 FROM club_members WHERE club_id = v_club AND lower(email) = lower(v_email))
    AND NOT EXISTS (SELECT 1 FROM club_invites WHERE club_id = v_club AND (email_key = v_key OR lower(email) = lower(v_email)))
    -- Como mucho 20 invitaciones por club y hora
    AND (SELECT count(*) FROM club_invites WHERE club_id = v_club AND created_at > now() - INTERVAL '1 hour') < 20
  RETURNING email_key INTO v_id;
  RETURN jsonb_build_object('invite', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('save_club_invite', 'USER');

CREATE OR REPLACE FUNCTION public.remove_club_invite(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_id text;
BEGIN
  IF NOT has_club_role(v_club, ARRAY['ADMIN']) THEN RETURN jsonb_build_object('invite', NULL); END IF;
  DELETE FROM club_invites WHERE club_id = v_club AND email_key = p ->> 'emailKey'
  RETURNING email_key INTO v_id;
  RETURN jsonb_build_object('invite', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('remove_club_invite', 'USER');

-- Superadmin: cualquier correo (también de plataforma). Presidente: solo si ya existe la invitación de su club.
CREATE OR REPLACE FUNCTION public.save_signup_invite(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_key text := p ->> 'emailKey';
  v_email text := p ->> 'email';
  v_club text := p ->> 'clubId';
  v_platform boolean := (p ->> 'platform')::boolean;
  v_id text;
BEGIN
  INSERT INTO signup_invites (email_key, email, club_id, platform, updated_at)
  SELECT v_key, v_email, v_club, v_platform, now()
  WHERE v_key IS NOT NULL AND v_email IS NOT NULL AND v_platform IS NOT NULL
    AND (
      is_platform_admin()
      OR (
        NOT v_platform
        AND EXISTS (SELECT 1 FROM club_invites WHERE club_id = v_club AND email_key = v_key)
        AND has_club_role(v_club, ARRAY['ADMIN'])
      )
    )
  ON CONFLICT (email_key) DO UPDATE SET
    email = EXCLUDED.email,
    club_id = COALESCE(EXCLUDED.club_id, signup_invites.club_id),
    platform = EXCLUDED.platform OR signup_invites.platform,
    updated_at = now()
  RETURNING email_key INTO v_id;
  RETURN jsonb_build_object('invite', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('save_signup_invite', 'USER');

CREATE OR REPLACE FUNCTION public.clear_signup_invite(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text;
BEGIN
  DELETE FROM signup_invites s
  WHERE s.email_key = p ->> 'emailKey'
    AND (is_platform_admin() OR (s.club_id IS NOT NULL AND has_club_role(s.club_id, ARRAY['ADMIN'])))
  RETURNING email_key INTO v_id;
  RETURN jsonb_build_object('invite', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('clear_signup_invite', 'USER');

-- Aquí userId es el miembro objetivo, no la sesión
CREATE OR REPLACE FUNCTION public.set_club_member_role(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_role text := p ->> 'role';
  v_id text;
BEGIN
  IF NOT has_club_role(v_club, ARRAY['ADMIN']) THEN RETURN jsonb_build_object('member', NULL); END IF;
  UPDATE club_members SET role = CASE v_role
    WHEN 'ADMIN' THEN 'ADMIN'::member_role
    WHEN 'DT' THEN 'DT'::member_role
    WHEN 'PRENSA' THEN 'PRENSA'::member_role
    WHEN 'TESORERO' THEN 'TESORERO'::member_role
  END
  WHERE club_id = v_club AND user_id = p ->> 'userId'
    AND v_role IN ('ADMIN', 'DT', 'PRENSA', 'TESORERO')
  RETURNING user_id INTO v_id;
  RETURN jsonb_build_object('member', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('set_club_member_role', 'USER');

-- Aquí userId es el miembro objetivo, no la sesión
CREATE OR REPLACE FUNCTION public.remove_club_member(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_id text;
BEGIN
  IF NOT has_club_role(v_club, ARRAY['ADMIN']) THEN RETURN jsonb_build_object('member', NULL); END IF;
  DELETE FROM club_members WHERE club_id = v_club AND user_id = p ->> 'userId'
  RETURNING user_id INTO v_id;
  RETURN jsonb_build_object('member', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('remove_club_member', 'USER');

-- ---------- Competición ----------

CREATE OR REPLACE FUNCTION public.create_season(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_name text := p ->> 'name';
  v_start date := (p ->> 'startDate')::date;
  v_end date := (p ->> 'endDate')::date;
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('season', NULL); END IF;
  INSERT INTO seasons (id, name, start_date, end_date, active)
  SELECT p ->> 'id', v_name, v_start, v_end, (p ->> 'active')::boolean
  WHERE p ->> 'id' IS NOT NULL
    AND p ->> 'active' IS NOT NULL
    AND char_length(v_name) BETWEEN 4 AND 11
    AND v_name ~ '^[0-9]+(-[0-9]+)*$'
    AND v_start IS NOT NULL
    AND v_end IS NOT NULL
    AND v_end > v_start
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('season', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('create_season', 'USER');

-- Cierra una temporada; una temporada cerrada no se reabre (active = true devuelve null).
-- Sus torneos tienen que estar finalizados; si no, devuelve null con «openTournaments». Con force = true
-- los cierra primero (close_tournament_row: podio, partidos pendientes desprogramados y canchas liberadas).
CREATE OR REPLACE FUNCTION public.set_season_active(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_season text := p ->> 'id';
  v_active boolean := (p ->> 'active')::boolean;
  v_force boolean := coalesce((p ->> 'force')::boolean, false);
  v_open int;
  v_closed int := 0;
  v_tournament text;
  v_id text;
BEGIN
  IF NOT is_platform_admin() OR v_active IS DISTINCT FROM false THEN
    RETURN jsonb_build_object('season', NULL, 'openTournaments', NULL, 'closedTournaments', NULL);
  END IF;
  SELECT count(*) INTO v_open FROM tournaments WHERE season_id = v_season AND status <> 'FINISHED';
  IF v_open > 0 AND NOT v_force THEN
    RETURN jsonb_build_object('season', NULL, 'openTournaments', v_open, 'closedTournaments', 0);
  END IF;
  IF v_open > 0 THEN
    FOR v_tournament IN SELECT id FROM tournaments WHERE season_id = v_season AND status <> 'FINISHED' ORDER BY id LOOP
      PERFORM close_tournament_row(v_tournament);
      v_closed := v_closed + 1;
    END LOOP;
  END IF;
  UPDATE seasons SET active = false WHERE id = v_season AND active
  RETURNING id INTO v_id;
  RETURN jsonb_build_object(
    'season', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END,
    'openTournaments', v_open, 'closedTournaments', v_closed);
END
$$;
CALL api_expose('set_season_active', 'USER');

-- Solo se borra una temporada sin torneos
CREATE OR REPLACE FUNCTION public.delete_season(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('season', NULL); END IF;
  DELETE FROM seasons
  WHERE id = p ->> 'id'
    AND NOT EXISTS (SELECT 1 FROM tournaments WHERE season_id = p ->> 'id')
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('season', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('delete_season', 'USER');

CREATE OR REPLACE FUNCTION public.create_category(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_raw text := coalesce(p ->> 'name', '');
  v_name text := btrim(regexp_replace(v_raw, ' {2,}', ' ', 'g'));
  v_order int := (p ->> 'sortOrder')::int;
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('category', NULL); END IF;
  INSERT INTO categories (id, name, sort_order)
  SELECT p ->> 'id', initcap(v_name), v_order
  WHERE p ->> 'id' IS NOT NULL
    AND char_length(btrim(v_raw)) BETWEEN 3 AND 40
    AND btrim(v_raw) ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ]+)( [A-Za-z0-9À-ÖØ-öø-ÿ]+)*$'
    AND v_order >= 0
    AND v_order <= 1000
    AND NOT EXISTS (SELECT 1 FROM categories WHERE lower(name) = lower(v_name))
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('category', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('create_category', 'USER');

-- Grupo (etiqueta), torneo y premio en una sola transacción.
-- Misma regla del premio que isTournamentPrize() en src/shared/textLimits.ts.
CREATE OR REPLACE FUNCTION public.create_tournament(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_name text := btrim(coalesce(p ->> 'name', ''));
  v_season text := p ->> 'seasonId';
  v_category text := p ->> 'categoryId';
  v_group text := p ->> 'groupId';
  v_football text := p ->> 'footballType';
  v_minutes int := (p ->> 'durationMinutes')::int;
  v_start date := (p ->> 'startDate')::date;
  v_prize text := btrim(coalesce(p ->> 'prize', ''));
  v_prize_ok boolean;
  v_grouped text;
  v_tournament text;
  v_prized text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('grouped', NULL, 'tournament', NULL, 'prized', NULL);
  END IF;
  v_prize_ok := v_prize = ''
    OR (char_length(v_prize) <= 60 AND v_prize ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.,+$/()-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.,+$/()-]+)*$');

  INSERT INTO tournament_groups (id, label)
  SELECT v_group, v_name
  WHERE v_group IS NOT NULL
    AND char_length(v_name) BETWEEN 3 AND 50
    AND v_name ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ]+)( [A-Za-z0-9À-ÖØ-öø-ÿ]+)*$'
    AND v_prize_ok
  ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label
  RETURNING id INTO v_grouped;
  IF v_grouped IS NULL THEN
    RETURN jsonb_build_object('grouped', NULL, 'tournament', NULL, 'prized', NULL);
  END IF;

  INSERT INTO tournaments (
    id, name, season_id, category_id, group_id, status,
    legs, football_type, duration_minutes, start_date, created_at
  )
  SELECT
    v_id, v_name, v_season, v_category, v_group, 'UPCOMING'::tournament_status,
    2,
    CASE v_football
      WHEN 'FUT_7' THEN 'FUT_7'::football_type
      WHEN 'FUT_9' THEN 'FUT_9'::football_type
      WHEN 'FUT_11' THEN 'FUT_11'::football_type
    END,
    v_minutes, v_start, now()
  WHERE v_id IS NOT NULL
    AND v_football IN ('FUT_7', 'FUT_9', 'FUT_11')
    AND v_minutes IN (30, 60, 90, 120)
    AND v_start IS NOT NULL
    AND EXISTS (SELECT 1 FROM categories WHERE id = v_category)
    AND EXISTS (
      SELECT 1 FROM seasons s
      WHERE s.id = v_season
        AND (s.start_date IS NULL OR v_start >= s.start_date)
        AND (s.end_date IS NULL OR v_start <= s.end_date)
    )
  RETURNING id INTO v_tournament;
  IF v_tournament IS NULL THEN
    -- Sin torneo el grupo recién creado sobra; se deja limpio
    DELETE FROM tournament_groups g WHERE g.id = v_group AND NOT EXISTS (SELECT 1 FROM tournaments WHERE group_id = g.id);
    RETURN jsonb_build_object('grouped', NULL, 'tournament', NULL, 'prized', NULL);
  END IF;

  UPDATE tournaments SET prize = v_prize WHERE id = v_id AND v_prize_ok
  RETURNING id INTO v_prized;
  RETURN jsonb_build_object(
    'grouped', jsonb_build_object('id', v_grouped),
    'tournament', jsonb_build_object('id', v_tournament),
    'prized', CASE WHEN v_prized IS NULL THEN NULL ELSE jsonb_build_object('id', v_prized) END);
END
$$;
CALL api_expose('create_tournament', 'USER');

-- ---------- Portada y redes ----------
-- Textos y enlaces públicos: los mismos límites que el formulario, y nunca < > que armen HTML.

CREATE OR REPLACE FUNCTION public.save_platform_header(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_name text := btrim(coalesce(p ->> 'name', ''));
  v_motto text := btrim(coalesce(p ->> 'motto', ''));
  v_logo text := coalesce(p ->> 'logoUrl', '');
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('settings', NULL); END IF;
  INSERT INTO platform_settings (id, name, motto, headline, tagline, logo_url, courts_enabled, court_slot_minutes, created_at, updated_at)
  SELECT 'config', v_name, v_motto, '', '', btrim(v_logo), false, 60, now(), now()
  WHERE char_length(v_name) BETWEEN 2 AND 30
    AND v_name ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ]+)( [A-Za-z0-9À-ÖØ-öø-ÿ]+)*$'
    AND (
      v_motto = ''
      OR (char_length(v_motto) <= 50 AND v_motto ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.,:;¡!¿?()''"-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.,:;¡!¿?()''"-]+)*$')
    )
    AND (btrim(v_logo) = '' OR (char_length(v_logo) <= 1000 AND v_logo ~ '^https?://[^[:space:]<>"'']+$'))
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    motto = EXCLUDED.motto,
    logo_url = EXCLUDED.logo_url,
    updated_at = now()
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('settings', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('save_platform_header', 'USER');

CREATE OR REPLACE FUNCTION public.save_platform_cover(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_headline text := btrim(coalesce(p ->> 'headline', ''));
  v_tagline text := btrim(coalesce(p ->> 'tagline', ''));
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('settings', NULL); END IF;
  INSERT INTO platform_settings (id, name, motto, headline, tagline, courts_enabled, court_slot_minutes, created_at, updated_at)
  SELECT 'config', '', '', v_headline, v_tagline, false, 60, now(), now()
  WHERE p ->> 'headline' IS NOT NULL AND p ->> 'tagline' IS NOT NULL
    AND (
      v_headline = ''
      OR (char_length(v_headline) <= 35 AND v_headline ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.,:;¡!¿?()''"-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.,:;¡!¿?()''"-]+)*$')
    )
    AND (
      v_tagline = ''
      OR (char_length(v_tagline) <= 120 AND v_tagline ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.,:;¡!¿?()''"-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.,:;¡!¿?()''"-]+)*$')
    )
  ON CONFLICT (id) DO UPDATE SET
    headline = EXCLUDED.headline,
    tagline = EXCLUDED.tagline,
    updated_at = now()
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('settings', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('save_platform_cover', 'USER');

-- Redes en minúsculas, salvo el id de canal de YouTube. WhatsApp solo dígitos.
CREATE OR REPLACE FUNCTION public.save_platform_social(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_ig text := p ->> 'instagram';
  v_fb text := p ->> 'facebook';
  v_x text := p ->> 'x';
  v_yt text := p ->> 'youtube';
  v_wa text := p ->> 'whatsapp';
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('settings', NULL); END IF;
  INSERT INTO platform_settings (
    id, name, motto, headline, tagline, instagram, facebook, x, youtube, whatsapp,
    courts_enabled, court_slot_minutes, created_at, updated_at
  )
  SELECT
    'config', '', '', '', '',
    lower(v_ig), lower(v_fb), lower(v_x),
    CASE WHEN v_yt ~* '/channel/' THEN v_yt ELSE lower(v_yt) END,
    v_wa,
    false, 60, now(), now()
  WHERE (v_ig = '' OR (char_length(v_ig) <= 150 AND v_ig ~ '^[^[:space:]<>"'']+$'))
    AND (v_fb = '' OR (char_length(v_fb) <= 150 AND v_fb ~ '^[^[:space:]<>"'']+$'))
    AND (v_x = '' OR (char_length(v_x) <= 150 AND v_x ~ '^[^[:space:]<>"'']+$'))
    AND (v_yt = '' OR (char_length(v_yt) <= 150 AND v_yt ~ '^[^[:space:]<>"'']+$'))
    AND (v_wa = '' OR v_wa ~ '^[0-9]{10,13}$')
  ON CONFLICT (id) DO UPDATE SET
    instagram = EXCLUDED.instagram,
    facebook = EXCLUDED.facebook,
    x = EXCLUDED.x,
    youtube = EXCLUDED.youtube,
    whatsapp = EXCLUDED.whatsapp,
    updated_at = now()
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('settings', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('save_platform_social', 'USER');

-- Reemplaza el carrusel: hasta 6 URLs separadas por espacio (una URL nunca lo lleva); '' lo vacía
CREATE OR REPLACE FUNCTION public.replace_hero_images(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_urls text := p ->> 'urls';
  v_count int;
  v_bad boolean;
BEGIN
  IF NOT is_platform_admin() OR v_urls IS NULL THEN RETURN jsonb_build_object('images', NULL); END IF;
  SELECT count(*), coalesce(bool_or(char_length(url) > 2000 OR url !~ '^https?://[^[:space:]<>"'']+$'), false)
  INTO v_count, v_bad
  FROM unnest(string_to_array(btrim(v_urls), ' ')) AS t(url)
  WHERE url <> '';
  IF v_count > 6 OR v_bad THEN RETURN jsonb_build_object('images', NULL); END IF;

  INSERT INTO platform_hero_images (id, position, url)
  SELECT gen_random_uuid(), (ord - 1)::int, url
  FROM unnest(string_to_array(btrim(v_urls), ' ')) WITH ORDINALITY AS t(url, ord)
  WHERE url <> ''
  ON CONFLICT (position) DO UPDATE SET url = EXCLUDED.url;
  DELETE FROM platform_hero_images WHERE position >= v_count;
  RETURN jsonb_build_object('images', jsonb_build_object('id', 'config'));
END
$$;
CALL api_expose('replace_hero_images', 'USER');

-- ---------- Canchas ----------

-- El horario se guardaba en tres llamadas (ajustes, borrar franjas, una franja por llamada); si una fallaba
-- quedaba a medias. Ahora lo hace save_court_module en una sola transacción. Se quitan las viejas.
DROP FUNCTION IF EXISTS public.save_court_settings(jsonb);
DROP FUNCTION IF EXISTS public.clear_court_windows(jsonb);
DROP FUNCTION IF EXISTS public.save_court_window(jsonb);

-- Guarda el módulo de canchas completo: interruptor, paso del apartado (30 o 60) y franjas de apertura
-- {weekday 1..7, startTime, endTime} en HH:MM con inicio < fin (hasta 28; la misma regla que readWindows en
-- src/domains/courts/courts.ts). Si alguna renta manual pendiente o algún partido programado queda fuera del
-- nuevo horario no guarda nada y los devuelve en `conflicts` / `matchConflicts`; con force: true elimina las
-- rentas (`removed`) y deja los partidos por programar (`unscheduledMatches`), para avisar por correo.
-- PostgREST corre con la extensión safeupdate: todo DELETE lleva WHERE (aquí WHERE true).
CREATE OR REPLACE FUNCTION public.save_court_module(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_enabled boolean := (p ->> 'enabled')::boolean;
  v_slot int := (p ->> 'slotMinutes')::int;
  v_force boolean := coalesce((p ->> 'force')::boolean, false);
  v_windows jsonb := coalesce(p -> 'windows', '[]'::jsonb);
  v_total int := 0;
  v_valid int := 0;
  v_affected jsonb := '[]'::jsonb;
  v_matches jsonb := '[]'::jsonb;
  v_match_ids text[];
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('saved', NULL, 'conflicts', '[]'::jsonb, 'matchConflicts', '[]'::jsonb,
      'removed', '[]'::jsonb, 'unscheduledMatches', '[]'::jsonb);
  END IF;

  IF jsonb_typeof(v_windows) = 'array' THEN
    SELECT count(*),
      count(*) FILTER (WHERE (w ->> 'weekday') ~ '^[1-7]$'
        AND (w ->> 'startTime') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        AND (w ->> 'endTime') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        AND (w ->> 'startTime') < (w ->> 'endTime'))
    INTO v_total, v_valid
    FROM jsonb_array_elements(v_windows) w;
  ELSE
    v_total := -1;
  END IF;

  IF v_enabled IS NULL OR v_slot IS NULL OR v_slot NOT IN (30, 60)
     OR v_total < 0 OR v_total > 28 OR v_valid <> v_total THEN
    RETURN jsonb_build_object('saved', NULL, 'conflicts', '[]'::jsonb, 'matchConflicts', '[]'::jsonb,
      'removed', '[]'::jsonb, 'unscheduledMatches', '[]'::jsonb);
  END IF;

  -- Rentas manuales desde ayer (hoy en México) que ninguna franja nueva de su día contiene
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', h.id, 'courtName', c.name, 'hourlyRate', c.hourly_rate, 'holdDate', to_jsonb(h.hold_date),
      'startTime', h.start_time, 'endTime', h.end_time, 'note', h.note, 'guestEmail', h.guest_email)
      ORDER BY h.hold_date, h.start_time, h.id), '[]'::jsonb)
  INTO v_affected
  FROM court_holds h
  JOIN courts c ON c.id = h.court_id
  WHERE h.source::text = 'MANUAL'
    AND h.hold_date >= CURRENT_DATE - 1
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_windows) w
      WHERE (w ->> 'weekday')::int = EXTRACT(ISODOW FROM h.hold_date)
        AND (w ->> 'startTime') <= h.start_time
        AND h.end_time <= (w ->> 'endTime'));

  -- Partidos programados (no jugados: su apartado sobrevive al partido) cuyo tramo queda fuera del nuevo horario
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'matchId', m.id, 'courtName', c.name, 'holdDate', to_jsonb(h.hold_date),
      'startTime', h.start_time, 'endTime', h.end_time,
      'homeClub', hc.name, 'awayClub', ac.name, 'tournamentName', t.name)
      ORDER BY h.hold_date, h.start_time, m.id), '[]'::jsonb),
    coalesce(array_agg(m.id), '{}')
  INTO v_matches, v_match_ids
  FROM court_holds h
  JOIN matches m ON m.id = h.match_id
  JOIN courts c ON c.id = h.court_id
  JOIN clubs hc ON hc.id = m.home_club_id
  JOIN clubs ac ON ac.id = m.away_club_id
  JOIN tournaments t ON t.id = m.tournament_id
  WHERE h.source::text = 'MATCH'
    AND m.status = 'SCHEDULED'::match_status
    AND h.hold_date >= CURRENT_DATE - 1
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_windows) w
      WHERE (w ->> 'weekday')::int = EXTRACT(ISODOW FROM h.hold_date)
        AND (w ->> 'startTime') <= h.start_time
        AND h.end_time <= (w ->> 'endTime'));

  IF (jsonb_array_length(v_affected) > 0 OR jsonb_array_length(v_matches) > 0) AND NOT v_force THEN
    RETURN jsonb_build_object('saved', NULL, 'conflicts', v_affected, 'matchConflicts', v_matches,
      'removed', '[]'::jsonb, 'unscheduledMatches', '[]'::jsonb);
  END IF;

  INSERT INTO platform_settings (id, name, motto, headline, tagline, courts_enabled, court_slot_minutes, created_at, updated_at)
  VALUES ('config', '', '', '', '', v_enabled, v_slot, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    courts_enabled = EXCLUDED.courts_enabled,
    court_slot_minutes = EXCLUDED.court_slot_minutes,
    updated_at = now();

  DELETE FROM court_open_windows WHERE true;
  INSERT INTO court_open_windows (weekday, start_time, end_time)
  SELECT (w ->> 'weekday')::int, w ->> 'startTime', w ->> 'endTime'
  FROM jsonb_array_elements(v_windows) w;

  DELETE FROM court_holds h
  WHERE h.source::text = 'MANUAL'
    AND h.id IN (SELECT x ->> 'id' FROM jsonb_array_elements(v_affected) x);

  -- Los partidos quedan por programar (db/migrations/1012_fn_league.sql)
  PERFORM unschedule_matches(v_match_ids);

  RETURN jsonb_build_object('saved', jsonb_build_object('id', 'config'), 'conflicts', '[]'::jsonb,
    'matchConflicts', '[]'::jsonb, 'removed', v_affected, 'unscheduledMatches', v_matches);
END
$$;
CALL api_expose('save_court_module', 'USER');

CREATE OR REPLACE FUNCTION public.save_court(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_name text := btrim(coalesce(p ->> 'name', ''));
  v_desc text := btrim(coalesce(p ->> 'description', ''));
  v_rate numeric := (p ->> 'hourlyRate')::numeric;
  v_football boolean := (p ->> 'football')::boolean;
  v_image text := coalesce(p ->> 'imageUrl', '');
  v_order int := (p ->> 'sortOrder')::int;
  v_active boolean := (p ->> 'active')::boolean;
  v_location text := btrim(coalesce(p ->> 'location', ''));
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('court', NULL); END IF;
  -- left(): el WHERE ya limita el largo; evita que el plan falle con 22001 antes de evaluarlo
  INSERT INTO courts (id, name, description, hourly_rate, football, image_url, sort_order, active, location)
  SELECT
    p ->> 'id',
    left(initcap(v_name), 15),
    left(v_desc, 15),
    round(v_rate, 2),
    v_football,
    NULLIF(btrim(v_image), ''),
    v_order,
    v_active,
    left(v_location, 60)
  WHERE p ->> 'id' IS NOT NULL
    AND v_football IS NOT NULL
    AND v_active IS NOT NULL
    AND char_length(v_name) BETWEEN 3 AND 15
    AND v_name ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ]+)( [A-Za-z0-9À-ÖØ-öø-ÿ]+)*$'
    AND char_length(v_desc) BETWEEN 3 AND 15
    AND v_desc ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.,-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.,-]+)*$'
    AND v_rate >= 0
    AND round(v_rate, 2) <= 99999999.99
    AND (
      btrim(v_image) = ''
      OR (char_length(v_image) <= 2048 AND v_image ~ '^https?://[^[:space:]<>"'']+$')
    )
    AND v_order BETWEEN 0 AND 100000
    AND (
      v_location = ''
      OR (
        char_length(v_location) BETWEEN 3 AND 60
        AND v_location ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.,#/-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.,#/-]+)*$'
      )
    )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    hourly_rate = EXCLUDED.hourly_rate,
    football = EXCLUDED.football,
    image_url = EXCLUDED.image_url,
    sort_order = EXCLUDED.sort_order,
    active = EXCLUDED.active,
    location = EXCLUDED.location
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('court', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('save_court', 'USER');

-- Desvincula los partidos, borra los apartados y la cancha
CREATE OR REPLACE FUNCTION public.delete_court(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_court text := p ->> 'id';
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('unlinked', NULL, 'dropped', NULL, 'court', NULL);
  END IF;
  UPDATE matches SET court_id = NULL WHERE court_id = v_court;
  DELETE FROM court_holds WHERE court_id = v_court;
  DELETE FROM courts WHERE id = v_court RETURNING id INTO v_id;
  RETURN jsonb_build_object('unlinked', NULL, 'dropped', NULL,
    'court', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('delete_court', 'USER');

-- La nota llega como "Nombre · Nota". Nombre: letras y espacios, 3 a 30, en Title Case.
-- Nota: opcional, hasta 50. Correo obligatorio. Fecha desde ayer en UTC (hoy en México).
-- El tramo cae en la rejilla, dentro de la apertura de ese día y sin cruzarse con otro.
CREATE OR REPLACE FUNCTION public.save_court_hold(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_court text := p ->> 'courtId';
  v_date date := (p ->> 'holdDate')::date;
  v_start text := p ->> 'startTime';
  v_end text := p ->> 'endTime';
  v_note text := btrim(coalesce(p ->> 'note', ''));
  v_email text := btrim(coalesce(p ->> 'guestEmail', ''));
  v_fresh boolean := coalesce((p ->> 'fresh')::boolean, false);
  v_slot int := (SELECT court_slot_minutes FROM platform_settings WHERE id = 'config');
  v_hold text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('saved', NULL, 'race', NULL, 'hold', NULL);
  END IF;

  INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, note, guest_email)
  SELECT
    v_id, v_court, v_date, v_start, v_end, 'MANUAL'::court_hold_source,
    initcap(split_part(v_note, ' · ', 1))
      || CASE WHEN strpos(v_note, ' · ') > 0 THEN ' · ' || split_part(v_note, ' · ', 2) ELSE '' END,
    lower(v_email)
  WHERE v_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM courts WHERE id = v_court)
    AND v_date >= CURRENT_DATE - 1
    AND v_note ~ '^[A-Za-zÀ-ÖØ-öø-ÿ]+( [A-Za-zÀ-ÖØ-öø-ÿ]+)*( · [A-Za-zÀ-ÖØ-öø-ÿ0-9.,¡!¿?-]+( [A-Za-zÀ-ÖØ-öø-ÿ0-9.,¡!¿?-]+)*)?$'
    AND char_length(split_part(v_note, ' · ', 1)) BETWEEN 3 AND 30
    AND char_length(split_part(v_note, ' · ', 2)) <= 50
    AND char_length(v_email) <= 100
    AND lower(v_email) ~ '^[a-z0-9._%+-]+@([a-z0-9-]+[.])+[a-z]{2,10}$'
    AND CASE
      WHEN v_start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND v_end ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      THEN v_start < v_end
        AND (split_part(v_start, ':', 1)::int * 60 + split_part(v_start, ':', 2)::int) % v_slot = 0
        AND (split_part(v_end, ':', 1)::int * 60 + split_part(v_end, ':', 2)::int) % v_slot = 0
      ELSE false
    END
    AND EXISTS (
      SELECT 1 FROM court_open_windows w
      WHERE w.weekday = EXTRACT(ISODOW FROM v_date)
        AND w.start_time <= v_start
        AND v_end <= w.end_time
    )
    AND NOT EXISTS (
      SELECT 1 FROM court_holds h
      WHERE h.court_id = v_court
        AND h.hold_date = v_date
        AND h.id <> v_id
        AND h.start_time < v_end
        AND v_start < h.end_time
    )
  ON CONFLICT (id) DO UPDATE SET
    court_id = EXCLUDED.court_id,
    hold_date = EXCLUDED.hold_date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    note = EXCLUDED.note,
    guest_email = EXCLUDED.guest_email
  WHERE court_holds.source::text = 'MANUAL'
    AND court_holds.hold_date >= CURRENT_DATE - 1;

  -- Dos apartados nuevos al mismo tiempo pueden pasar ambos el NOT EXISTS de arriba.
  -- El que llega y ya ve otro cruzado se quita a sí mismo; al menos uno de los dos lo ve.
  DELETE FROM court_holds h
  WHERE h.id = v_id
    AND v_fresh
    AND h.source::text = 'MANUAL'
    AND EXISTS (
      SELECT 1 FROM court_holds o
      WHERE o.court_id = h.court_id
        AND o.hold_date = h.hold_date
        AND o.id <> h.id
        AND o.start_time < h.end_time
        AND h.start_time < o.end_time
    );

  SELECT id INTO v_hold FROM court_holds
  WHERE id = v_id
    AND court_id = v_court
    AND hold_date = v_date
    AND start_time = v_start
    AND end_time = v_end
    AND lower(note) = lower(v_note)
    AND guest_email = lower(v_email);
  RETURN jsonb_build_object('saved', NULL, 'race', NULL,
    'hold', CASE WHEN v_hold IS NULL THEN NULL ELSE jsonb_build_object('id', v_hold) END);
END
$$;
CALL api_expose('save_court_hold', 'USER');

CREATE OR REPLACE FUNCTION public.delete_manual_court_hold(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('hold', NULL); END IF;
  DELETE FROM court_holds WHERE id = p ->> 'id' AND source::text = 'MANUAL'
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('hold', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('delete_manual_court_hold', 'USER');

-- ---------- Publicidad ----------

CREATE OR REPLACE FUNCTION public.save_ad(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_brand text := btrim(coalesce(p ->> 'brand', ''));
  v_image text := p ->> 'imageUrl';
  v_href text := p ->> 'href';
  v_starts date := (p ->> 'startsOn')::date;
  v_ends date := (p ->> 'endsOn')::date;
  v_status text := p ->> 'status';
  v_order int := (p ->> 'sortOrder')::int;
  v_saved text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('ad', NULL); END IF;
  INSERT INTO ads (id, brand, image_url, href, starts_on, ends_on, status, sort_order, created_at)
  SELECT v_id, v_brand, v_image, v_href, v_starts, v_ends, v_status::ad_status, v_order, now()
  WHERE v_id IS NOT NULL
    AND v_status IN ('PROGRAMADO', 'EN_CURSO', 'PAUSADO', 'EXPIRADO')
    AND v_order IS NOT NULL
    AND char_length(v_brand) BETWEEN 2 AND 50
    AND v_brand ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ]+)( [A-Za-z0-9À-ÖØ-öø-ÿ]+)*$'
    AND char_length(v_image) <= 2000 AND v_image ~ '^https?://[^[:space:]<>"'']+$'
    AND (v_href = '' OR (char_length(v_href) <= 500 AND v_href ~ '^https?://[^[:space:]<>"'']+$'))
    AND v_ends > v_starts
    -- Un anuncio nuevo no arranca en el pasado. Un día de holgura por la zona horaria del navegador.
    AND (v_starts >= CURRENT_DATE - 1 OR EXISTS (SELECT 1 FROM ads WHERE id = v_id))
  ON CONFLICT (id) DO UPDATE SET
    brand = EXCLUDED.brand,
    image_url = EXCLUDED.image_url,
    href = EXCLUDED.href,
    starts_on = EXCLUDED.starts_on,
    ends_on = EXCLUDED.ends_on,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('ad', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('save_ad', 'USER');

CREATE OR REPLACE FUNCTION public.set_ad_status(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_status text := p ->> 'status';
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('ad', NULL); END IF;
  UPDATE ads SET status = v_status::ad_status
  WHERE id = p ->> 'id' AND v_status IN ('PROGRAMADO', 'EN_CURSO', 'PAUSADO', 'EXPIRADO')
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ad', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('set_ad_status', 'USER');

-- Guarda el orden completo del inventario: ids separados por coma
CREATE OR REPLACE FUNCTION public.set_ad_order(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_ids text := p ->> 'ids';
  v_first text;
BEGIN
  IF NOT is_platform_admin() OR v_ids IS NULL THEN RETURN jsonb_build_object('ad', NULL); END IF;
  WITH u AS (
    UPDATE ads SET sort_order = (o.ord - 1)::int
    FROM unnest(string_to_array(v_ids, ',')) WITH ORDINALITY AS o(id, ord)
    WHERE ads.id = o.id
    RETURNING ads.id
  )
  SELECT min(id) INTO v_first FROM u;
  RETURN jsonb_build_object('ad', CASE WHEN v_first IS NULL THEN NULL ELSE jsonb_build_object('id', v_first) END);
END
$$;
CALL api_expose('set_ad_order', 'USER');

CREATE OR REPLACE FUNCTION public.clear_ad_placements(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_n int;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('cleared', NULL); END IF;
  DELETE FROM ad_placements WHERE ad_id = p ->> 'adId';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('cleared', v_n);
END
$$;
CALL api_expose('clear_ad_placements', 'USER');

CREATE OR REPLACE FUNCTION public.save_ad_placement(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_placement text := p ->> 'placement';
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('placement', NULL); END IF;
  INSERT INTO ad_placements (ad_id, placement, created_at)
  SELECT p ->> 'adId', v_placement::ad_placement_kind, now()
  WHERE v_placement IN ('HOME', 'TOURNAMENT', 'CLUB', 'TEAMS')
    AND EXISTS (SELECT 1 FROM ads WHERE id = p ->> 'adId')
  ON CONFLICT (ad_id, placement) DO NOTHING
  RETURNING ad_id INTO v_id;
  RETURN jsonb_build_object('placement', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('save_ad_placement', 'USER');

CREATE OR REPLACE FUNCTION public.delete_ad(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('ad', NULL); END IF;
  DELETE FROM ads WHERE id = p ->> 'id' RETURNING id INTO v_id;
  RETURN jsonb_build_object('ad', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('delete_ad', 'USER');

-- ---------- Bandeja: consultas y solicitudes ----------

CREATE OR REPLACE FUNCTION public.set_inquiry_done(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('inquiry', NULL); END IF;
  UPDATE inquiries SET status = 'DONE' WHERE id = p ->> 'id' RETURNING id INTO v_id;
  RETURN jsonb_build_object('inquiry', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('set_inquiry_done', 'USER');

CREATE OR REPLACE FUNCTION public.delete_inquiry(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('inquiry', NULL); END IF;
  DELETE FROM inquiries WHERE id = p ->> 'id' RETURNING id INTO v_id;
  RETURN jsonb_build_object('inquiry', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('delete_inquiry', 'USER');

CREATE OR REPLACE FUNCTION public.reject_team_application(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('application', NULL); END IF;
  UPDATE team_applications SET status = 'REJECTED', reviewed_at = now()
  WHERE id = p ->> 'id' AND status::text = 'PENDING'
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('application', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('reject_team_application', 'USER');

-- El club ya fue creado con CreateClub; aquí solo se enlaza y se marca la solicitud
CREATE OR REPLACE FUNCTION public.approve_team_application(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('application', NULL); END IF;
  UPDATE team_applications
  SET status = 'APPROVED', club_id = p ->> 'clubId', slug = p ->> 'slug', reviewed_at = now()
  WHERE id = p ->> 'id' AND status::text = 'PENDING'
    AND EXISTS (SELECT 1 FROM clubs WHERE id = p ->> 'clubId')
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('application', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('approve_team_application', 'USER');

-- ---------- Superadministradores ----------

CREATE OR REPLACE FUNCTION public.save_platform_admin_invite(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_key text := p ->> 'emailKey';
  v_email text := btrim(coalesce(p ->> 'email', ''));
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('invite', NULL); END IF;
  INSERT INTO platform_admin_invites (email_key, email, invited_by_id, created_at)
  SELECT v_key, lower(v_email), v_uid, now()
  WHERE char_length(v_email) BETWEEN 6 AND 100
    AND v_email = lower(v_email)
    AND v_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[a-z]{2,}$'
    AND v_key = email_key(v_email)
    AND NOT EXISTS (SELECT 1 FROM platform_admins WHERE lower(email) = lower(v_email))
    AND NOT EXISTS (SELECT 1 FROM platform_admin_invites WHERE email_key = v_key OR lower(email) = lower(v_email))
    -- Como mucho 10 invitaciones por hora
    AND (SELECT count(*) FROM platform_admin_invites WHERE created_at > now() - INTERVAL '1 hour') < 10
  ON CONFLICT DO NOTHING
  RETURNING email_key INTO v_id;
  RETURN jsonb_build_object('invite', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('save_platform_admin_invite', 'USER');

CREATE OR REPLACE FUNCTION public.remove_platform_admin_invite(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_key text := p ->> 'emailKey';
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('droppedSignup', NULL, 'invite', NULL); END IF;
  DELETE FROM signup_invites
  WHERE email_key = v_key AND platform
    AND EXISTS (SELECT 1 FROM platform_admin_invites WHERE email_key = v_key);
  DELETE FROM platform_admin_invites WHERE email_key = v_key RETURNING email_key INTO v_id;
  RETURN jsonb_build_object('droppedSignup', NULL,
    'invite', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('remove_platform_admin_invite', 'USER');

-- Nadie se quita a sí mismo y siempre queda al menos un superadmin
CREATE OR REPLACE FUNCTION public.remove_platform_admin(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text;
BEGIN
  IF NOT is_platform_admin() THEN RETURN jsonb_build_object('admin', NULL); END IF;
  DELETE FROM platform_admins
  WHERE user_id = p ->> 'userId'
    AND user_id <> v_uid
    AND (SELECT count(*) FROM platform_admins) > 1
  RETURNING user_id INTO v_id;
  RETURN jsonb_build_object('admin', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('remove_platform_admin', 'USER');

RESET ROLE;
