-- Funciones RPC del espacio del club (antes club.gql, parte de mutations.gql y SaveClubProfile de league.gql).
-- Todas son @auth USER: las escriben los miembros del club (o el superadmin).
--
-- Convenciones (ver 1010_fn_public.sql y CLAUDE.md):
-- - Una función por operación: nombre_en_snake(p jsonb) RETURNS jsonb, SECURITY DEFINER,
--   SET search_path = public, pg_temp. Devuelve una clave por cada paso con el alias del .gql.
-- - Permisos: nunca se confía en un userId del cliente. require_uid() exige sesión (42501) y
--   has_club_role(club, roles) sustituye al «platform_admins OR club_members ... role IN (...)» del original,
--   con los mismos roles. Un permiso denegado o una validación fallida devuelve la clave con null
--   (savedRow() lo detecta en el cliente).
-- - Pasos _executeReturningFirst -> objeto con las columnas del RETURNING original (o null si no afectó filas).
-- - Pasos _execute -> número de filas afectadas, o null si no afectó ninguna. Data Connect devolvía un Int
--   y el cliente llama savedRow(data.deleted) en los borrados; con null fijo todos los borrados fallarían,
--   y con 0 un permiso denegado pasaría como éxito. «null si no afectó filas» cubre ambos casos.
-- - Las listas que llegan como Any se leen con api_list(): array tal cual, [] si falta, es null o no es array.
-- - Todos los pasos de una mutación van en la misma función (atómica): si uno falla, no queda nada a medias.
SET ROLE postgres;

-- Normaliza un parámetro «Any» que debe ser una lista JSON
CREATE OR REPLACE FUNCTION public.api_list(p_value jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN jsonb_typeof(p_value) = 'array' THEN p_value ELSE '[]'::jsonb END
$$;

-- Resultado de un paso _execute: filas afectadas, o null si ninguna
CREATE OR REPLACE FUNCTION public.api_rows(p_n integer)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_n > 0 THEN to_jsonb(p_n) ELSE NULL END
$$;

-- true si todas las variables obligatorias (las «String!» del .gql) vienen y no son null.
-- Data Connect las rechazaba antes de llegar al SQL; aquí la función devuelve null en vez de fallar.
CREATE OR REPLACE FUNCTION public.api_required(p jsonb, p_keys text[])
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(bool_and(p ? k AND jsonb_typeof(p -> k) <> 'null'), true) FROM unnest(p_keys) AS k
$$;

-- Texto de formulario como lo deja el cliente: sin espacios al borde ni dobles. Las reglas de cada
-- campo repiten las de src/shared/textLimits.ts para que editar el HTML no sirva de nada.
CREATE OR REPLACE FUNCTION public.api_clean_text(p_value text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT btrim(regexp_replace(coalesce(p_value, ''), ' {2,}', ' ', 'g'))
$$;

-- Primera letra en mayúscula, el resto tal cual (capitalizeFirst en el cliente)
CREATE OR REPLACE FUNCTION public.api_capitalize_first(p_value text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT upper(left(p_value, 1)) || substr(p_value, 2)
$$;

-- ---------- Agenda: eventos del club ----------

-- Crea o actualiza un evento (ADMIN o DT). location y routine llegan dentro de detail.
-- Título y lugar: letras, números, guiones y puntos, 3 a 30 (eventText en el cliente).
-- La fecha no puede ser pasada (un día de margen por la zona horaria), salvo al editar sin cambiarla.
CREATE OR REPLACE FUNCTION public.save_club_event(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_title text := api_clean_text(p ->> 'title');
  v_location text := api_clean_text(p -> 'detail' ->> 'location');
  v_time text := p ->> 'eventTime';
  v_date date;
  v_row jsonb;
BEGIN
  IF NOT api_required(p, ARRAY['id', 'clubId', 'eventType', 'title', 'eventDate', 'eventTime'])
     OR char_length(v_title) NOT BETWEEN 3 AND 30
     OR v_title !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ.-]+( [A-Za-z0-9À-ÖØ-öø-ÿ.-]+)*$'
     OR (v_location <> '' AND (char_length(v_location) NOT BETWEEN 3 AND 30
       OR v_location !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ.-]+( [A-Za-z0-9À-ÖØ-öø-ÿ.-]+)*$'))
     OR v_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     OR p ->> 'eventDate' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
    RETURN jsonb_build_object('event', NULL);
  END IF;
  v_date := (p ->> 'eventDate')::date;
  IF v_date < CURRENT_DATE - 1
     AND NOT EXISTS (SELECT 1 FROM club_events WHERE id = p ->> 'id' AND club_id = v_club AND event_date = v_date) THEN
    RETURN jsonb_build_object('event', NULL);
  END IF;
  INSERT INTO club_events (
    id, club_id, event_type, match_type, title,
    event_date, event_time, location, routine, created_at
  )
  SELECT
    p ->> 'id', v_club, (p ->> 'eventType')::event_type, NULLIF(p ->> 'matchType', '')::friendly_match_type, v_title,
    v_date, v_time, v_location, p -> 'detail' -> 'routine', CURRENT_TIMESTAMP
  WHERE has_club_role(v_club, ARRAY['ADMIN', 'DT'])
  ON CONFLICT (id) DO UPDATE SET
    event_type = EXCLUDED.event_type,
    match_type = EXCLUDED.match_type,
    title = EXCLUDED.title,
    event_date = EXCLUDED.event_date,
    event_time = EXCLUDED.event_time,
    location = EXCLUDED.location,
    routine = EXCLUDED.routine
  WHERE club_events.club_id = EXCLUDED.club_id
  RETURNING jsonb_build_object('id', id, 'title', title) INTO v_row;
  RETURN jsonb_build_object('event', v_row);
END
$$;
CALL api_expose('save_club_event', 'USER');

-- Borra un evento con todo lo que cuelga de él (ADMIN o DT del club del evento)
CREATE OR REPLACE FUNCTION public.delete_club_event(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_club text := p ->> 'clubId';
  v_n integer := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM club_events e WHERE e.id = v_id AND e.club_id = v_club)
     AND has_club_role(v_club, ARRAY['ADMIN', 'DT']) THEN
    DELETE FROM club_event_attendees WHERE event_id = v_id;
    DELETE FROM club_event_goals WHERE event_id = v_id;
    DELETE FROM club_event_cards WHERE event_id = v_id;
    DELETE FROM club_event_goalkeepers WHERE event_id = v_id;
    DELETE FROM club_event_photos WHERE event_id = v_id;
    DELETE FROM club_events WHERE id = v_id;
    GET DIAGNOSTICS v_n = ROW_COUNT;
  END IF;
  RETURN jsonb_build_object('deleted', api_rows(v_n));
END
$$;
CALL api_expose('delete_club_event', 'USER');

-- Marcador de un amistoso (ADMIN o DT)
CREATE OR REPLACE FUNCTION public.set_club_event_score(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_row jsonb;
BEGIN
  UPDATE club_events
  SET score_ours = (p ->> 'scoreOurs')::int,
      score_theirs = (p ->> 'scoreTheirs')::int,
      penalties_ours = (p ->> 'penaltiesOurs')::int,
      penalties_theirs = (p ->> 'penaltiesTheirs')::int
  WHERE id = p ->> 'id'
    AND club_id = v_club
    AND has_club_role(v_club, ARRAY['ADMIN', 'DT'])
  RETURNING jsonb_build_object('id', id) INTO v_row;
  RETURN jsonb_build_object('event', v_row);
END
$$;
CALL api_expose('set_club_event_score', 'USER');

-- Alineación de un evento (ADMIN o DT)
CREATE OR REPLACE FUNCTION public.set_club_event_lineup(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_row jsonb;
BEGIN
  UPDATE club_events
  SET lineup = p -> 'lineup'
  WHERE id = p ->> 'id'
    AND club_id = v_club
    AND has_club_role(v_club, ARRAY['ADMIN', 'DT'])
  RETURNING jsonb_build_object('id', id) INTO v_row;
  RETURN jsonb_build_object('event', v_row);
END
$$;
CALL api_expose('set_club_event_lineup', 'USER');

-- Alineación por defecto del club para un modo (ADMIN o DT)
CREATE OR REPLACE FUNCTION public.save_club_default_lineup(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_row jsonb;
BEGIN
  IF NOT api_required(p, ARRAY['clubId', 'mode']) THEN
    RETURN jsonb_build_object('lineup', NULL);
  END IF;
  INSERT INTO club_default_lineups (club_id, mode, formation, positions)
  SELECT v_club, p ->> 'mode', COALESCE(p -> 'lineup' ->> 'formation', ''), p -> 'lineup'
  WHERE has_club_role(v_club, ARRAY['ADMIN', 'DT'])
  ON CONFLICT (club_id, mode) DO UPDATE
  SET formation = EXCLUDED.formation,
      positions = EXCLUDED.positions
  RETURNING jsonb_build_object('club_id', club_id, 'mode', mode) INTO v_row;
  RETURN jsonb_build_object('lineup', v_row);
END
$$;
CALL api_expose('save_club_default_lineup', 'USER');

-- Sustituye la asistencia de un evento (ADMIN o DT). Las etiquetas que coinciden con un id de
-- jugador del club se enlazan; el resto se guarda como texto libre.
-- Acepta jugadores eliminados (borrado lógico) a propósito: volver a guardar un evento viejo no borra su historial.
CREATE OR REPLACE FUNCTION public.replace_club_event_attendees(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_club text := p ->> 'clubId';
  v_labels jsonb := api_list(p -> 'labels');
  v_cleared integer := 0;
  v_added integer := 0;
  v_row jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM club_events e WHERE e.id = v_id AND e.club_id = v_club)
     AND has_club_role(v_club, ARRAY['ADMIN', 'DT']) THEN
    DELETE FROM club_event_attendees WHERE event_id = v_id;
    GET DIAGNOSTICS v_cleared = ROW_COUNT;
    INSERT INTO club_event_attendees (event_id, player_id, raw_label)
    SELECT v_id,
      (SELECT pl.id FROM players pl WHERE pl.id = elem AND pl.club_id = v_club),
      elem
    FROM jsonb_array_elements_text(v_labels) AS elem
    WHERE elem <> '';
    GET DIAGNOSTICS v_added = ROW_COUNT;
    v_row := jsonb_build_object('event_id', v_id);
  END IF;
  RETURN jsonb_build_object('cleared', api_rows(v_cleared), 'added', api_rows(v_added), 'event', v_row);
END
$$;
CALL api_expose('replace_club_event_attendees', 'USER');

-- Sustituye las fotos de un evento, en el orden recibido (ADMIN o DT)
CREATE OR REPLACE FUNCTION public.replace_club_event_album(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_club text := p ->> 'clubId';
  v_urls jsonb := api_list(p -> 'urls');
  v_cleared integer := 0;
  v_added integer := 0;
  v_row jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM club_events e WHERE e.id = v_id AND e.club_id = v_club)
     AND has_club_role(v_club, ARRAY['ADMIN', 'DT']) THEN
    DELETE FROM club_event_photos WHERE event_id = v_id;
    GET DIAGNOSTICS v_cleared = ROW_COUNT;
    INSERT INTO club_event_photos (event_id, position, url)
    SELECT v_id, (ord - 1)::int, url
    FROM jsonb_array_elements_text(v_urls) WITH ORDINALITY AS photo(url, ord)
    WHERE url <> '';
    GET DIAGNOSTICS v_added = ROW_COUNT;
    v_row := jsonb_build_object('event_id', v_id);
  END IF;
  RETURN jsonb_build_object('cleared', api_rows(v_cleared), 'added', api_rows(v_added), 'event', v_row);
END
$$;
CALL api_expose('replace_club_event_album', 'USER');

-- Sustituye goles, tarjetas, porteros y MVP de un amistoso (ADMIN o DT).
-- Solo se enlazan jugadores del propio club; el resto se ignora (goles) o se descarta (tarjetas/porteros).
-- Acepta jugadores eliminados (borrado lógico) a propósito: volver a guardar un evento viejo no borra su historial.
CREATE OR REPLACE FUNCTION public.replace_club_event_stats(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_club text := p ->> 'clubId';
  v_stats jsonb := CASE WHEN jsonb_typeof(p -> 'stats') = 'object' THEN p -> 'stats' ELSE '{}'::jsonb END;
  v_cleared integer := 0;
  v_added integer := 0;
  v_n integer;
  v_row jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM club_events e WHERE e.id = v_id AND e.club_id = v_club)
     AND has_club_role(v_club, ARRAY['ADMIN', 'DT']) THEN
    -- cleared
    DELETE FROM club_event_goals WHERE event_id = v_id;
    GET DIAGNOSTICS v_n = ROW_COUNT; v_cleared := v_cleared + v_n;
    DELETE FROM club_event_cards WHERE event_id = v_id;
    GET DIAGNOSTICS v_n = ROW_COUNT; v_cleared := v_cleared + v_n;
    DELETE FROM club_event_goalkeepers WHERE event_id = v_id;
    GET DIAGNOSTICS v_n = ROW_COUNT; v_cleared := v_cleared + v_n;

    -- added
    INSERT INTO club_event_goals (event_id, sort_order, scorer_id, assist_id, is_penalty, is_own_goal)
    SELECT v_id,
      (ord - 1)::int,
      (SELECT pl.id FROM players pl WHERE pl.id = goal ->> 'scorer' AND pl.club_id = v_club),
      (SELECT pl.id FROM players pl WHERE pl.id = goal ->> 'assist' AND pl.club_id = v_club),
      COALESCE((goal ->> 'isPenalty')::boolean, false),
      COALESCE((goal ->> 'isOwnGoal')::boolean, false)
    FROM jsonb_array_elements(api_list(v_stats -> 'goals')) WITH ORDINALITY AS g(goal, ord);
    GET DIAGNOSTICS v_n = ROW_COUNT; v_added := v_added + v_n;

    INSERT INTO club_event_cards (event_id, player_id, color)
    SELECT v_id, pl.id, 'YELLOW'::card_color
    FROM jsonb_array_elements_text(api_list(v_stats -> 'yellowCards')) AS card(pid)
    JOIN players pl ON pl.id = card.pid AND pl.club_id = v_club;
    GET DIAGNOSTICS v_n = ROW_COUNT; v_added := v_added + v_n;

    INSERT INTO club_event_cards (event_id, player_id, color)
    SELECT v_id, pl.id, 'RED'::card_color
    FROM jsonb_array_elements_text(api_list(v_stats -> 'redCards')) AS card(pid)
    JOIN players pl ON pl.id = card.pid AND pl.club_id = v_club;
    GET DIAGNOSTICS v_n = ROW_COUNT; v_added := v_added + v_n;

    INSERT INTO club_event_goalkeepers (event_id, player_id, conceded, saves)
    SELECT v_id, pl.id, COALESCE((gk ->> 'conceded')::int, 0), COALESCE((gk ->> 'saves')::int, 0)
    FROM jsonb_array_elements(api_list(v_stats -> 'goalkeepers')) AS k(gk)
    JOIN players pl ON pl.id = gk ->> 'id' AND pl.club_id = v_club;
    GET DIAGNOSTICS v_n = ROW_COUNT; v_added := v_added + v_n;

    -- event: MVP (solo si es jugador del club)
    UPDATE club_events e
    SET mvp_id = (SELECT pl.id FROM players pl WHERE pl.id = v_stats ->> 'mvp' AND pl.club_id = v_club)
    WHERE e.id = v_id
    RETURNING jsonb_build_object('id', e.id) INTO v_row;
  END IF;
  RETURN jsonb_build_object('cleared', api_rows(v_cleared), 'added', api_rows(v_added), 'event', v_row);
END
$$;
CALL api_expose('replace_club_event_stats', 'USER');

-- ---------- Agenda: partidos oficiales ----------

-- Alineación del club en un partido oficial en el que participa (ADMIN o DT). «mvpId» (opcional) nombra al
-- jugador del partido por el club: tiene que ser de su plantilla; si no viene, se conserva el guardado.
-- Acepta jugadores eliminados (borrado lógico) a propósito: volver a guardar un evento viejo no borra su historial.
CREATE OR REPLACE FUNCTION public.set_match_club_lineup(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_mvp text := NULLIF(coalesce(p ->> 'mvpId', ''), '');
  v_row jsonb;
BEGIN
  IF v_mvp IS NOT NULL AND NOT EXISTS (SELECT 1 FROM players WHERE id = v_mvp AND club_id = v_club) THEN
    RETURN jsonb_build_object('report', NULL);
  END IF;
  INSERT INTO match_club_reports (match_id, club_id, lineup, mvp_id)
  SELECT m.id, v_club, p -> 'lineup', v_mvp
  FROM matches m
  WHERE m.id = p ->> 'matchId'
    AND (m.home_club_id = v_club OR m.away_club_id = v_club)
    AND has_club_role(v_club, ARRAY['ADMIN', 'DT'])
  ON CONFLICT (match_id, club_id) DO UPDATE
    SET lineup = EXCLUDED.lineup,
        mvp_id = CASE WHEN p ? 'mvpId' THEN EXCLUDED.mvp_id ELSE match_club_reports.mvp_id END
  RETURNING jsonb_build_object('match_id', match_id) INTO v_row;
  RETURN jsonb_build_object('report', v_row);
END
$$;
CALL api_expose('set_match_club_lineup', 'USER');

-- Sustituye los asistentes del club a un partido oficial (ADMIN o DT); solo jugadores del club
-- Acepta jugadores eliminados (borrado lógico) a propósito: volver a guardar un evento viejo no borra su historial.
CREATE OR REPLACE FUNCTION public.replace_match_attendees(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_match text := p ->> 'matchId';
  v_club text := p ->> 'clubId';
  v_labels jsonb := api_list(p -> 'labels');
  v_cleared integer := 0;
  v_added integer := 0;
  v_row jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM matches m WHERE m.id = v_match AND (m.home_club_id = v_club OR m.away_club_id = v_club))
     AND has_club_role(v_club, ARRAY['ADMIN', 'DT']) THEN
    DELETE FROM match_attendees WHERE match_id = v_match AND club_id = v_club;
    GET DIAGNOSTICS v_cleared = ROW_COUNT;
    INSERT INTO match_attendees (match_id, club_id, player_id, created_at)
    SELECT v_match, v_club, pl.id, CURRENT_TIMESTAMP
    FROM players pl
    WHERE pl.club_id = v_club
      AND pl.id IN (SELECT jsonb_array_elements_text(v_labels));
    GET DIAGNOSTICS v_added = ROW_COUNT;
    v_row := jsonb_build_object('match_id', v_match);
  END IF;
  RETURN jsonb_build_object('cleared', api_rows(v_cleared), 'added', api_rows(v_added), 'report', v_row);
END
$$;
CALL api_expose('replace_match_attendees', 'USER');

-- ---------- Plantilla ----------

-- Crea o actualiza un jugador (ADMIN o DT). variant, birthDate e imageUrl llegan dentro de detail.
-- Nombre: solo letras, 3 a 50, en Title Case. Dorsal 1-99. Variante: letras, hasta 30.
-- Nacimiento: opcional, desde 1940 y nunca futuro (un día de margen por la zona horaria).
CREATE OR REPLACE FUNCTION public.save_player(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_name text := api_clean_text(p ->> 'name');
  v_variant text := api_clean_text(p -> 'detail' ->> 'variant');
  v_birth text := coalesce(p -> 'detail' ->> 'birthDate', '');
  v_row jsonb;
BEGIN
  IF NOT api_required(p, ARRAY['id', 'clubId', 'name', 'shirtNumber', 'position'])
     OR char_length(v_name) NOT BETWEEN 3 AND 50
     OR v_name !~ '^[A-Za-zÀ-ÖØ-öø-ÿ]+( [A-Za-zÀ-ÖØ-öø-ÿ]+)*$'
     OR coalesce(p ->> 'shirtNumber', '') !~ '^[1-9][0-9]?$'
     OR p ->> 'position' NOT IN ('Portero', 'Defensa', 'Medio', 'Delantero')
     OR (v_variant <> '' AND (char_length(v_variant) > 30 OR v_variant !~ '^[A-Za-zÀ-ÖØ-öø-ÿ]+( [A-Za-zÀ-ÖØ-öø-ÿ]+)*$'))
     OR (v_birth <> '' AND v_birth !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$') THEN
    RETURN jsonb_build_object('player', NULL);
  END IF;
  -- El cast va aparte: dentro del mismo IF el planificador podría evaluarlo antes que el formato
  IF v_birth <> '' AND v_birth::date NOT BETWEEN DATE '1940-01-01' AND CURRENT_DATE + 1 THEN
    RETURN jsonb_build_object('player', NULL);
  END IF;
  INSERT INTO players (
    id, club_id, name, shirt_number, position, variant,
    birth_date, image_url, is_coach, active, created_at
  )
  SELECT p ->> 'id', v_club, initcap(v_name), p ->> 'shirtNumber', p ->> 'position',
    v_variant,
    NULLIF(v_birth, '')::date,
    COALESCE(p -> 'detail' ->> 'imageUrl', ''),
    COALESCE((p ->> 'isCoach')::boolean, false), COALESCE((p ->> 'active')::boolean, true), CURRENT_TIMESTAMP
  WHERE has_club_role(v_club, ARRAY['ADMIN', 'DT'])
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    shirt_number = EXCLUDED.shirt_number,
    position = EXCLUDED.position,
    variant = EXCLUDED.variant,
    birth_date = EXCLUDED.birth_date,
    image_url = EXCLUDED.image_url,
    is_coach = EXCLUDED.is_coach,
    active = EXCLUDED.active
  -- Un jugador eliminado no se revive ni se sobrescribe desde el formulario (se restaura por SQL)
  WHERE players.club_id = EXCLUDED.club_id AND players.deleted_at IS NULL
  RETURNING jsonb_build_object('id', id, 'name', name) INTO v_row;
  RETURN jsonb_build_object('player', v_row);
END
$$;
CALL api_expose('save_player', 'USER');

-- Elimina un jugador del club (ADMIN o DT) con borrado lógico (0008_jugadores_borrado_logico.sql): sale de la
-- plantilla y de los selectores, pero sus goles, tarjetas, asistencias, estadísticas y aportaciones se conservan.
-- Eliminarlo otra vez devuelve null.
CREATE OR REPLACE FUNCTION public.delete_player(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_n integer;
BEGIN
  UPDATE players
  SET deleted_at = now(), active = false
  WHERE id = p ->> 'id'
    AND club_id = v_club
    AND deleted_at IS NULL
    AND has_club_role(v_club, ARRAY['ADMIN', 'DT']);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('deleted', api_rows(v_n));
END
$$;
CALL api_expose('delete_player', 'USER');

-- ---------- Finanzas ----------

-- Registra un movimiento manual (ADMIN o TESORERO); el importe no puede ser negativo.
-- Concepto: letras, números y comas sueltas, 3 a 30 (financeText). Categoría: la lista del tipo
-- (CATEGORIAS_INGRESO / CATEGORIAS_GASTO en domains/finances/constants.ts).
CREATE OR REPLACE FUNCTION public.add_transaction(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_amount numeric := (p ->> 'amount')::numeric;
  v_description text := api_clean_text(p ->> 'description');
  v_row jsonb;
BEGIN
  IF NOT api_required(p, ARRAY['id', 'clubId', 'type', 'description', 'category', 'amount', 'txnDate'])
     OR char_length(v_description) NOT BETWEEN 3 AND 30
     OR v_description !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ][A-Za-z0-9À-ÖØ-öø-ÿ,]*( [A-Za-z0-9À-ÖØ-öø-ÿ,]+)*$'
     OR v_description ~ ',,'
     OR v_amount > 99999999.99
     OR NOT (
       (p ->> 'type' = 'INGRESO' AND p ->> 'category' IN ('Cuotas', 'Ventas', 'Patrocinio', 'Otro'))
       OR (p ->> 'type' = 'GASTO' AND p ->> 'category' IN ('Equipo/Balones', 'Canchas', 'Arbitraje', 'Bebidas/Comida', 'Botiquín', 'Otro'))
     ) THEN
    RETURN jsonb_build_object('transaction', NULL);
  END IF;
  INSERT INTO transactions (id, club_id, type, description, category, amount, txn_date, source, created_at)
  SELECT p ->> 'id', v_club, (p ->> 'type')::transaction_type, v_description, p ->> 'category',
    v_amount, (p ->> 'txnDate')::date, 'MANUAL'::transaction_source, CURRENT_TIMESTAMP
  WHERE v_amount >= 0
    AND has_club_role(v_club, ARRAY['ADMIN', 'TESORERO'])
  RETURNING jsonb_build_object('id', id, 'amount', amount) INTO v_row;
  RETURN jsonb_build_object('transaction', v_row);
END
$$;
CALL api_expose('add_transaction', 'USER');

-- Borra un movimiento del club (ADMIN o TESORERO)
CREATE OR REPLACE FUNCTION public.delete_transaction(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_n integer;
BEGIN
  DELETE FROM transactions
  WHERE id = p ->> 'id'
    AND club_id = v_club
    AND has_club_role(v_club, ARRAY['ADMIN', 'TESORERO']);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('deleted', api_rows(v_n));
END
$$;
CALL api_expose('delete_transaction', 'USER');

-- Crea o actualiza una meta (ADMIN o TESORERO); importe y cuota no pueden ser negativos.
-- Título: letras, números y comas sueltas, 3 a 30 (financeText en el cliente).
CREATE OR REPLACE FUNCTION public.save_financial_goal(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_amount numeric := (p ->> 'amount')::numeric;
  v_quota numeric := (p ->> 'quotaPerPlayer')::numeric;
  v_title text := api_clean_text(p ->> 'title');
  v_row jsonb;
BEGIN
  IF NOT api_required(p, ARRAY['id', 'clubId', 'title', 'amount'])
     OR char_length(v_title) NOT BETWEEN 3 AND 30
     OR v_title !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ][A-Za-z0-9À-ÖØ-öø-ÿ,]*( [A-Za-z0-9À-ÖØ-öø-ÿ,]+)*$'
     OR v_title ~ ',,'
     OR v_amount > 99999999.99
     OR v_quota < 0 OR v_quota > 99999999.99 THEN
    RETURN jsonb_build_object('goal', NULL);
  END IF;
  INSERT INTO financial_goals (id, club_id, title, amount, quota_per_player, status, created_at)
  SELECT p ->> 'id', v_club, v_title, v_amount, v_quota, 'ACTIVE'::goal_status, CURRENT_TIMESTAMP
  WHERE v_amount >= 0
    AND has_club_role(v_club, ARRAY['ADMIN', 'TESORERO'])
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    amount = EXCLUDED.amount,
    quota_per_player = EXCLUDED.quota_per_player
  WHERE financial_goals.club_id = EXCLUDED.club_id
  RETURNING jsonb_build_object('id', id) INTO v_row;
  RETURN jsonb_build_object('goal', v_row);
END
$$;
CALL api_expose('save_financial_goal', 'USER');

-- Cambia el estado de una meta (ADMIN o TESORERO)
CREATE OR REPLACE FUNCTION public.set_financial_goal_status(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_row jsonb;
BEGIN
  UPDATE financial_goals
  SET status = (p ->> 'status')::goal_status
  WHERE id = p ->> 'id'
    AND club_id = v_club
    AND has_club_role(v_club, ARRAY['ADMIN', 'TESORERO'])
  RETURNING jsonb_build_object('id', id) INTO v_row;
  RETURN jsonb_build_object('goal', v_row);
END
$$;
CALL api_expose('set_financial_goal_status', 'USER');

-- Borra una meta con sus aportaciones (ADMIN o TESORERO)
CREATE OR REPLACE FUNCTION public.delete_financial_goal(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_club text := p ->> 'clubId';
  v_n integer := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM financial_goals g WHERE g.id = v_id AND g.club_id = v_club)
     AND has_club_role(v_club, ARRAY['ADMIN', 'TESORERO']) THEN
    DELETE FROM goal_contributions WHERE goal_id = v_id;
    DELETE FROM financial_goals WHERE id = v_id;
    GET DIAGNOSTICS v_n = ROW_COUNT;
  END IF;
  RETURN jsonb_build_object('deleted', api_rows(v_n));
END
$$;
CALL api_expose('delete_financial_goal', 'USER');

-- Fija la aportación de un jugador a una meta (ADMIN o TESORERO del club de la meta); no negativa.
-- El club se toma de la meta, no del cliente. El jugador tiene que ser de ese club y no estar eliminado: las
-- aportaciones de un eliminado quedan como historial.
CREATE OR REPLACE FUNCTION public.set_goal_contribution(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_amount numeric := (p ->> 'amount')::numeric;
  v_row jsonb;
BEGIN
  IF NOT api_required(p, ARRAY['goalId', 'playerId', 'amount']) THEN
    RETURN jsonb_build_object('contribution', NULL);
  END IF;
  INSERT INTO goal_contributions (goal_id, player_id, amount)
  SELECT g.id, p ->> 'playerId', v_amount
  FROM financial_goals g
  WHERE g.id = p ->> 'goalId'
    AND v_amount >= 0
    AND has_club_role(g.club_id, ARRAY['ADMIN', 'TESORERO'])
    AND EXISTS (SELECT 1 FROM players pl WHERE pl.id = p ->> 'playerId' AND pl.club_id = g.club_id AND pl.deleted_at IS NULL)
  ON CONFLICT (goal_id, player_id) DO UPDATE SET amount = EXCLUDED.amount
  RETURNING jsonb_build_object('goal_id', goal_id, 'player_id', player_id, 'amount', amount) INTO v_row;
  RETURN jsonb_build_object('contribution', v_row);
END
$$;
CALL api_expose('set_goal_contribution', 'USER');

-- ---------- Inventario ----------

-- Crea o actualiza un artículo (ADMIN, DT o TESORERO); la cantidad no puede ser negativa.
-- Nombre: letras y números con un espacio entre palabras, 2 a 20 (inventoryItemName en el cliente).
-- Un nombre que ya está en el inventario del club se acepta tal cual (cambiar cantidad o estado de un
-- artículo de antes de la regla).
CREATE OR REPLACE FUNCTION public.save_inventory_item(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_qty integer := (p ->> 'quantity')::int;
  v_name text := api_clean_text(p ->> 'name');
  v_row jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM inventory_items WHERE club_id = v_club AND name = p ->> 'name') THEN
    v_name := p ->> 'name';
  ELSIF char_length(v_name) NOT BETWEEN 2 AND 20
     OR v_name !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ]+( [A-Za-z0-9À-ÖØ-öø-ÿ]+)*$' THEN
    RETURN jsonb_build_object('item', NULL);
  END IF;
  IF NOT api_required(p, ARRAY['id', 'clubId', 'name', 'quantity', 'condition'])
     OR v_qty > 99999 THEN
    RETURN jsonb_build_object('item', NULL);
  END IF;
  INSERT INTO inventory_items (id, club_id, name, quantity, condition, created_at)
  SELECT p ->> 'id', v_club, v_name, v_qty, (p ->> 'condition')::inventory_condition, CURRENT_TIMESTAMP
  WHERE v_qty >= 0
    AND has_club_role(v_club, ARRAY['ADMIN', 'DT', 'TESORERO'])
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    quantity = EXCLUDED.quantity,
    condition = EXCLUDED.condition
  WHERE inventory_items.club_id = EXCLUDED.club_id
  RETURNING jsonb_build_object('id', id, 'name', name, 'quantity', quantity) INTO v_row;
  RETURN jsonb_build_object('item', v_row);
END
$$;
CALL api_expose('save_inventory_item', 'USER');

-- Borra un artículo del club (ADMIN, DT o TESORERO)
CREATE OR REPLACE FUNCTION public.delete_inventory_item(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_n integer;
BEGIN
  DELETE FROM inventory_items
  WHERE id = p ->> 'id'
    AND club_id = v_club
    AND has_club_role(v_club, ARRAY['ADMIN', 'DT', 'TESORERO']);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('deleted', api_rows(v_n));
END
$$;
CALL api_expose('delete_inventory_item', 'USER');

-- ---------- Galería ----------

-- Añade una foto a un álbum, creándolo si no existe (ADMIN o DT). La foto va al final del álbum.
-- Un álbum nuevo se llama con letras y números (un espacio entre palabras), 3 a 30 y mayúscula
-- inicial (albumName en el cliente); a uno que ya existe se le siguen añadiendo fotos aunque su
-- nombre sea de antes de la regla («📸 Galería General»).
CREATE OR REPLACE FUNCTION public.save_gallery_photo(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_album_name text := p ->> 'albumName';
  v_album integer := 0;
  v_row jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM albums WHERE club_id = v_club AND name = v_album_name) THEN
    v_album_name := api_capitalize_first(api_clean_text(v_album_name));
    IF char_length(v_album_name) NOT BETWEEN 3 AND 30
       OR v_album_name !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ]+( [A-Za-z0-9À-ÖØ-öø-ÿ]+)*$' THEN
      RETURN jsonb_build_object('album', NULL, 'photo', NULL);
    END IF;
  END IF;
  IF api_required(p, ARRAY['albumId', 'clubId', 'albumName', 'photoId', 'url', 'caption', 'takenAt'])
     AND has_club_role(v_club, ARRAY['ADMIN', 'DT']) THEN
    -- album
    INSERT INTO albums (id, club_id, name)
    VALUES (p ->> 'albumId', v_club, v_album_name)
    ON CONFLICT (club_id, name) DO UPDATE SET name = EXCLUDED.name;
    GET DIAGNOSTICS v_album = ROW_COUNT;
    -- photo
    INSERT INTO gallery_photos (id, album_id, url, caption, sort_order, taken_at)
    SELECT p ->> 'photoId', a.id, p ->> 'url', p ->> 'caption',
      COALESCE((SELECT MAX(sort_order) + 1 FROM gallery_photos WHERE album_id = a.id), 0),
      (p ->> 'takenAt')::timestamptz
    FROM albums a
    WHERE a.club_id = v_club AND a.name = v_album_name
    RETURNING jsonb_build_object('id', id) INTO v_row;
  END IF;
  RETURN jsonb_build_object('album', api_rows(v_album), 'photo', v_row);
END
$$;
CALL api_expose('save_gallery_photo', 'USER');

-- Intercambia orden y fecha de dos fotos de álbumes del club (ADMIN o DT).
-- gallery_photos tiene UNIQUE (album_id, sort_order), así que no se pueden cruzar en un solo UPDATE:
-- la primera pasa por un orden provisional (menor que cualquiera del álbum) y luego se cruzan.
CREATE OR REPLACE FUNCTION public.swap_gallery_photos(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_first text := p ->> 'firstId';
  v_second text := p ->> 'secondId';
  v_album1 text;
  v_order1 integer;
  v_taken1 timestamptz;
  v_order2 integer;
  v_taken2 timestamptz;
  v_free integer;
BEGIN
  IF v_first IS NULL OR v_second IS NULL OR v_first = v_second
     OR NOT has_club_role(v_club, ARRAY['ADMIN', 'DT']) THEN
    RETURN jsonb_build_object('swapped', NULL);
  END IF;
  -- Las dos fotos deben ser de álbumes del club
  SELECT p1.album_id, p1.sort_order, p1.taken_at, p2.sort_order, p2.taken_at
  INTO v_album1, v_order1, v_taken1, v_order2, v_taken2
  FROM gallery_photos p1
  JOIN albums a1 ON a1.id = p1.album_id AND a1.club_id = v_club
  JOIN gallery_photos p2 ON p2.id = v_second
  JOIN albums a2 ON a2.id = p2.album_id AND a2.club_id = v_club
  WHERE p1.id = v_first;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('swapped', NULL);
  END IF;
  SELECT min(sort_order) - 1 INTO v_free FROM gallery_photos WHERE album_id = v_album1;
  UPDATE gallery_photos SET sort_order = v_free WHERE id = v_first;
  UPDATE gallery_photos SET sort_order = v_order1, taken_at = v_taken1 WHERE id = v_second;
  UPDATE gallery_photos SET sort_order = v_order2, taken_at = v_taken2 WHERE id = v_first;
  RETURN jsonb_build_object('swapped', 2);
END
$$;
CALL api_expose('swap_gallery_photos', 'USER');

-- Convierte una foto en portada del álbum: pasa a ser la más reciente (ADMIN o DT)
CREATE OR REPLACE FUNCTION public.promote_gallery_photo(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_row jsonb;
BEGIN
  UPDATE gallery_photos AS photo
  SET taken_at = (
    SELECT MAX(sibling.taken_at) + interval '1 second'
    FROM gallery_photos sibling
    WHERE sibling.album_id = photo.album_id
  )
  WHERE photo.id = p ->> 'photoId'
    AND EXISTS (
      SELECT 1 FROM albums album
      WHERE album.id = photo.album_id
        AND album.club_id = v_club
        AND has_club_role(v_club, ARRAY['ADMIN', 'DT'])
    )
  RETURNING jsonb_build_object('id', photo.id) INTO v_row;
  RETURN jsonb_build_object('photo', v_row);
END
$$;
CALL api_expose('promote_gallery_photo', 'USER');

-- Borra una foto de un álbum del club (ADMIN o DT)
CREATE OR REPLACE FUNCTION public.delete_gallery_photo(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_n integer;
BEGIN
  DELETE FROM gallery_photos AS photo
  USING albums album
  WHERE photo.id = p ->> 'photoId'
    AND photo.album_id = album.id
    AND album.club_id = v_club
    AND has_club_role(v_club, ARRAY['ADMIN', 'DT']);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('deleted', api_rows(v_n));
END
$$;
CALL api_expose('delete_gallery_photo', 'USER');

-- Borra un álbum del club con sus fotos (ADMIN o DT)
CREATE OR REPLACE FUNCTION public.delete_gallery_album(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_album text;
  v_n integer := 0;
BEGIN
  IF has_club_role(v_club, ARRAY['ADMIN', 'DT']) THEN
    SELECT album.id INTO v_album FROM albums album WHERE album.club_id = v_club AND album.name = p ->> 'albumName';
    IF v_album IS NOT NULL THEN
      DELETE FROM gallery_photos WHERE album_id = v_album;
      DELETE FROM albums WHERE id = v_album;
      GET DIAGNOSTICS v_n = ROW_COUNT;
    END IF;
  END IF;
  RETURN jsonb_build_object('deleted', api_rows(v_n));
END
$$;
CALL api_expose('delete_gallery_album', 'USER');

-- ---------- Disponibilidad ----------

-- Vacía las franjas de disponibilidad del club (ADMIN o DT)
CREATE OR REPLACE FUNCTION public.clear_club_availability(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_n integer;
BEGIN
  DELETE FROM club_availability_windows AS slot
  WHERE slot.club_id = v_club
    AND has_club_role(v_club, ARRAY['ADMIN', 'DT']);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('cleared', api_rows(v_n));
END
$$;
CALL api_expose('clear_club_availability', 'USER');

-- Inserta franjas {day, start, end} (ADMIN o DT): día 1-7 y hora de inicio anterior a la de fin.
-- Devuelve la primera franja insertada; null si no se insertó ninguna.
CREATE OR REPLACE FUNCTION public.insert_club_availability(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_club text := p ->> 'clubId';
  v_windows jsonb := api_list(p -> 'windows');
  v_n integer;
BEGIN
  INSERT INTO club_availability_windows (id, club_id, weekday, start_time, end_time)
  SELECT gen_random_uuid(), v_club,
    (w ->> 'day')::int,
    w ->> 'start',
    w ->> 'end'
  FROM jsonb_array_elements(v_windows) AS w
  WHERE (w ->> 'day')::int BETWEEN 1 AND 7
    AND COALESCE(w ->> 'start', '') < COALESCE(w ->> 'end', '')
    AND has_club_role(v_club, ARRAY['ADMIN', 'DT']);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('window', CASE WHEN v_n > 0 THEN jsonb_build_object('club_id', v_club) ELSE NULL END);
END
$$;
CALL api_expose('insert_club_availability', 'USER');

-- ---------- Portada y perfil del club ----------

-- Nombre, descripción y ubicación de la portada (ADMIN o PRENSA). Si la ubicación deja de coincidir
-- con la localidad enlazada, se desenlaza.
-- Reglas de coverClubName, coverPlace y coverMotto en textLimits.ts: nombre con letras, números y
-- puntos (3 a 30); barrio con letras, números y una coma como mucho (3 a 30); lema libre de 1 a 100
-- sin caracteres de control. Nombre y barrio se guardan con mayúscula inicial.
CREATE OR REPLACE FUNCTION public.save_club_portada(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_name text := api_capitalize_first(api_clean_text(p ->> 'name'));
  v_location text := api_capitalize_first(api_clean_text(p ->> 'location'));
  v_description text := api_clean_text(p ->> 'description');
  v_row jsonb;
BEGIN
  IF NOT api_required(p, ARRAY['id', 'name', 'description', 'location'])
     OR char_length(v_name) NOT BETWEEN 3 AND 30
     OR v_name !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ.]+( [A-Za-z0-9À-ÖØ-öø-ÿ.]+)*$'
     OR char_length(v_location) NOT BETWEEN 3 AND 30
     OR v_location !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ]+( [A-Za-z0-9À-ÖØ-öø-ÿ]+)*(, ?[A-Za-z0-9À-ÖØ-öø-ÿ]+( [A-Za-z0-9À-ÖØ-öø-ÿ]+)*)?$'
     OR char_length(v_description) NOT BETWEEN 1 AND 100
     OR v_description ~ '[[:cntrl:]]' THEN
    RETURN jsonb_build_object('club', NULL);
  END IF;
  UPDATE clubs
  SET name = v_name,
      description = v_description,
      location = v_location,
      locality_id = CASE
        WHEN locality_id IS NOT NULL
         AND EXISTS (SELECT 1 FROM localities WHERE localities.id = clubs.locality_id AND localities.name = v_location)
        THEN locality_id
        ELSE NULL
      END
  WHERE id = v_id
    AND has_club_role(v_id, ARRAY['ADMIN', 'PRENSA'])
  RETURNING jsonb_build_object('id', id) INTO v_row;
  RETURN jsonb_build_object('club', v_row);
END
$$;
CALL api_expose('save_club_portada', 'USER');

-- Vacía las imágenes de portada del club (ADMIN o PRENSA)
CREATE OR REPLACE FUNCTION public.clear_club_heroes(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_n integer;
BEGIN
  DELETE FROM club_hero_images AS image
  WHERE image.club_id = v_id
    AND has_club_role(v_id, ARRAY['ADMIN', 'PRENSA']);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('cleared', api_rows(v_n));
END
$$;
CALL api_expose('clear_club_heroes', 'USER');

-- Inserta las imágenes de portada en el orden recibido (ADMIN o PRENSA); null si no se insertó ninguna
CREATE OR REPLACE FUNCTION public.insert_club_heroes(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_urls jsonb := api_list(p -> 'urls');
  v_n integer;
BEGIN
  INSERT INTO club_hero_images (id, club_id, position, url)
  SELECT gen_random_uuid(), v_id, (photo.ord - 1)::int, photo.url
  FROM jsonb_array_elements_text(v_urls) WITH ORDINALITY AS photo(url, ord)
  WHERE photo.url <> ''
    AND has_club_role(v_id, ARRAY['ADMIN', 'PRENSA']);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('hero', CASE WHEN v_n > 0 THEN jsonb_build_object('id', v_id) ELSE NULL END);
END
$$;
CALL api_expose('insert_club_heroes', 'USER');

-- Nombre, escudo y teléfono del presidente (solo ADMIN). Mismas reglas que create_club: nombre de 3 a 30
-- en Title Case (clubName/isClubName en textLimits.ts), teléfono de 10 a 15 dígitos y escudo con URL http(s).
CREATE OR REPLACE FUNCTION public.save_club_profile(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_id text := p ->> 'id';
  v_name text := btrim(coalesce(p ->> 'name', ''));
  v_logo text := btrim(coalesce(p ->> 'logoUrl', ''));
  v_phone text := btrim(coalesce(p ->> 'presidentPhone', ''));
  v_row jsonb;
BEGIN
  IF NOT api_required(p, ARRAY['id', 'name', 'logoUrl', 'presidentPhone']) THEN
    RETURN jsonb_build_object('club', NULL);
  END IF;
  UPDATE clubs
  SET name = initcap(v_name),
      logo_url = NULLIF(v_logo, ''),
      president_phone = v_phone
  WHERE id = v_id
    AND has_club_role(v_id, ARRAY['ADMIN'])
    AND char_length(v_name) BETWEEN 3 AND 30
    AND v_name ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.-]+)*$'
    AND (v_phone = '' OR v_phone ~ '^\+?[0-9]{10,15}$')
    AND (v_logo = '' OR (char_length(v_logo) <= 2000 AND v_logo ~ '^https?://[^[:space:]<>"'']+$'))
  RETURNING jsonb_build_object('id', id) INTO v_row;
  RETURN jsonb_build_object('club', v_row);
END
$$;
CALL api_expose('save_club_profile', 'USER');

RESET ROLE;
