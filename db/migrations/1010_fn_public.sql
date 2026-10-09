-- Funciones RPC de las pantallas públicas y de la sesión (antes queries.gql y parte de admin.gql / mutations.gql).
--
-- Convenciones (ver CLAUDE.md):
-- - Una función por operación: nombre_en_snake(p jsonb) RETURNS jsonb, SECURITY DEFINER,
--   SET search_path = public, pg_temp. Devuelve exactamente la forma de su <Op>Data (claves camelCase).
-- - Listas: coalesce(jsonb_agg(... ORDER BY ...), '[]'); relación opcional: CASE WHEN x.id IS NULL THEN NULL ELSE ... END;
--   _count: jsonb_build_array(jsonb_build_object('_count', n)); fechas to_jsonb(date); timestamps api_ts().
-- - Permisos: nunca se confía en un userId del cliente; siempre auth.uid() (require_uid() en las USER).
--   Un permiso denegado en una mutación devuelve la clave con null (savedRow() lo detecta).
-- - Al final de cada función: CALL api_expose('nombre', 'PUBLIC' | 'USER').
SET ROLE postgres;

-- ---------- Sesión (redefine helpers de 0003_auth.sql y 0005, que se aplican una sola vez) ----------

-- Exige la sesión de una cuenta que exista. Un token todavía vigente de una cuenta borrada (base vaciada, usuario
-- eliminado o respaldo restaurado) cuenta como sin sesión (42501) y el cliente la cierra: así no crea perfiles sin
-- cuenta ni puede reclamar la plataforma vacía. SECURITY DEFINER porque GoTrue activa RLS en auth.users.
CREATE OR REPLACE FUNCTION public.require_uid()
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = auth.uid()) THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501', HINT = 'Debes iniciar sesión.';
  END IF;
  RETURN auth.uid()::text;
END
$$;

-- Perfil en public.users al crear la cuenta y, si la plataforma no tiene administrador, el primer usuario lo es.
-- Un perfil con el mismo correo sin cuenta detrás (de una cuenta borrada) haría fallar el alta por correo
-- repetido: se quita antes.
CREATE OR REPLACE FUNCTION public.handle_auth_user_after_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(NEW.email, '')));
  v_name text := left(regexp_replace(btrim(coalesce(NEW.raw_user_meta_data ->> 'display_name', '')), '\s+', ' ', 'g'), 40);
BEGIN
  DELETE FROM users u
  WHERE u.email = v_email AND u.id <> NEW.id::text
    AND NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id::text = u.id);

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

-- ---------- Plataforma ----------

CREATE OR REPLACE FUNCTION public.platform_chrome(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('platformSettings', (
    SELECT jsonb_build_object(
      'name', s.name, 'motto', s.motto, 'logoUrl', s.logo_url,
      'instagram', s.instagram, 'facebook', s.facebook, 'x', s.x, 'youtube', s.youtube,
      'whatsapp', s.whatsapp, 'courtsEnabled', s.courts_enabled)
    FROM platform_settings s WHERE s.id = 'config'))
$$;
CALL api_expose('platform_chrome', 'PUBLIC');

CREATE OR REPLACE FUNCTION public.platform_banner(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'platformSettings', (
      SELECT jsonb_build_object('headline', s.headline, 'tagline', s.tagline)
      FROM platform_settings s WHERE s.id = 'config'),
    'platformHeroImages', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('url', h.url) ORDER BY h.position), '[]'::jsonb)
      FROM platform_hero_images h))
$$;
CALL api_expose('platform_banner', 'PUBLIC');

CREATE OR REPLACE FUNCTION public.contact_page(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('platformSettings', (
    SELECT jsonb_build_object('whatsapp', s.whatsapp, 'courtsEnabled', s.courts_enabled) FROM platform_settings s WHERE s.id = 'config'))
$$;
CALL api_expose('contact_page', 'PUBLIC');

-- Solo indica si la plataforma ya tiene administrador, sin nombres ni correos
CREATE OR REPLACE FUNCTION public.platform_claim_open(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('platformClaimStates',
    (SELECT coalesce(jsonb_agg(jsonb_build_object('open', c.open)), '[]'::jsonb) FROM platform_claim_states c))
$$;
CALL api_expose('platform_claim_open', 'PUBLIC');

-- ---------- Portada ----------

CREATE OR REPLACE FUNCTION public.home_page(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH args AS (SELECT (p ->> 'today')::date AS today)
  SELECT jsonb_build_object(
    'platformSettings', (
      SELECT jsonb_build_object('headline', s.headline, 'tagline', s.tagline,
        'courtsEnabled', s.courts_enabled, 'whatsapp', s.whatsapp)
      FROM platform_settings s WHERE s.id = 'config'),
    'platformHeroImages', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('url', h.url) ORDER BY h.position), '[]'::jsonb)
      FROM platform_hero_images h),
    'platformStats', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('tournaments', st.tournaments, 'clubs', st.clubs, 'players', st.players)), '[]'::jsonb)
      FROM platform_stats st),
    'tournaments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', t.id, 'name', t.name, 'status', to_jsonb(t.status), 'footballType', to_jsonb(t.football_type),
        'startDate', to_jsonb(t.start_date), 'prize', t.prize,
        'season', (SELECT jsonb_build_object('name', se.name, 'startDate', to_jsonb(se.start_date)) FROM seasons se WHERE se.id = t.season_id),
        'category', (SELECT jsonb_build_object('name', c.name, 'sortOrder', c.sort_order) FROM categories c WHERE c.id = t.category_id),
        'tournamentClubs_on_tournament', jsonb_build_array(jsonb_build_object('_count',
          (SELECT count(*) FROM tournament_clubs tc WHERE tc.tournament_id = t.id))),
        'matches_on_tournament', jsonb_build_array(jsonb_build_object('_count',
          (SELECT count(*) FROM matches m WHERE m.tournament_id = t.id AND m.status = 'PLAYED')))
      ) ORDER BY t.created_at, t.id), '[]'::jsonb)
      FROM tournaments t WHERE t.status IN ('ACTIVE', 'UPCOMING')),
    'matches', (
      SELECT coalesce(jsonb_agg(row_json ORDER BY match_date, start_time, id), '[]'::jsonb)
      FROM (
        SELECT m.match_date, m.start_time, m.id, jsonb_build_object(
          'id', m.id, 'matchDate', to_jsonb(m.match_date), 'startTime', m.start_time, 'venue', m.venue,
          'homeClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.home_club_id),
          'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.away_club_id),
          'court', (SELECT jsonb_build_object('id', co.id, 'name', co.name, 'location', co.location) FROM courts co WHERE co.id = m.court_id),
          'tournament', jsonb_build_object('id', t.id, 'name', t.name, 'status', to_jsonb(t.status),
            'durationMinutes', t.duration_minutes, 'startDate', to_jsonb(t.start_date),
            'category', (SELECT jsonb_build_object('name', c.name) FROM categories c WHERE c.id = t.category_id))
        ) AS row_json
        FROM matches m
        JOIN tournaments t ON t.id = m.tournament_id
        CROSS JOIN args
        WHERE m.status = 'SCHEDULED'
          AND m.match_date >= args.today
          AND t.status IN ('ACTIVE', 'UPCOMING')
        ORDER BY m.match_date, m.start_time, m.id
        LIMIT 30
      ) sub),
    -- Las fechas deciden la vigencia; «Pausado» es el único freno manual
    'adPlacements', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('ad', jsonb_build_object(
        'brand', a.brand, 'imageUrl', a.image_url, 'href', a.href, 'startsOn', to_jsonb(a.starts_on),
        'endsOn', to_jsonb(a.ends_on), 'status', to_jsonb(a.status), 'sortOrder', a.sort_order))
        ORDER BY a.sort_order, a.brand), '[]'::jsonb)
      FROM ad_placements ap
      JOIN ads a ON a.id = ap.ad_id
      CROSS JOIN args
      WHERE ap.placement = 'HOME' AND a.status <> 'PAUSADO'
        AND a.starts_on <= args.today AND a.ends_on >= args.today)
  )
$$;
CALL api_expose('home_page', 'PUBLIC');

-- Desde ayer: un partido que empieza a las 23:30 sigue en vivo pasada la medianoche
CREATE OR REPLACE FUNCTION public.live_matches(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('matches', (
    SELECT coalesce(jsonb_agg(row_json ORDER BY match_date, start_time, id), '[]'::jsonb)
    FROM (
      SELECT m.match_date, m.start_time, m.id, jsonb_build_object(
        'id', m.id, 'matchDate', to_jsonb(m.match_date), 'startTime', m.start_time, 'venue', m.venue,
        'status', to_jsonb(m.status), 'homeScore', m.home_score, 'awayScore', m.away_score,
        'penaltiesHome', m.penalties_home, 'penaltiesAway', m.penalties_away, 'walkover', m.walkover, 'noShow', to_jsonb(m.no_show),
        'homeClub', (SELECT jsonb_build_object('name', c.name, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.home_club_id),
        'awayClub', (SELECT jsonb_build_object('name', c.name, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.away_club_id),
        'court', (SELECT jsonb_build_object('name', co.name, 'location', co.location) FROM courts co WHERE co.id = m.court_id),
        'tournament', jsonb_build_object('id', t.id, 'name', t.name, 'durationMinutes', t.duration_minutes,
          'category', (SELECT jsonb_build_object('name', c.name) FROM categories c WHERE c.id = t.category_id))
      ) AS row_json
      FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.match_date >= (p ->> 'from')::date AND m.match_date <= (p ->> 'to')::date
        AND m.status IN ('SCHEDULED', 'PLAYED')
        AND t.status IN ('ACTIVE', 'UPCOMING')
      ORDER BY m.match_date, m.start_time, m.id
      LIMIT 40
    ) sub))
$$;
CALL api_expose('live_matches', 'PUBLIC');

-- Las fechas deciden la vigencia; «Pausado» es el único freno manual
CREATE OR REPLACE FUNCTION public.live_ads(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('adPlacements', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'placement', to_jsonb(ap.placement),
      'ad', jsonb_build_object('id', a.id, 'brand', a.brand, 'imageUrl', a.image_url, 'href', a.href,
        'sortOrder', a.sort_order, 'startsOn', to_jsonb(a.starts_on), 'endsOn', to_jsonb(a.ends_on)))
      ORDER BY a.sort_order, a.brand), '[]'::jsonb)
    FROM ad_placements ap
    JOIN ads a ON a.id = ap.ad_id
    WHERE ap.placement = (p ->> 'placement')::ad_placement_kind
      AND a.status <> 'PAUSADO'
      AND a.starts_on <= (p ->> 'today')::date AND a.ends_on >= (p ->> 'today')::date))
$$;
CALL api_expose('live_ads', 'PUBLIC');

-- ---------- Equipos ----------

CREATE OR REPLACE FUNCTION public.teams_page(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'clubs', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url, 'location', c.location,
        'presidentPhone', c.president_phone,
        'locality', (SELECT jsonb_build_object('name', l.name) FROM localities l WHERE l.id = c.locality_id))
        ORDER BY c.name), '[]'::jsonb)
      FROM clubs c WHERE c.active),
    'seasons', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'active', s.active,
        'startDate', to_jsonb(s.start_date)) ORDER BY s.start_date DESC NULLS LAST, s.id), '[]'::jsonb)
      FROM seasons s),
    'categories', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'sortOrder', c.sort_order)
        ORDER BY c.sort_order, c.id), '[]'::jsonb)
      FROM categories c),
    'tournaments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'season', jsonb_build_object('id', t.season_id),
        'category', jsonb_build_object('id', t.category_id),
        'tournamentClubs_on_tournament', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('club', jsonb_build_object('name', c.name, 'slug', c.slug))), '[]'::jsonb)
          FROM tournament_clubs tc JOIN clubs c ON c.id = tc.club_id WHERE tc.tournament_id = t.id))
        ORDER BY t.id), '[]'::jsonb)
      FROM tournaments t),
    'matches', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'homeScore', m.home_score, 'awayScore', m.away_score,
        'homeClub', (SELECT jsonb_build_object('name', c.name, 'slug', c.slug) FROM clubs c WHERE c.id = m.home_club_id),
        'awayClub', (SELECT jsonb_build_object('name', c.name, 'slug', c.slug) FROM clubs c WHERE c.id = m.away_club_id),
        'tournament', jsonb_build_object('season', jsonb_build_object('id', t.season_id),
          'category', jsonb_build_object('id', t.category_id)))
        ORDER BY m.id), '[]'::jsonb)
      FROM matches m JOIN tournaments t ON t.id = m.tournament_id WHERE m.status = 'PLAYED')
  )
$$;
CALL api_expose('teams_page', 'PUBLIC');

CREATE OR REPLACE FUNCTION public.search_clubs(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH args AS (SELECT btrim(coalesce(p ->> 'term', '')) AS term)
  SELECT jsonb_build_object('clubs', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url, 'location', c.location,
      'presidentPhone', c.president_phone, 'localityName', coalesce(l.name, ''))
      ORDER BY c.name), '[]'::jsonb)
    FROM clubs c
    LEFT JOIN localities l ON l.id = c.locality_id
    CROSS JOIN args
    WHERE c.active
      AND char_length(args.term) BETWEEN 3 AND 30
      AND args.term ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.''"-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.''"-]+)*$'
      AND translate(lower(c.name), 'áàäâéèëêíìïîóòöôúùüûñÿ', 'aaaaeeeeiiiioooouuuuny')
        LIKE '%' || translate(lower(args.term), 'áàäâéèëêíìïîóòöôúùüûñÿ', 'aaaaeeeeiiiioooouuuuny') || '%'))
$$;
CALL api_expose('search_clubs', 'PUBLIC');

CREATE OR REPLACE FUNCTION public.register_team_page(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('clubs', (
    SELECT coalesce(jsonb_agg(row_json ORDER BY name), '[]'::jsonb)
    FROM (
      SELECT c.name, jsonb_build_object(
        'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url, 'location', c.location,
        'presidentPhone', c.president_phone,
        'locality', (SELECT jsonb_build_object('name', l.name) FROM localities l WHERE l.id = c.locality_id)) AS row_json
      FROM clubs c WHERE c.active ORDER BY c.name LIMIT 10
    ) sub))
$$;
CALL api_expose('register_team_page', 'PUBLIC');

-- ---------- Partidos ----------

CREATE OR REPLACE FUNCTION public.matches_page(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'tournaments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name,
        'category', (SELECT jsonb_build_object('name', c.name) FROM categories c WHERE c.id = t.category_id))
        ORDER BY t.id), '[]'::jsonb)
      FROM tournaments t WHERE t.status IN ('ACTIVE', 'UPCOMING')),
    'matches', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id, 'matchDate', to_jsonb(m.match_date), 'startTime', m.start_time, 'venue', m.venue,
        'homeClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.home_club_id),
        'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.away_club_id),
        'court', (SELECT jsonb_build_object('id', co.id, 'name', co.name, 'location', co.location) FROM courts co WHERE co.id = m.court_id),
        'tournament', jsonb_build_object('id', t.id, 'name', t.name, 'status', to_jsonb(t.status),
          'durationMinutes', t.duration_minutes, 'startDate', to_jsonb(t.start_date),
          'category', (SELECT jsonb_build_object('name', c.name) FROM categories c WHERE c.id = t.category_id)))
        ORDER BY m.match_date NULLS LAST, m.start_time NULLS LAST, m.id), '[]'::jsonb)
      FROM matches m JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.status IN ('SCHEDULED', 'UNSCHEDULED'))
  )
$$;
CALL api_expose('matches_page', 'PUBLIC');

-- Jugadores que ya aparecen en un partido (goles, asistencias, tarjetas, convocados, MVP y alineación), de ambos
-- clubes. La ficha y la hoja de marcador los devuelven aunque estén de baja o eliminados, para que su historial
-- conserve el nombre; los selectores solo ofrecen a los activos (campo active).
CREATE OR REPLACE FUNCTION public.match_player_refs(p_match text)
RETURNS SETOF text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT g.scorer_id FROM match_goals g WHERE g.match_id = p_match AND g.scorer_id IS NOT NULL
  UNION SELECT g.assist_id FROM match_goals g WHERE g.match_id = p_match AND g.assist_id IS NOT NULL
  UNION SELECT k.player_id FROM match_cards k WHERE k.match_id = p_match AND k.player_id IS NOT NULL
  UNION SELECT a.player_id FROM match_attendees a WHERE a.match_id = p_match
  UNION SELECT r.mvp_id FROM match_club_reports r WHERE r.match_id = p_match AND r.mvp_id IS NOT NULL
  UNION SELECT pos.value FROM match_club_reports r
    CROSS JOIN LATERAL jsonb_each_text(CASE WHEN jsonb_typeof(r.lineup -> 'positions') = 'object'
      THEN r.lineup -> 'positions' ELSE '{}'::jsonb END) AS pos
    WHERE r.match_id = p_match AND pos.value IS NOT NULL AND pos.value <> ''
$$;
REVOKE ALL ON FUNCTION public.match_player_refs(text) FROM PUBLIC, anon, authenticated;

-- Plantilla de un club para un partido: sus jugadores vivos (los 80 primeros por nombre si p_detail; todos en la
-- hoja de marcador) más los que ya aparecen en el partido aunque estén de baja o eliminados en el club (active
-- false). Con p_detail trae dorsal, posición, foto y cuerpo técnico (match_detail); sin él solo id, nombre y active
-- (match_score_sheet). Pertenencia y estado salen de club_players; nombre y foto de players (0010).
CREATE OR REPLACE FUNCTION public.match_club_roster(p_club text, p_match text, p_detail boolean)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT coalesce(jsonb_agg(s.pj ORDER BY s.name, s.id), '[]'::jsonb) FROM (
    SELECT pl.name, pl.id,
      CASE WHEN p_detail THEN jsonb_build_object('id', pl.id, 'name', pl.name, 'shirtNumber', cp.shirt_number,
          'position', cp.position, 'imageUrl', pl.image_url, 'isCoach', cp.is_coach,
          'active', cp.active AND cp.deleted_at IS NULL)
        ELSE jsonb_build_object('id', pl.id, 'name', pl.name, 'active', cp.active AND cp.deleted_at IS NULL)
      END AS pj
    FROM club_players cp JOIN players pl ON pl.id = cp.player_id
    WHERE cp.club_id = p_club
      AND (cp.player_id IN (
            SELECT a.player_id FROM club_players a JOIN players ap ON ap.id = a.player_id
            WHERE a.club_id = p_club AND a.active AND a.deleted_at IS NULL
            ORDER BY ap.name, ap.id LIMIT CASE WHEN p_detail THEN 80 ELSE NULL END)
        OR cp.player_id IN (SELECT ref FROM match_player_refs(p_match) AS ref))) s
$$;
REVOKE ALL ON FUNCTION public.match_club_roster(text, text, boolean) FROM PUBLIC, anon, authenticated;

-- Ficha pública del partido. Se vuelve a consultar cada 15 s mientras está en vivo.
CREATE OR REPLACE FUNCTION public.match_detail(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('matches', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', m.id, 'roundLabel', m.round_label, 'matchDate', to_jsonb(m.match_date), 'startTime', m.start_time,
      'venue', m.venue, 'status', to_jsonb(m.status), 'homeScore', m.home_score, 'awayScore', m.away_score,
      'penaltiesHome', m.penalties_home, 'penaltiesAway', m.penalties_away, 'walkover', m.walkover, 'noShow', to_jsonb(m.no_show),
      'court', (SELECT jsonb_build_object('name', co.name, 'imageUrl', co.image_url, 'location', co.location) FROM courts co WHERE co.id = m.court_id),
      'tournament', (SELECT jsonb_build_object('id', t.id, 'name', t.name, 'footballType', to_jsonb(t.football_type),
        'durationMinutes', t.duration_minutes,
        'category', (SELECT jsonb_build_object('name', c.name) FROM categories c WHERE c.id = t.category_id))
        FROM tournaments t WHERE t.id = m.tournament_id),
      'homeClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url,
        'players_on_club', match_club_roster(c.id, m.id, true))
        FROM clubs c WHERE c.id = m.home_club_id),
      'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url,
        'players_on_club', match_club_roster(c.id, m.id, true))
        FROM clubs c WHERE c.id = m.away_club_id),
      'matchClubReports_on_match', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('club', jsonb_build_object('id', r.club_id), 'lineup', r.lineup,
          'mvp', (SELECT jsonb_build_object('id', pl.id, 'name', pl.name) FROM players pl WHERE pl.id = r.mvp_id))), '[]'::jsonb)
        FROM match_club_reports r WHERE r.match_id = m.id),
      'matchAttendees_on_match', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('club', jsonb_build_object('id', a.club_id),
          'player', jsonb_build_object('id', a.player_id))), '[]'::jsonb)
        FROM (SELECT * FROM match_attendees a WHERE a.match_id = m.id LIMIT 160) a),
      'matchGoals_on_match', (
        SELECT coalesce(jsonb_agg(gj ORDER BY minute NULLS LAST, sort_order), '[]'::jsonb) FROM (
          SELECT g.minute, g.sort_order, jsonb_build_object('id', g.id, 'minute', g.minute, 'sortOrder', g.sort_order,
            'isPenalty', g.is_penalty, 'isOwnGoal', g.is_own_goal, 'scorerName', g.scorer_name, 'assistName', g.assist_name,
            'club', jsonb_build_object('id', g.club_id),
            'scorer', (SELECT jsonb_build_object('id', pl.id, 'name', pl.name) FROM players pl WHERE pl.id = g.scorer_id),
            'assist', (SELECT jsonb_build_object('id', pl.id, 'name', pl.name) FROM players pl WHERE pl.id = g.assist_id)) AS gj
          FROM match_goals g WHERE g.match_id = m.id ORDER BY g.minute NULLS LAST, g.sort_order LIMIT 60) s),
      'matchCards_on_match', (
        SELECT coalesce(jsonb_agg(cj ORDER BY minute NULLS LAST, id), '[]'::jsonb) FROM (
          SELECT k.minute, k.id, jsonb_build_object('id', k.id, 'minute', k.minute, 'color', to_jsonb(k.color),
            'playerName', k.player_name, 'club', jsonb_build_object('id', k.club_id),
            'player', (SELECT jsonb_build_object('id', pl.id, 'name', pl.name) FROM players pl WHERE pl.id = k.player_id)) AS cj
          FROM match_cards k WHERE k.match_id = m.id ORDER BY k.minute NULLS LAST, k.id LIMIT 60) s)
    )), '[]'::jsonb)
    FROM matches m WHERE m.id = p ->> 'id'))
$$;
CALL api_expose('match_detail', 'PUBLIC');

-- Previa del partido: tabla del torneo y últimos partidos jugados de ambos clubes
CREATE OR REPLACE FUNCTION public.match_preview(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'tournamentStandings', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('standingRank', s.standing_rank, 'pj', s.pj, 'g', s.g, 'e', s.e,
        'p', s.p, 'gf', s.gf, 'gc', s.gc, 'dg', s.dg, 'pts', s.pts, 'club', jsonb_build_object('id', s.club_id))
        ORDER BY s.standing_rank, s.club_id), '[]'::jsonb)
      -- La vista tiene una columna «p»: el parámetro se califica con el nombre de la función
      FROM tournament_standings s WHERE s.tournament_id = match_preview.p ->> 'tournamentId'),
    'matches', (
      SELECT coalesce(jsonb_agg(mj ORDER BY match_date DESC NULLS LAST, start_time DESC NULLS LAST, id), '[]'::jsonb) FROM (
        SELECT m.match_date, m.start_time, m.id, jsonb_build_object(
          'id', m.id, 'matchDate', to_jsonb(m.match_date), 'homeScore', m.home_score, 'awayScore', m.away_score,
          'penaltiesHome', m.penalties_home, 'penaltiesAway', m.penalties_away, 'walkover', m.walkover, 'noShow', to_jsonb(m.no_show),
          'homeClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name) FROM clubs c WHERE c.id = m.home_club_id),
          'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name) FROM clubs c WHERE c.id = m.away_club_id),
          'tournament', (SELECT jsonb_build_object('id', t.id, 'name', t.name) FROM tournaments t WHERE t.id = m.tournament_id)) AS mj
        FROM matches m
        WHERE m.status = 'PLAYED'
          AND (m.home_club_id IN (p ->> 'homeClubId', p ->> 'awayClubId')
            OR m.away_club_id IN (p ->> 'homeClubId', p ->> 'awayClubId'))
        ORDER BY m.match_date DESC NULLS LAST, m.start_time DESC NULLS LAST, m.id
        LIMIT 60) s)
  )
$$;
CALL api_expose('match_preview', 'PUBLIC');

-- Hoja de marcador (edición del superadmin)
CREATE OR REPLACE FUNCTION public.match_score_sheet(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH s AS (SELECT require_uid() AS uid)
  SELECT jsonb_build_object('matches', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'homeScore', m.home_score, 'awayScore', m.away_score,
      'homeClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'players_on_club', match_club_roster(c.id, m.id, false))
        FROM clubs c WHERE c.id = m.home_club_id),
      'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'players_on_club', match_club_roster(c.id, m.id, false))
        FROM clubs c WHERE c.id = m.away_club_id),
      'matchGoals_on_match', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('club', jsonb_build_object('id', g.club_id),
          'scorer', CASE WHEN g.scorer_id IS NULL THEN NULL ELSE jsonb_build_object('id', g.scorer_id) END,
          'assist', CASE WHEN g.assist_id IS NULL THEN NULL ELSE jsonb_build_object('id', g.assist_id) END,
          'isPenalty', g.is_penalty, 'isOwnGoal', g.is_own_goal, 'minute', g.minute) ORDER BY g.sort_order), '[]'::jsonb)
        FROM match_goals g WHERE g.match_id = m.id),
      'matchCards_on_match', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('club', jsonb_build_object('id', k.club_id), 'color', to_jsonb(k.color),
          'player', CASE WHEN k.player_id IS NULL THEN NULL ELSE jsonb_build_object('id', k.player_id) END,
          'minute', k.minute) ORDER BY k.minute NULLS LAST, k.id), '[]'::jsonb)
        FROM match_cards k WHERE k.match_id = m.id)
    )), '[]'::jsonb)
    FROM matches m, s WHERE m.id = p ->> 'matchId'))
$$;
CALL api_expose('match_score_sheet', 'USER');

-- ---------- Torneos ----------

CREATE OR REPLACE FUNCTION public.tournament_archive(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'tournaments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', t.id, 'name', t.name, 'status', to_jsonb(t.status), 'footballType', to_jsonb(t.football_type),
        'startDate', to_jsonb(t.start_date), 'prize', t.prize,
        'season', (SELECT jsonb_build_object('name', se.name, 'active', se.active, 'startDate', to_jsonb(se.start_date)) FROM seasons se WHERE se.id = t.season_id),
        'category', (SELECT jsonb_build_object('name', c.name, 'sortOrder', c.sort_order) FROM categories c WHERE c.id = t.category_id),
        'tournamentClubs_on_tournament', jsonb_build_array(jsonb_build_object('_count',
          (SELECT count(*) FROM tournament_clubs tc WHERE tc.tournament_id = t.id))),
        'matches_on_tournament', jsonb_build_array(jsonb_build_object('_count',
          (SELECT count(*) FROM matches m WHERE m.tournament_id = t.id AND m.status = 'PLAYED')))
      ) ORDER BY t.created_at, t.id), '[]'::jsonb)
      FROM tournaments t),
    'platformSettings', (SELECT jsonb_build_object('whatsapp', s.whatsapp) FROM platform_settings s WHERE s.id = 'config')
  )
$$;
CALL api_expose('tournament_archive', 'PUBLIC');

CREATE OR REPLACE FUNCTION public.tournament_screen(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'tournaments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'name', t.name, 'status', to_jsonb(t.status), 'footballType', to_jsonb(t.football_type),
        'startDate', to_jsonb(t.start_date), 'durationMinutes', t.duration_minutes, 'prize', t.prize,
        'season', (SELECT jsonb_build_object('name', se.name, 'active', se.active, 'startDate', to_jsonb(se.start_date)) FROM seasons se WHERE se.id = t.season_id),
        'category', (SELECT jsonb_build_object('name', c.name) FROM categories c WHERE c.id = t.category_id),
        'tournamentPodiums_on_tournament', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('place', po.place,
            'club', (SELECT jsonb_build_object('name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = po.club_id))
            ORDER BY po.place), '[]'::jsonb)
          FROM tournament_podium po WHERE po.tournament_id = t.id)
      )), '[]'::jsonb)
      FROM tournaments t WHERE t.id = p ->> 'id'),
    'matches', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id, 'roundLabel', m.round_label, 'matchDate', to_jsonb(m.match_date), 'startTime', m.start_time,
        'venue', m.venue, 'status', to_jsonb(m.status), 'homeScore', m.home_score, 'awayScore', m.away_score,
        'penaltiesHome', m.penalties_home, 'penaltiesAway', m.penalties_away, 'walkover', m.walkover, 'noShow', to_jsonb(m.no_show),
        'homeClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.home_club_id),
        'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.away_club_id),
        'court', (SELECT jsonb_build_object('id', co.id, 'name', co.name, 'location', co.location) FROM courts co WHERE co.id = m.court_id))
        ORDER BY m.round_number NULLS LAST, m.match_date NULLS LAST, m.id), '[]'::jsonb)
      FROM matches m WHERE m.tournament_id = p ->> 'id'),
    'tournamentStandings', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('standingRank', s.standing_rank, 'pj', s.pj, 'g', s.g, 'e', s.e,
        'p', s.p, 'gf', s.gf, 'gc', s.gc, 'dg', s.dg, 'pts', s.pts,
        'club', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = s.club_id))
        ORDER BY s.standing_rank, s.club_id), '[]'::jsonb)
      -- La vista tiene una columna «p»: el parámetro se califica con el nombre de la función
      FROM tournament_standings s WHERE s.tournament_id = tournament_screen.p ->> 'id'),
    'tournamentScorers', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('playerName', sc.player_name, 'goals', sc.goals, 'assists', sc.assists,
        'player', (SELECT jsonb_build_object('id', pl.id, 'imageUrl', pl.image_url) FROM players pl WHERE pl.id = sc.player_id),
        'club', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = sc.club_id))
        ORDER BY sc.goals DESC, sc.assists DESC, sc.player_name), '[]'::jsonb)
      FROM tournament_scorers sc WHERE sc.tournament_id = p ->> 'id')
  )
$$;
CALL api_expose('tournament_screen', 'PUBLIC');

-- Resumen de una temporada cerrada: podios, cifras, premios individuales y récords de todos sus torneos.
-- Es pública (se comparte por enlace) pero solo responde si la temporada ya se cerró; si no, season = null.
-- Los walkovers cuentan como jugados, pero no suman goles ni entran en los récords de partido ni de arqueros.
CREATE OR REPLACE FUNCTION public.season_summary(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH se AS (
    SELECT s.* FROM seasons s WHERE s.id = season_summary.p ->> 'id' AND NOT s.active
  ),
  tours AS (
    SELECT t.* FROM tournaments t JOIN se ON se.id = t.season_id
  ),
  played AS (
    SELECT m.* FROM matches m JOIN tours t ON t.id = m.tournament_id
    WHERE m.status = 'PLAYED'::match_status AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL
  ),
  cards AS (
    SELECT mc.* FROM match_cards mc JOIN played m ON m.id = mc.match_id
  ),
  -- La vista tiene una columna «p»: aquí no se usa el parámetro, pero se suma por club entre torneos
  standings AS (
    SELECT s.club_id, sum(s.pj)::int AS pj, sum(s.gf)::int AS gf, sum(s.gc)::int AS gc
    FROM tournament_standings s JOIN tours t ON t.id = s.tournament_id
    GROUP BY s.club_id
  ),
  club_cards AS (
    SELECT st.club_id, st.pj,
      count(c.id) FILTER (WHERE c.color = 'YELLOW'::card_color)::int AS yellow,
      count(c.id) FILTER (WHERE c.color = 'RED'::card_color)::int AS red
    FROM standings st LEFT JOIN cards c ON c.club_id = st.club_id
    GROUP BY st.club_id, st.pj
  ),
  scorers AS (
    SELECT sc.player_id, sc.club_id, max(sc.player_name) AS player_name,
      sum(sc.goals)::int AS goals, sum(sc.assists)::int AS assists
    FROM tournament_scorers sc JOIN tours t ON t.id = sc.tournament_id
    GROUP BY sc.player_id, sc.club_id
  ),
  mvps AS (
    SELECT r.mvp_id AS player_id, r.club_id, count(*)::int AS n
    FROM match_club_reports r JOIN played m ON m.id = r.match_id
    WHERE r.mvp_id IS NOT NULL
    GROUP BY r.mvp_id, r.club_id
  ),
  keepers AS (
    SELECT g.player_id, g.club_id, count(*)::int AS matches, sum(g.conceded)::int AS conceded, sum(g.saves)::int AS saves
    FROM match_goalkeepers g JOIN played m ON m.id = g.match_id
    WHERE NOT m.walkover
    GROUP BY g.player_id, g.club_id
    HAVING count(*) >= 3
  )
  SELECT jsonb_build_object('season', (
    SELECT jsonb_build_object(
      'id', se.id, 'name', se.name, 'startDate', to_jsonb(se.start_date), 'endDate', to_jsonb(se.end_date),
      'tournaments', (
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', t.id, 'name', t.name, 'prize', t.prize,
          'category', CASE WHEN ca.id IS NULL THEN NULL ELSE jsonb_build_object('name', ca.name) END,
          'podium', (
            SELECT coalesce(jsonb_agg(jsonb_build_object('place', po.place,
              'club', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = po.club_id))
              ORDER BY po.place), '[]'::jsonb)
            FROM tournament_podium po WHERE po.tournament_id = t.id))
          ORDER BY ca.sort_order NULLS LAST, t.start_date NULLS LAST, t.name, t.id), '[]'::jsonb)
        FROM tours t LEFT JOIN categories ca ON ca.id = t.category_id),
      'totals', (
        SELECT jsonb_build_object(
          'tournaments', (SELECT count(*) FROM tours),
          'clubs', (SELECT count(DISTINCT tc.club_id) FROM tournament_clubs tc JOIN tours t ON t.id = tc.tournament_id),
          'matches', count(*),
          'goals', coalesce(sum(m.home_score + m.away_score) FILTER (WHERE NOT m.walkover), 0),
          'walkovers', count(*) FILTER (WHERE m.walkover),
          'shootouts', count(*) FILTER (WHERE m.penalties_home IS NOT NULL AND m.penalties_away IS NOT NULL),
          'yellowCards', (SELECT count(*) FROM cards c WHERE c.color = 'YELLOW'::card_color),
          'redCards', (SELECT count(*) FROM cards c WHERE c.color = 'RED'::card_color))
        FROM played m),
      'awards', jsonb_build_object(
        'scorers', (
          SELECT coalesce(jsonb_agg(x.row ORDER BY x.ord), '[]'::jsonb) FROM (
            SELECT row_number() OVER (ORDER BY sc.goals DESC, sc.assists DESC, sc.player_name) AS ord,
              jsonb_build_object('playerName', sc.player_name, 'value', sc.goals,
                'player', (SELECT jsonb_build_object('id', pl.id, 'imageUrl', pl.image_url) FROM players pl WHERE pl.id = sc.player_id),
                'club', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = sc.club_id)) AS row
            FROM scorers sc WHERE sc.goals > 0
            ORDER BY ord LIMIT 3) x),
        'assists', (
          SELECT coalesce(jsonb_agg(x.row ORDER BY x.ord), '[]'::jsonb) FROM (
            SELECT row_number() OVER (ORDER BY sc.assists DESC, sc.goals DESC, sc.player_name) AS ord,
              jsonb_build_object('playerName', sc.player_name, 'value', sc.assists,
                'player', (SELECT jsonb_build_object('id', pl.id, 'imageUrl', pl.image_url) FROM players pl WHERE pl.id = sc.player_id),
                'club', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = sc.club_id)) AS row
            FROM scorers sc WHERE sc.assists > 0
            ORDER BY ord LIMIT 3) x),
        'mvps', (
          SELECT coalesce(jsonb_agg(x.row ORDER BY x.ord), '[]'::jsonb) FROM (
            SELECT row_number() OVER (ORDER BY mv.n DESC, pl.name, pl.id) AS ord,
              jsonb_build_object('playerName', pl.name, 'value', mv.n,
                'player', jsonb_build_object('id', pl.id, 'imageUrl', pl.image_url),
                'club', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = mv.club_id)) AS row
            FROM mvps mv JOIN players pl ON pl.id = mv.player_id
            ORDER BY ord LIMIT 3) x),
        'keepers', (
          SELECT coalesce(jsonb_agg(x.row ORDER BY x.ord), '[]'::jsonb) FROM (
            SELECT row_number() OVER (ORDER BY k.conceded::numeric / k.matches, k.saves DESC, k.matches DESC, pl.name, pl.id) AS ord,
              jsonb_build_object('playerName', pl.name, 'matches', k.matches, 'conceded', k.conceded, 'saves', k.saves,
                'player', jsonb_build_object('id', pl.id, 'imageUrl', pl.image_url),
                'club', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = k.club_id)) AS row
            FROM keepers k JOIN players pl ON pl.id = k.player_id
            ORDER BY ord LIMIT 3) x)),
      'records', jsonb_build_object(
        'biggestWin', (
          SELECT jsonb_build_object('id', m.id, 'matchDate', to_jsonb(m.match_date),
            'homeScore', m.home_score, 'awayScore', m.away_score,
            'tournament', (SELECT jsonb_build_object('name', t.name) FROM tours t WHERE t.id = m.tournament_id),
            'homeClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.home_club_id),
            'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.away_club_id))
          FROM played m WHERE NOT m.walkover AND m.home_score <> m.away_score
          ORDER BY abs(m.home_score - m.away_score) DESC, m.home_score + m.away_score DESC, m.match_date NULLS LAST, m.id
          LIMIT 1),
        'highestScoring', (
          SELECT jsonb_build_object('id', m.id, 'matchDate', to_jsonb(m.match_date),
            'homeScore', m.home_score, 'awayScore', m.away_score,
            'tournament', (SELECT jsonb_build_object('name', t.name) FROM tours t WHERE t.id = m.tournament_id),
            'homeClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.home_club_id),
            'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url) FROM clubs c WHERE c.id = m.away_club_id))
          FROM played m WHERE NOT m.walkover AND m.home_score + m.away_score > 0
          ORDER BY m.home_score + m.away_score DESC, abs(m.home_score - m.away_score), m.match_date NULLS LAST, m.id
          LIMIT 1),
        'topAttack', (
          SELECT jsonb_build_object('matches', s.pj, 'goals', s.gf,
            'club', jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url))
          FROM standings s JOIN clubs c ON c.id = s.club_id
          WHERE s.gf > 0
          ORDER BY s.gf DESC, s.pj, c.name, c.id
          LIMIT 1),
        'bestDefense', (
          SELECT jsonb_build_object('matches', s.pj, 'conceded', s.gc,
            'club', jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url))
          FROM standings s JOIN clubs c ON c.id = s.club_id
          WHERE s.pj >= 3
          ORDER BY s.gc::numeric / s.pj, s.pj DESC, c.name, c.id
          LIMIT 1),
        'fairPlay', (
          SELECT jsonb_build_object('matches', k.pj, 'yellow', k.yellow, 'red', k.red,
            'club', jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url))
          FROM club_cards k JOIN clubs c ON c.id = k.club_id
          WHERE k.pj >= 3
          ORDER BY (k.yellow + 3 * k.red)::numeric / k.pj, k.pj DESC, c.name, c.id
          LIMIT 1),
        'mostCards', (
          SELECT jsonb_build_object('matches', k.pj, 'yellow', k.yellow, 'red', k.red,
            'club', jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url))
          FROM club_cards k JOIN clubs c ON c.id = k.club_id
          WHERE k.yellow + k.red > 0
          ORDER BY k.yellow + 3 * k.red DESC, k.red DESC, c.name, c.id
          LIMIT 1)))
    FROM se))
$$;
CALL api_expose('season_summary', 'PUBLIC');

-- ---------- Jugadores ----------

-- Ficha pública de un jugador (se comparte por enlace): clubes donde está o estuvo y sus números por temporada,
-- torneo y club. Trae la edad, nunca la fecha de nacimiento.
-- Solo cuentan partidos oficiales jugados (PLAYED con marcador) que no sean walkover; los amistosos del club no entran.
-- Partido jugado: aparece por ese club como convocado, en la alineación, con gol, asistencia, tarjeta o MVP (lo mismo
-- que match_player_refs, pero por club). Goles y asistencias siguen a tournament_scorers (sin goles en contra); el gol
-- en contra se cuenta en el club contrario al acreditado (match_goals.club_id es el club que suma el gol). MVP: solo
-- el que eligió el club, como season_summary. Los clubes borrados no salen en clubs_on_player pero sus números se
-- conservan (club.slug null). status: ACTIVE, INACTIVE (de baja) o FORMER (eliminado del club).
CREATE OR REPLACE FUNCTION public.player_profile(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH pl AS (
    SELECT * FROM players WHERE id = player_profile.p ->> 'id'
  ),
  facts AS (
    SELECT g.match_id, g.club_id, 1 AS goals, 0 AS assists, g.is_penalty::int AS penalties, 0 AS own_goals,
      0 AS yellow, 0 AS red, 0 AS mvps
    FROM match_goals g JOIN pl ON pl.id = g.scorer_id WHERE NOT g.is_own_goal
    UNION ALL
    SELECT g.match_id, g.club_id, 0, 1, 0, 0, 0, 0, 0
    FROM match_goals g JOIN pl ON pl.id = g.assist_id WHERE NOT g.is_own_goal
    UNION ALL
    SELECT g.match_id, CASE WHEN g.club_id = m.home_club_id THEN m.away_club_id ELSE m.home_club_id END,
      0, 0, 0, 1, 0, 0, 0
    FROM match_goals g JOIN pl ON pl.id = g.scorer_id JOIN matches m ON m.id = g.match_id WHERE g.is_own_goal
    UNION ALL
    SELECT k.match_id, k.club_id, 0, 0, 0, 0, (k.color = 'YELLOW'::card_color)::int, (k.color = 'RED'::card_color)::int, 0
    FROM match_cards k JOIN pl ON pl.id = k.player_id
    UNION ALL
    SELECT r.match_id, r.club_id, 0, 0, 0, 0, 0, 0, 1
    FROM match_club_reports r JOIN pl ON pl.id = r.mvp_id
    UNION ALL
    SELECT a.match_id, a.club_id, 0, 0, 0, 0, 0, 0, 0
    FROM match_attendees a JOIN pl ON pl.id = a.player_id
    UNION ALL
    SELECT r.match_id, r.club_id, 0, 0, 0, 0, 0, 0, 0
    FROM match_club_reports r CROSS JOIN pl
    WHERE jsonb_typeof(r.lineup -> 'positions') = 'object'
      AND EXISTS (SELECT 1 FROM jsonb_each_text(r.lineup -> 'positions') AS pos WHERE pos.value = pl.id)
  ),
  pf AS (
    SELECT f.*, m.tournament_id FROM facts f JOIN matches m ON m.id = f.match_id
    WHERE m.status = 'PLAYED'::match_status AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL
      AND NOT m.walkover
  ),
  lines AS (
    SELECT pf.tournament_id, pf.club_id, count(DISTINCT pf.match_id)::int AS matches,
      sum(pf.goals)::int AS goals, sum(pf.assists)::int AS assists, sum(pf.penalties)::int AS penalties,
      sum(pf.own_goals)::int AS own_goals, sum(pf.yellow)::int AS yellow, sum(pf.red)::int AS red,
      sum(pf.mvps)::int AS mvps
    FROM pf GROUP BY pf.tournament_id, pf.club_id
  )
  SELECT jsonb_build_object('player', (
    SELECT jsonb_build_object(
      'id', pl.id, 'name', pl.name, 'imageUrl', pl.image_url,
      'age', CASE WHEN pl.birth_date IS NULL THEN NULL
        ELSE date_part('year', age(CURRENT_DATE, pl.birth_date))::int END,
      'clubs_on_player', (
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url,
          'shirtNumber', cp.shirt_number, 'position', cp.position, 'isCoach', cp.is_coach,
          'status', st.status, 'since', api_ts(cp.created_at))
          ORDER BY st.ord, c.name, c.id), '[]'::jsonb)
        FROM club_players cp JOIN clubs c ON c.id = cp.club_id
        CROSS JOIN LATERAL (SELECT
          CASE WHEN cp.deleted_at IS NOT NULL THEN 'FORMER' WHEN NOT cp.active THEN 'INACTIVE' ELSE 'ACTIVE' END AS status,
          CASE WHEN cp.deleted_at IS NOT NULL THEN 3 WHEN NOT cp.active THEN 2 ELSE 1 END AS ord) st
        WHERE cp.player_id = pl.id AND c.deleted_at IS NULL),
      'totals', (
        SELECT jsonb_build_object(
          'matches', count(DISTINCT pf.match_id), 'goals', coalesce(sum(pf.goals), 0),
          'assists', coalesce(sum(pf.assists), 0), 'penalties', coalesce(sum(pf.penalties), 0),
          'ownGoals', coalesce(sum(pf.own_goals), 0), 'yellowCards', coalesce(sum(pf.yellow), 0),
          'redCards', coalesce(sum(pf.red), 0), 'mvps', coalesce(sum(pf.mvps), 0))
        FROM pf),
      'statLines', (
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'season', jsonb_build_object('id', s.id, 'name', s.name, 'active', s.active,
            'startDate', to_jsonb(s.start_date)),
          'tournament', jsonb_build_object('id', t.id, 'name', t.name, 'status', to_jsonb(t.status),
            'category', CASE WHEN ca.id IS NULL THEN NULL ELSE jsonb_build_object('name', ca.name) END),
          'club', jsonb_build_object('id', c.id, 'name', c.name,
            'slug', CASE WHEN c.deleted_at IS NULL THEN c.slug END, 'logoUrl', c.logo_url),
          'matches', l.matches, 'goals', l.goals, 'assists', l.assists, 'penalties', l.penalties,
          'ownGoals', l.own_goals, 'yellowCards', l.yellow, 'redCards', l.red, 'mvps', l.mvps)
          ORDER BY s.start_date DESC NULLS LAST, s.name, s.id, t.start_date DESC NULLS LAST, t.name, t.id,
            c.name, c.id), '[]'::jsonb)
        FROM lines l
        JOIN tournaments t ON t.id = l.tournament_id
        JOIN seasons s ON s.id = t.season_id
        LEFT JOIN categories ca ON ca.id = t.category_id
        JOIN clubs c ON c.id = l.club_id))
    FROM pl))
$$;
CALL api_expose('player_profile', 'PUBLIC');

-- ---------- Canchas ----------

CREATE OR REPLACE FUNCTION public.courts_page(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'platformSettings', (SELECT jsonb_build_object('courtsEnabled', s.courts_enabled, 'courtSlotMinutes', s.court_slot_minutes,
      'whatsapp', s.whatsapp) FROM platform_settings s WHERE s.id = 'config'),
    'courtOpenWindows', (SELECT coalesce(jsonb_agg(jsonb_build_object('weekday', w.weekday, 'startTime', w.start_time,
      'endTime', w.end_time) ORDER BY w.weekday, w.start_time), '[]'::jsonb) FROM court_open_windows w),
    'courts', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'description', c.description,
      'location', c.location, 'hourlyRate', c.hourly_rate, 'imageUrl', c.image_url) ORDER BY c.sort_order, c.name, c.id), '[]'::jsonb)
      FROM courts c WHERE c.active),
    'courtHolds', (SELECT coalesce(jsonb_agg(jsonb_build_object('startTime', h.start_time, 'endTime', h.end_time,
      'court', jsonb_build_object('id', h.court_id)) ORDER BY h.start_time, h.id), '[]'::jsonb)
      FROM court_holds h WHERE h.hold_date = (p ->> 'date')::date)
  )
$$;
CALL api_expose('courts_page', 'PUBLIC');

CREATE OR REPLACE FUNCTION public.court_busy_on_date(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH s AS (SELECT require_uid() AS uid)
  SELECT jsonb_build_object('courtHolds', (
    SELECT coalesce(jsonb_agg(jsonb_build_object('startTime', h.start_time, 'endTime', h.end_time,
      'court', jsonb_build_object('id', h.court_id),
      'match', CASE WHEN h.match_id IS NULL THEN NULL ELSE jsonb_build_object('id', h.match_id) END)
      ORDER BY h.start_time, h.id), '[]'::jsonb)
    FROM court_holds h, s WHERE h.hold_date = (p ->> 'date')::date))
$$;
CALL api_expose('court_busy_on_date', 'USER');

-- ---------- Página del club ----------

-- Pública, pero finanzas, inventario y miembros solo se devuelven a quien tiene rol en el club (o es superadmin).
CREATE OR REPLACE FUNCTION public.club_screen(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH target AS (
    SELECT c.*, has_club_role(c.id, ARRAY['ADMIN', 'DT', 'TESORERO', 'PRENSA']) AS insider
    FROM clubs c WHERE c.slug = p ->> 'slug' AND c.deleted_at IS NULL LIMIT 1
  )
  SELECT jsonb_build_object(
    'clubs', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'slug', c.slug, 'name', c.name, 'description', c.description, 'location', c.location,
        'presidentPhone', c.president_phone, 'logoUrl', c.logo_url, 'active', c.active, 'disabledReason', c.disabled_reason,
        'locality', (SELECT jsonb_build_object('id', l.id, 'name', l.name) FROM localities l WHERE l.id = c.locality_id),
        'clubHeroImages_on_club', (SELECT coalesce(jsonb_agg(jsonb_build_object('url', h.url) ORDER BY h.position), '[]'::jsonb)
          FROM club_hero_images h WHERE h.club_id = c.id),
        'clubDefaultLineups_on_club', (SELECT coalesce(jsonb_agg(jsonb_build_object('mode', d.mode, 'formation', d.formation,
          'positions', d.positions)), '[]'::jsonb) FROM club_default_lineups d WHERE d.club_id = c.id),
        -- otherClubs_on_player: sus otros clubes actuales (0010), para avisar que nombre, foto y nacimiento se comparten
        'players_on_club', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', pl.id, 'name', pl.name, 'shirtNumber', cp.shirt_number,
          'position', cp.position, 'variant', cp.variant, 'birthDate', to_jsonb(pl.birth_date), 'imageUrl', pl.image_url,
          'isCoach', cp.is_coach, 'active', cp.active, 'deletedAt', api_ts(cp.deleted_at),
          'otherClubs_on_player', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name, 'slug', o.slug) ORDER BY o.name), '[]'::jsonb)
            FROM club_players ocp JOIN clubs o ON o.id = ocp.club_id
            WHERE ocp.player_id = pl.id AND ocp.club_id <> c.id AND ocp.deleted_at IS NULL AND o.deleted_at IS NULL)
          ) ORDER BY pl.name, pl.id), '[]'::jsonb)
          FROM club_players cp JOIN players pl ON pl.id = cp.player_id WHERE cp.club_id = c.id),
        'clubEvents_on_club', (SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', e.id, 'eventType', to_jsonb(e.event_type), 'matchType', to_jsonb(e.match_type), 'title', e.title,
          'eventDate', to_jsonb(e.event_date), 'eventTime', e.event_time, 'location', e.location, 'routine', e.routine,
          'lineup', e.lineup, 'scoreOurs', e.score_ours, 'scoreTheirs', e.score_theirs,
          'penaltiesOurs', e.penalties_ours, 'penaltiesTheirs', e.penalties_theirs,
          'mvp', CASE WHEN e.mvp_id IS NULL THEN NULL ELSE jsonb_build_object('id', e.mvp_id) END,
          'clubEventAttendees_on_event', (SELECT coalesce(jsonb_agg(jsonb_build_object('rawLabel', a.raw_label,
            'player', CASE WHEN a.player_id IS NULL THEN NULL ELSE jsonb_build_object('id', a.player_id) END)), '[]'::jsonb)
            FROM (SELECT * FROM club_event_attendees a WHERE a.event_id = e.id LIMIT 200) a),
          'clubEventPhotos_on_event', (SELECT coalesce(jsonb_agg(jsonb_build_object('url', ph.url) ORDER BY ph.position), '[]'::jsonb)
            FROM (SELECT * FROM club_event_photos ph WHERE ph.event_id = e.id ORDER BY ph.position LIMIT 100) ph),
          'clubEventGoals_on_event', (SELECT coalesce(jsonb_agg(jsonb_build_object('isPenalty', g.is_penalty, 'isOwnGoal', g.is_own_goal,
            'scorer', CASE WHEN g.scorer_id IS NULL THEN NULL ELSE jsonb_build_object('id', g.scorer_id) END,
            'assist', CASE WHEN g.assist_id IS NULL THEN NULL ELSE jsonb_build_object('id', g.assist_id) END) ORDER BY g.sort_order), '[]'::jsonb)
            FROM (SELECT * FROM club_event_goals g WHERE g.event_id = e.id ORDER BY g.sort_order LIMIT 50) g),
          'clubEventCards_on_event', (SELECT coalesce(jsonb_agg(jsonb_build_object('color', to_jsonb(k.color),
            'player', CASE WHEN k.player_id IS NULL THEN NULL ELSE jsonb_build_object('id', k.player_id) END)), '[]'::jsonb)
            FROM (SELECT * FROM club_event_cards k WHERE k.event_id = e.id LIMIT 80) k),
          'clubEventGoalkeepers_on_event', (SELECT coalesce(jsonb_agg(jsonb_build_object('conceded', gk.conceded, 'saves', gk.saves,
            'player', jsonb_build_object('id', gk.player_id))), '[]'::jsonb)
            FROM (SELECT * FROM club_event_goalkeepers gk WHERE gk.event_id = e.id LIMIT 20) gk)
          ) ORDER BY e.event_date DESC, e.event_time DESC, e.id), '[]'::jsonb)
          FROM club_events e WHERE e.club_id = c.id),
        'transactions_on_club', CASE WHEN NOT c.insider THEN '[]'::jsonb ELSE (
          SELECT coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'type', to_jsonb(t.type), 'description', t.description,
            'category', t.category, 'amount', t.amount, 'txnDate', to_jsonb(t.txn_date), 'source', to_jsonb(t.source),
            'player', CASE WHEN t.player_id IS NULL THEN NULL ELSE jsonb_build_object('id', t.player_id) END)
            ORDER BY t.txn_date DESC, t.created_at DESC, t.id), '[]'::jsonb)
          FROM transactions t WHERE t.club_id = c.id) END,
        'financialGoals_on_club', CASE WHEN NOT c.insider THEN '[]'::jsonb ELSE (
          SELECT coalesce(jsonb_agg(jsonb_build_object('id', fg.id, 'title', fg.title, 'amount', fg.amount,
            'quotaPerPlayer', fg.quota_per_player, 'status', to_jsonb(fg.status), 'createdAt', api_ts(fg.created_at),
            'goalContributions_on_goal', (SELECT coalesce(jsonb_agg(jsonb_build_object('amount', gc.amount,
              'player', jsonb_build_object('id', gc.player_id))), '[]'::jsonb) FROM goal_contributions gc WHERE gc.goal_id = fg.id))
            ORDER BY fg.created_at, fg.id), '[]'::jsonb)
          FROM financial_goals fg WHERE fg.club_id = c.id) END,
        'inventoryItems_on_club', CASE WHEN NOT c.insider THEN '[]'::jsonb ELSE (
          SELECT coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'quantity', i.quantity,
            'condition', to_jsonb(i.condition)) ORDER BY i.name, i.id), '[]'::jsonb)
          FROM inventory_items i WHERE i.club_id = c.id) END,
        'albums_on_club', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', al.id, 'name', al.name,
          'galleryPhotos_on_album', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', gp.id, 'url', gp.url, 'caption', gp.caption,
            'sortOrder', gp.sort_order, 'takenAt', api_ts(gp.taken_at)) ORDER BY gp.sort_order), '[]'::jsonb)
            FROM gallery_photos gp WHERE gp.album_id = al.id)) ORDER BY al.name, al.id), '[]'::jsonb)
          FROM albums al WHERE al.club_id = c.id),
        'clubAvailabilityWindows_on_club', (SELECT coalesce(jsonb_agg(jsonb_build_object('weekday', w.weekday,
          'startTime', w.start_time, 'endTime', w.end_time) ORDER BY w.weekday, w.start_time), '[]'::jsonb)
          FROM club_availability_windows w WHERE w.club_id = c.id),
        'clubMembers_on_club', CASE WHEN NOT c.insider THEN '[]'::jsonb ELSE (
          SELECT coalesce(jsonb_agg(jsonb_build_object('role', to_jsonb(m.role), 'user', jsonb_build_object('id', m.user_id))), '[]'::jsonb)
          FROM club_members m WHERE m.club_id = c.id) END
      )), '[]'::jsonb)
      FROM target c),
    'seasons', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'active', s.active,
      'startDate', to_jsonb(s.start_date)) ORDER BY s.start_date DESC NULLS LAST, s.id), '[]'::jsonb) FROM seasons s),
    'categories', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'sortOrder', c.sort_order)
      ORDER BY c.sort_order, c.id), '[]'::jsonb) FROM categories c),
    'tournaments', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'status', to_jsonb(t.status),
      'legs', t.legs, 'footballType', to_jsonb(t.football_type),
      'season', jsonb_build_object('id', t.season_id), 'category', jsonb_build_object('id', t.category_id),
      'tournamentPodiums_on_tournament', (SELECT coalesce(jsonb_agg(jsonb_build_object('place', po.place,
        'club', jsonb_build_object('id', po.club_id)) ORDER BY po.place), '[]'::jsonb) FROM tournament_podium po WHERE po.tournament_id = t.id))
      ORDER BY t.created_at, t.id), '[]'::jsonb) FROM tournaments t),
    'matches', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', m.id, 'roundLabel', m.round_label, 'matchDate', to_jsonb(m.match_date), 'startTime', m.start_time, 'venue', m.venue,
      'status', to_jsonb(m.status), 'homeScore', m.home_score, 'awayScore', m.away_score, 'walkover', m.walkover, 'noShow', to_jsonb(m.no_show),
      'homeClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name) FROM clubs c WHERE c.id = m.home_club_id),
      'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name) FROM clubs c WHERE c.id = m.away_club_id),
      'tournament', (SELECT jsonb_build_object('id', t.id, 'name', t.name, 'season', jsonb_build_object('id', t.season_id),
        'category', jsonb_build_object('id', t.category_id)) FROM tournaments t WHERE t.id = m.tournament_id),
      'matchClubReports_on_match', (SELECT coalesce(jsonb_agg(jsonb_build_object('lineup', r.lineup,
        'club', jsonb_build_object('id', r.club_id),
        'mvp', CASE WHEN r.mvp_id IS NULL THEN NULL ELSE jsonb_build_object('id', r.mvp_id) END)), '[]'::jsonb)
        FROM match_club_reports r WHERE r.match_id = m.id),
      'matchAttendees_on_match', (SELECT coalesce(jsonb_agg(jsonb_build_object('club', jsonb_build_object('id', a.club_id),
        'player', jsonb_build_object('id', a.player_id))), '[]'::jsonb) FROM (SELECT * FROM match_attendees a WHERE a.match_id = m.id LIMIT 80) a),
      'matchGoals_on_match', (SELECT coalesce(jsonb_agg(jsonb_build_object('club', jsonb_build_object('id', g.club_id),
        'scorer', CASE WHEN g.scorer_id IS NULL THEN NULL ELSE jsonb_build_object('id', g.scorer_id) END,
        'assist', CASE WHEN g.assist_id IS NULL THEN NULL ELSE jsonb_build_object('id', g.assist_id) END,
        'isPenalty', g.is_penalty, 'isOwnGoal', g.is_own_goal) ORDER BY g.sort_order), '[]'::jsonb)
        FROM (SELECT * FROM match_goals g WHERE g.match_id = m.id ORDER BY g.sort_order LIMIT 40) g),
      'matchCards_on_match', (SELECT coalesce(jsonb_agg(jsonb_build_object('club', jsonb_build_object('id', k.club_id),
        'color', to_jsonb(k.color),
        'player', CASE WHEN k.player_id IS NULL THEN NULL ELSE jsonb_build_object('id', k.player_id) END)), '[]'::jsonb)
        FROM (SELECT * FROM match_cards k WHERE k.match_id = m.id LIMIT 40) k))
      ORDER BY m.match_date NULLS LAST, m.id), '[]'::jsonb)
      FROM matches m
      WHERE EXISTS (SELECT 1 FROM target c WHERE c.id IN (m.home_club_id, m.away_club_id)))
  )
$$;
CALL api_expose('club_screen', 'PUBLIC');

-- ---------- Sesión y permisos ----------

-- Solo responde por la propia sesión (o para cualquier id si quien pregunta es superadmin)
CREATE OR REPLACE FUNCTION public.platform_admin_by_id(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH s AS (SELECT require_uid() AS uid)
  SELECT jsonb_build_object('platformAdmin', (
    SELECT jsonb_build_object('email', a.email)
    FROM platform_admins a, s
    WHERE a.user_id = p ->> 'id' AND (a.user_id = s.uid OR is_platform_admin())))
$$;
CALL api_expose('platform_admin_by_id', 'USER');

-- Lista de superadmins e invitaciones. Quien no es superadmin solo sabe si la lista está vacía
-- (AuthContext lo usa para ofrecer reclamar la plataforma): recibe una fila sin datos si hay alguno.
CREATE OR REPLACE FUNCTION public.admin_admins(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH s AS (SELECT require_uid() AS uid, is_platform_admin() AS admin)
  SELECT CASE WHEN s.admin THEN jsonb_build_object(
      'platformAdmins', (SELECT coalesce(jsonb_agg(jsonb_build_object('email', a.email,
        'user', (SELECT jsonb_build_object('id', u.id, 'displayName', u.display_name) FROM users u WHERE u.id = a.user_id))
        ORDER BY a.email), '[]'::jsonb) FROM platform_admins a),
      'platformAdminInvites', (SELECT coalesce(jsonb_agg(jsonb_build_object('emailKey', i.email_key, 'email', i.email)
        ORDER BY i.email), '[]'::jsonb) FROM platform_admin_invites i))
    ELSE jsonb_build_object(
      'platformAdmins', CASE WHEN EXISTS (SELECT 1 FROM platform_admins)
        THEN jsonb_build_array(jsonb_build_object('email', '', 'user', jsonb_build_object('id', '', 'displayName', '')))
        ELSE '[]'::jsonb END,
      'platformAdminInvites', '[]'::jsonb)
    END
  FROM s
$$;
CALL api_expose('admin_admins', 'USER');

CREATE OR REPLACE FUNCTION public.my_spaces(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH s AS (SELECT require_uid() AS uid)
  SELECT jsonb_build_object('clubMembers', (
    SELECT coalesce(jsonb_agg(jsonb_build_object('role', to_jsonb(m.role),
      'club', jsonb_build_object('id', c.id, 'slug', c.slug, 'name', c.name, 'logoUrl', c.logo_url)) ORDER BY c.name), '[]'::jsonb)
    FROM club_members m JOIN clubs c ON c.id = m.club_id, s
    WHERE m.user_id = s.uid AND c.deleted_at IS NULL))
$$;
CALL api_expose('my_spaces', 'USER');

-- El userId del cliente se ignora: siempre los clubes de la sesión
CREATE OR REPLACE FUNCTION public.my_memberships(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH s AS (SELECT require_uid() AS uid)
  SELECT jsonb_build_object('clubMembers', (
    SELECT coalesce(jsonb_agg(jsonb_build_object('role', to_jsonb(m.role), 'email', m.email,
      'club', jsonb_build_object('id', c.id, 'slug', c.slug, 'name', c.name, 'logoUrl', c.logo_url)) ORDER BY c.name), '[]'::jsonb)
    FROM club_members m JOIN clubs c ON c.id = m.club_id, s
    WHERE m.user_id = s.uid AND c.deleted_at IS NULL))
$$;
CALL api_expose('my_memberships', 'USER');

-- Invitaciones pendientes del correo de la sesión (el emailKey del cliente debe coincidir con él)
CREATE OR REPLACE FUNCTION public.my_open_club_invites(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH s AS (SELECT require_uid() AS uid, email_key(session_email()) AS key)
  SELECT jsonb_build_object('clubInvites', (
    SELECT coalesce(jsonb_agg(jsonb_build_object('token', i.token, 'role', to_jsonb(i.role),
      'club', jsonb_build_object('id', c.id, 'slug', c.slug, 'name', c.name, 'logoUrl', c.logo_url)) ORDER BY c.name), '[]'::jsonb)
    FROM club_invites i JOIN clubs c ON c.id = i.club_id, s
    WHERE i.email_key = s.key AND i.email_key = p ->> 'emailKey' AND i.kind <> 'ACCEPT' AND c.deleted_at IS NULL))
$$;
CALL api_expose('my_open_club_invites', 'USER');

-- El registro comprueba si ese correo fue invitado
CREATE OR REPLACE FUNCTION public.signup_invite_by_email(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('signupInvite', (
    SELECT jsonb_build_object('email', i.email, 'platform', i.platform,
      'club', CASE WHEN i.club_id IS NULL THEN NULL ELSE jsonb_build_object('id', i.club_id) END)
    FROM signup_invites i WHERE i.email_key = p ->> 'emailKey'))
$$;
CALL api_expose('signup_invite_by_email', 'PUBLIC');

-- La invitación se abre con el enlace que incluye el token
CREATE OR REPLACE FUNCTION public.club_invite_lookup(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('clubInvites', (
    SELECT coalesce(jsonb_agg(jsonb_build_object('email', i.email, 'role', to_jsonb(i.role), 'kind', to_jsonb(i.kind),
      'token', i.token, 'club', jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug))), '[]'::jsonb)
    FROM club_invites i JOIN clubs c ON c.id = i.club_id
    WHERE i.club_id = p ->> 'clubId' AND i.email_key = p ->> 'emailKey' AND i.token = p ->> 'token'
      AND p ->> 'token' IS NOT NULL AND p ->> 'token' <> ''))
$$;
CALL api_expose('club_invite_lookup', 'PUBLIC');

-- Perfil de la sesión en public.users (el trigger de auth.users ya lo crea; aquí se actualiza el nombre)
CREATE OR REPLACE FUNCTION public.ensure_my_profile(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_email text := session_email();
  v_name text := left(btrim(coalesce(p ->> 'displayName', '')), 160);
BEGIN
  IF v_email = '' THEN
    v_email := lower(btrim(coalesce(p ->> 'email', '')));
  END IF;
  INSERT INTO users (id, email, display_name, updated_at)
  VALUES (v_uid, v_email, v_name, now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = CASE WHEN EXCLUDED.display_name <> '' THEN EXCLUDED.display_name ELSE users.display_name END,
    updated_at = now();
  RETURN jsonb_build_object('user_upsert', jsonb_build_object('id', v_uid));
END
$$;
CALL api_expose('ensure_my_profile', 'USER');

-- Primer usuario: se convierte en superadministrador si nadie lo ha reclamado.
-- Devuelve admin si la sesión es superadmin tras el intento (el trigger de registro ya pudo hacerlo).
CREATE OR REPLACE FUNCTION public.bootstrap_platform_admin(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_email text := session_email();
  v_name text := left(btrim(coalesce(p ->> 'displayName', '')), 160);
  v_admin jsonb;
BEGIN
  IF v_email = '' THEN
    v_email := lower(btrim(coalesce(p ->> 'email', '')));
  END IF;
  INSERT INTO users (id, email, display_name, updated_at)
  VALUES (v_uid, v_email, v_name, now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = CASE WHEN EXCLUDED.display_name <> '' THEN EXCLUDED.display_name ELSE users.display_name END,
    updated_at = now();

  IF NOT EXISTS (SELECT 1 FROM platform_admins) THEN
    INSERT INTO platform_admins (user_id, email) VALUES (v_uid, v_email);
  END IF;

  SELECT jsonb_build_object('userId', a.user_id) INTO v_admin FROM platform_admins a WHERE a.user_id = v_uid;
  RETURN jsonb_build_object('user_upsert', jsonb_build_object('id', v_uid), 'admin', v_admin);
END
$$;
CALL api_expose('bootstrap_platform_admin', 'USER');

-- Acepta una invitación de superadmin: debe ser del correo de la sesión
CREATE OR REPLACE FUNCTION public.claim_platform_admin_invite(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_key text := p ->> 'emailKey';
  v_invite platform_admin_invites%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM platform_admin_invites WHERE email_key = v_key;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ensured', NULL, 'admin', NULL, 'droppedSignup', NULL, 'droppedInvite', NULL);
  END IF;
  IF lower(v_invite.email) <> session_email() THEN
    RAISE EXCEPTION 'La sesión no es del correo invitado.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO users (id, email, display_name, updated_at)
  VALUES (v_uid, lower(v_invite.email), '', now())
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now();

  INSERT INTO platform_admins (user_id, email)
  VALUES (v_uid, v_invite.email)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

  DELETE FROM signup_invites WHERE email_key = v_key;
  DELETE FROM platform_admin_invites WHERE email_key = v_key;

  RETURN jsonb_build_object('ensured', NULL, 'admin', jsonb_build_object('id', v_uid),
    'droppedSignup', NULL, 'droppedInvite', NULL);
END
$$;
CALL api_expose('claim_platform_admin_invite', 'USER');

-- Acepta una invitación de club con el token del enlace; debe ser del correo de la sesión
CREATE OR REPLACE FUNCTION public.accept_club_invite(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_key text := p ->> 'emailKey';
  v_token text := p ->> 'token';
  v_name text := left(btrim(coalesce(p ->> 'displayName', '')), 160);
  v_invite club_invites%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM club_invites WHERE club_id = v_club AND email_key = v_key;
  IF FOUND AND lower(v_invite.email) <> session_email() THEN
    RAISE EXCEPTION 'La sesión no es del correo invitado.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT FOUND OR v_token IS NULL OR v_token = '' OR v_invite.token IS DISTINCT FROM v_token THEN
    RETURN jsonb_build_object('ensured', NULL, 'member', NULL, 'droppedSignup', NULL, 'droppedInvite', NULL);
  END IF;

  INSERT INTO users (id, email, display_name, updated_at)
  VALUES (v_uid, lower(v_invite.email), v_name, now())
  ON CONFLICT (id) DO UPDATE SET
    display_name = CASE WHEN EXCLUDED.display_name <> '' THEN EXCLUDED.display_name ELSE users.display_name END,
    updated_at = now();

  INSERT INTO club_members (club_id, user_id, email, display_name, role, joined_at)
  VALUES (v_club, v_uid, v_invite.email, v_name, v_invite.role, now())
  ON CONFLICT (club_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  DELETE FROM signup_invites WHERE email_key = v_key;
  DELETE FROM club_invites WHERE club_id = v_club AND email_key = v_key;

  RETURN jsonb_build_object('ensured', NULL, 'member', jsonb_build_object('id', v_uid),
    'droppedSignup', NULL, 'droppedInvite', NULL);
END
$$;
CALL api_expose('accept_club_invite', 'USER');

-- Rechazar solo funciona con el token del enlace
CREATE OR REPLACE FUNCTION public.decline_club_invite(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_club text := p ->> 'clubId';
  v_key text := p ->> 'emailKey';
  v_token text := p ->> 'token';
  v_deleted text;
BEGIN
  IF v_token IS NULL OR v_token = '' THEN
    RETURN jsonb_build_object('droppedSignup', NULL, 'invite', NULL);
  END IF;
  DELETE FROM signup_invites
  WHERE email_key = v_key
    AND EXISTS (SELECT 1 FROM club_invites WHERE club_id = v_club AND email_key = v_key AND token = v_token);
  DELETE FROM club_invites WHERE club_id = v_club AND email_key = v_key AND token = v_token
  RETURNING email_key INTO v_deleted;
  RETURN jsonb_build_object('droppedSignup', NULL,
    'invite', CASE WHEN v_deleted IS NULL THEN NULL ELSE jsonb_build_object('id', v_deleted) END);
END
$$;
CALL api_expose('decline_club_invite', 'PUBLIC');

-- ---------- Formularios públicos ----------

-- Cualquiera puede escribir. El mensaje queda como nuevo. Mismas reglas que src/shared/textLimits.ts.
CREATE OR REPLACE FUNCTION public.submit_inquiry(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_name text := btrim(coalesce(p ->> 'name', ''));
  v_email text := btrim(coalesce(p ->> 'email', ''));
  v_phone text := btrim(coalesce(p ->> 'phone', ''));
  v_topic text := btrim(coalesce(p ->> 'topic', ''));
  v_message text := btrim(regexp_replace(coalesce(p ->> 'message', ''), ' {2,}', ' ', 'g'));
  v_id text;
BEGIN
  INSERT INTO inquiries (id, name, email, phone, topic, message, status, created_at)
  SELECT p ->> 'id', initcap(v_name), lower(v_email), v_phone, v_topic, v_message, 'NEW', now()
  WHERE p ->> 'id' IS NOT NULL
    AND char_length(v_name) BETWEEN 3 AND 40
    AND v_name ~ '^([A-Za-zÀ-ÖØ-öø-ÿ]+)( [A-Za-zÀ-ÖØ-öø-ÿ]+)*$'
    AND char_length(v_email) BETWEEN 6 AND 100
    AND v_email = lower(v_email)
    AND v_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[a-z]{2,}$'
    AND v_phone ~ '^\+?[0-9]{10,15}$'
    AND v_topic IN ('Torneos', 'Renta de canchas', 'Disponibilidad')
    AND char_length(v_message) BETWEEN 10 AND 200
    AND v_message ~ '^[A-Za-z0-9À-ÖØ-öø-ÿ,.?¿!¡'' \n-]+$'
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('inquiry', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('submit_inquiry', 'PUBLIC');

-- Cualquiera puede solicitar un equipo. La solicitud queda pendiente.
CREATE OR REPLACE FUNCTION public.submit_team_application(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_captain text := coalesce(p ->> 'captainName', '');
  v_email text := coalesce(p ->> 'captainEmail', '');
  v_phone text := coalesce(p ->> 'captainPhone', '');
  v_team text := btrim(coalesce(p ->> 'teamName', ''));
  v_id text;
BEGIN
  INSERT INTO team_applications (id, captain_name, captain_email, captain_phone, team_name, status, created_at)
  -- El nombre se guarda en Title Case (initcap), como create_club, y con su misma regla
  SELECT p ->> 'id', v_captain, v_email, v_phone, initcap(v_team), 'PENDING', now()
  WHERE p ->> 'id' IS NOT NULL
    AND char_length(v_captain) BETWEEN 3 AND 40
    AND v_captain ~ '^([A-Za-zÀ-ÖØ-öø-ÿ]+)( [A-Za-zÀ-ÖØ-öø-ÿ]+)*$'
    AND char_length(v_email) BETWEEN 6 AND 100
    AND v_email = lower(v_email)
    AND v_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[a-z]{2,}$'
    AND v_phone ~ '^\+?[0-9]{10,15}$'
    AND char_length(v_team) BETWEEN 3 AND 30
    AND v_team ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.-]+)*$'
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('application', CASE WHEN v_id IS NULL THEN NULL ELSE jsonb_build_object('id', v_id) END);
END
$$;
CALL api_expose('submit_team_application', 'PUBLIC');

RESET ROLE;
