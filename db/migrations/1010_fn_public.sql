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
      SELECT coalesce(jsonb_agg(jsonb_build_object('clubs', st.clubs, 'players', st.players, 'courts', st.courts)), '[]'::jsonb)
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
        'players_on_club', (SELECT coalesce(jsonb_agg(pj ORDER BY name, id), '[]'::jsonb) FROM (
          SELECT pl.name, pl.id, jsonb_build_object('id', pl.id, 'name', pl.name, 'shirtNumber', pl.shirt_number,
            'position', pl.position, 'imageUrl', pl.image_url, 'isCoach', pl.is_coach) AS pj
          FROM players pl WHERE pl.club_id = c.id AND pl.active ORDER BY pl.name, pl.id LIMIT 80) s))
        FROM clubs c WHERE c.id = m.home_club_id),
      'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'logoUrl', c.logo_url,
        'players_on_club', (SELECT coalesce(jsonb_agg(pj ORDER BY name, id), '[]'::jsonb) FROM (
          SELECT pl.name, pl.id, jsonb_build_object('id', pl.id, 'name', pl.name, 'shirtNumber', pl.shirt_number,
            'position', pl.position, 'imageUrl', pl.image_url, 'isCoach', pl.is_coach) AS pj
          FROM players pl WHERE pl.club_id = c.id AND pl.active ORDER BY pl.name, pl.id LIMIT 80) s))
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
      'homeClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name,
        'players_on_club', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', pl.id, 'name', pl.name) ORDER BY pl.name, pl.id), '[]'::jsonb)
          FROM players pl WHERE pl.club_id = c.id AND pl.active))
        FROM clubs c WHERE c.id = m.home_club_id),
      'awayClub', (SELECT jsonb_build_object('id', c.id, 'name', c.name,
        'players_on_club', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', pl.id, 'name', pl.name) ORDER BY pl.name, pl.id), '[]'::jsonb)
          FROM players pl WHERE pl.club_id = c.id AND pl.active))
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
        'players_on_club', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', pl.id, 'name', pl.name, 'shirtNumber', pl.shirt_number,
          'position', pl.position, 'variant', pl.variant, 'birthDate', to_jsonb(pl.birth_date), 'imageUrl', pl.image_url,
          'isCoach', pl.is_coach, 'active', pl.active) ORDER BY pl.name, pl.id), '[]'::jsonb)
          FROM players pl WHERE pl.club_id = c.id),
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
