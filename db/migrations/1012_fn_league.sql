-- Funciones RPC de la competición, el calendario y el marcador (antes dataconnect/connector/league.gql).
-- Todas son @auth USER y las escrituras son del superadmin: is_platform_admin() decide, nunca un userId
-- del cliente (el original confiaba en $userId en 13 mutaciones; aquí se ignora).
--
-- Convenciones (ver 1010_fn_public.sql y CLAUDE.md):
-- - Lecturas: SQL STABLE, forma exacta de <Op>Data (claves camelCase).
-- - Mutaciones: plpgsql; una clave por paso del .gql. Los pasos _execute devuelven null;
--   los _executeReturningFirst, el objeto del RETURNING o null si no afectó filas
--   (permiso denegado o validación fallida: savedRow() lo detecta).
SET ROLE postgres;

-- ---------- Lecturas ----------

-- Editor del torneo: ficha, clubes activos para elegir y todos sus partidos
CREATE OR REPLACE FUNCTION public.tournament_editor(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH s AS (SELECT require_uid() AS uid)
  SELECT jsonb_build_object(
    'tournaments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', t.id, 'name', t.name, 'legs', t.legs, 'footballType', to_jsonb(t.football_type),
        'durationMinutes', t.duration_minutes, 'startDate', to_jsonb(t.start_date), 'prize', t.prize,
        'season', (SELECT jsonb_build_object('id', se.id, 'startDate', to_jsonb(se.start_date), 'endDate', to_jsonb(se.end_date))
          FROM seasons se WHERE se.id = t.season_id),
        'category', (SELECT jsonb_build_object('name', c.name) FROM categories c WHERE c.id = t.category_id),
        'tournamentClubs_on_tournament', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('club', jsonb_build_object('id', tc.club_id)) ORDER BY tc.club_id), '[]'::jsonb)
          FROM tournament_clubs tc WHERE tc.tournament_id = t.id)
      )), '[]'::jsonb)
      FROM (SELECT t.* FROM tournaments t WHERE t.id = p ->> 'id' LIMIT 1) t),
    'clubs', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'active', c.active) ORDER BY c.name, c.id), '[]'::jsonb)
      FROM clubs c WHERE c.active),
    'matches', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id, 'status', to_jsonb(m.status), 'matchDate', to_jsonb(m.match_date), 'startTime', m.start_time,
        'homeScore', m.home_score, 'awayScore', m.away_score, 'walkover', m.walkover, 'noShow', to_jsonb(m.no_show), 'roundLabel', m.round_label,
        'homeClub', jsonb_build_object('id', m.home_club_id), 'awayClub', jsonb_build_object('id', m.away_club_id))
        ORDER BY m.round_number NULLS LAST, m.match_date NULLS LAST, m.id), '[]'::jsonb)
      FROM matches m WHERE m.tournament_id = p ->> 'id')
  )
  FROM s
$$;
CALL api_expose('tournament_editor', 'USER');

-- Canchas de futbol activas para programar partidos
CREATE OR REPLACE FUNCTION public.schedule_courts(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH s AS (SELECT require_uid() AS uid)
  SELECT jsonb_build_object('courts', (
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) ORDER BY c.sort_order, c.name, c.id), '[]'::jsonb)
    FROM courts c WHERE c.active AND c.football))
  FROM s
$$;
CALL api_expose('schedule_courts', 'USER');

-- Pistas para sugerir horario: horarios de la liga, canchas, disponibilidad de ambos clubes,
-- reservas y partidos de esos clubes en el rango de fechas
CREATE OR REPLACE FUNCTION public.match_slot_hints(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH s AS (SELECT require_uid() AS uid),
  args AS (
    SELECT p ->> 'homeId' AS home_id, p ->> 'awayId' AS away_id,
      (p ->> 'from')::date AS d_from, (p ->> 'until')::date AS d_until
  )
  SELECT jsonb_build_object(
    'platformSettings', (SELECT jsonb_build_object('courtSlotMinutes', ps.court_slot_minutes) FROM platform_settings ps WHERE ps.id = 'config'),
    'courtOpenWindows', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('weekday', w.weekday, 'startTime', w.start_time, 'endTime', w.end_time)
        ORDER BY w.weekday, w.start_time, w.id), '[]'::jsonb)
      FROM court_open_windows w),
    'courts', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'location', c.location, 'sortOrder', c.sort_order)
        ORDER BY c.sort_order, c.name, c.id), '[]'::jsonb)
      FROM courts c WHERE c.active AND c.football),
    'clubs', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id,
        'clubAvailabilityWindows_on_club', (
          SELECT coalesce(jsonb_agg(jsonb_build_object('weekday', w.weekday, 'startTime', w.start_time, 'endTime', w.end_time)
            ORDER BY w.weekday, w.start_time, w.id), '[]'::jsonb)
          FROM club_availability_windows w WHERE w.club_id = c.id))
        ORDER BY c.id), '[]'::jsonb)
      FROM clubs c, args WHERE c.id IN (args.home_id, args.away_id)),
    'courtHolds', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('holdDate', to_jsonb(h.hold_date), 'startTime', h.start_time, 'endTime', h.end_time,
        'court', jsonb_build_object('id', h.court_id),
        'match', CASE WHEN h.match_id IS NULL THEN NULL ELSE jsonb_build_object('id', h.match_id) END)
        ORDER BY h.hold_date, h.start_time, h.id), '[]'::jsonb)
      FROM court_holds h, args WHERE h.hold_date >= args.d_from AND h.hold_date <= args.d_until),
    'matches', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'matchDate', to_jsonb(m.match_date), 'startTime', m.start_time,
        'homeClub', jsonb_build_object('id', m.home_club_id), 'awayClub', jsonb_build_object('id', m.away_club_id),
        'tournament', (SELECT jsonb_build_object('durationMinutes', t.duration_minutes) FROM tournaments t WHERE t.id = m.tournament_id))
        ORDER BY m.match_date, m.start_time, m.id), '[]'::jsonb)
      FROM matches m, args
      WHERE m.match_date >= args.d_from AND m.match_date <= args.d_until
        AND (m.home_club_id IN (args.home_id, args.away_id) OR m.away_club_id IN (args.home_id, args.away_id)))
  )
  FROM s
$$;
CALL api_expose('match_slot_hints', 'USER');

-- ---------- Torneo ----------

-- Helpers internos (no son RPC: sin api_expose y sin EXECUTE para el navegador).

-- Un torneo FINISHED no se toca (calendario, marcadores, inscripciones) hasta que se reabre.
CREATE OR REPLACE FUNCTION public.tournament_locked(p_tournament text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM tournaments WHERE id = p_tournament AND status = 'FINISHED')
$$;
REVOKE ALL ON FUNCTION public.tournament_locked(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.match_locked(p_match text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM matches m JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.id = p_match AND t.status = 'FINISHED')
$$;
REVOKE ALL ON FUNCTION public.match_locked(text) FROM PUBLIC, anon, authenticated;

-- Desprograma los partidos SCHEDULED del torneo (solo los anteriores a p_before si se indica): vuelven a
-- «por definir» sin fecha, hora ni cancha, y se liberan sus apartados. Devuelve cuántos.
-- Deja esos partidos «por programar»: sin fecha, hora, cancha ni apartado. Conserva schedule_notice_key
-- para que la API pueda decir a los clubes qué fecha tenían. Lo usan el cierre de torneos, el cambio de
-- ajustes del torneo y el cambio de horario de canchas (save_court_module).
CREATE OR REPLACE FUNCTION public.unschedule_matches(p_ids text[])
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  DELETE FROM court_holds WHERE match_id = ANY (p_ids);
  UPDATE matches
  SET status = 'UNSCHEDULED'::match_status, match_date = NULL, start_time = NULL, court_id = NULL, venue = '',
      updated_at = now()
  WHERE id = ANY (p_ids);
  RETURN coalesce(array_length(p_ids, 1), 0);
END
$$;
REVOKE ALL ON FUNCTION public.unschedule_matches(text[]) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.unschedule_tournament_matches(p_tournament text, p_before date DEFAULT NULL)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_ids text[];
BEGIN
  SELECT coalesce(array_agg(id), '{}') INTO v_ids
  FROM matches
  WHERE tournament_id = p_tournament
    AND status = 'SCHEDULED'
    AND (p_before IS NULL OR match_date < p_before);
  RETURN unschedule_matches(v_ids);
END
$$;
REVOKE ALL ON FUNCTION public.unschedule_tournament_matches(text, date) FROM PUBLIC, anon, authenticated;

-- Cierra un torneo: desprograma lo pendiente, arma el podio con la tabla actual y lo deja FINISHED.
-- Lo usan close_tournament y el cierre forzado de temporada (set_season_active). Devuelve los desprogramados.
CREATE OR REPLACE FUNCTION public.close_tournament_row(p_tournament text)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_unscheduled int;
BEGIN
  v_unscheduled := unschedule_tournament_matches(p_tournament);
  DELETE FROM tournament_podium WHERE tournament_id = p_tournament;
  INSERT INTO tournament_podium (tournament_id, place, club_id)
  SELECT x.tournament_id, x.place, x.club_id
  FROM (
    SELECT s.tournament_id, s.club_id, row_number() OVER (ORDER BY s.standing_rank, s.club_id) AS place
    FROM tournament_standings s WHERE s.tournament_id = p_tournament
  ) x
  WHERE x.place <= 3;
  UPDATE tournaments SET status = 'FINISHED'::tournament_status WHERE id = p_tournament;
  RETURN v_unscheduled;
END
$$;
REVOKE ALL ON FUNCTION public.close_tournament_row(text) FROM PUBLIC, anon, authenticated;

-- Cierra el torneo (superadmin). Si ya estaba finalizado devuelve null.
CREATE OR REPLACE FUNCTION public.close_tournament(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_unscheduled int;
BEGIN
  IF NOT is_platform_admin() OR v_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM tournaments WHERE id = v_id AND status <> 'FINISHED') THEN
    RETURN jsonb_build_object('tournament', NULL, 'unscheduled', NULL);
  END IF;
  v_unscheduled := close_tournament_row(v_id);
  RETURN jsonb_build_object('tournament', jsonb_build_object('id', v_id), 'unscheduled', v_unscheduled);
END
$$;
CALL api_expose('close_tournament', 'USER');

-- Reabre un torneo finalizado mientras su temporada siga activa (una temporada cerrada no se reabre).
-- Vuelve a ACTIVE si ya tiene resultados y a UPCOMING si no; el podio se recalcula al cerrarlo otra vez.
CREATE OR REPLACE FUNCTION public.reopen_tournament(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_saved text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('tournament', NULL);
  END IF;
  UPDATE tournaments t
  SET status = CASE
    WHEN EXISTS (SELECT 1 FROM matches m WHERE m.tournament_id = t.id AND m.status = 'PLAYED') THEN 'ACTIVE'::tournament_status
    ELSE 'UPCOMING'::tournament_status END
  WHERE t.id = v_id
    AND t.status = 'FINISHED'
    AND EXISTS (SELECT 1 FROM seasons s WHERE s.id = t.season_id AND s.active)
  RETURNING id INTO v_saved;
  DELETE FROM tournament_podium WHERE tournament_id = v_saved;
  RETURN jsonb_build_object('tournament', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('reopen_tournament', 'USER');

-- Borra un torneo sin partidos jugados con todo lo que cuelga de él
CREATE OR REPLACE FUNCTION public.delete_unplayed_tournament(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_deleted text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('children', NULL, 'tournament', NULL);
  END IF;
  IF v_id IS NULL OR EXISTS (SELECT 1 FROM matches WHERE tournament_id = v_id AND status = 'PLAYED') THEN
    RETURN jsonb_build_object('children', NULL, 'tournament', NULL);
  END IF;
  DELETE FROM match_goals WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = v_id);
  DELETE FROM match_cards WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = v_id);
  DELETE FROM match_attendees WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = v_id);
  DELETE FROM match_goalkeepers WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = v_id);
  DELETE FROM match_club_reports WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = v_id);
  DELETE FROM court_holds WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = v_id);
  DELETE FROM matches WHERE tournament_id = v_id;
  DELETE FROM tournament_clubs WHERE tournament_id = v_id;
  DELETE FROM tournament_podium WHERE tournament_id = v_id;
  DELETE FROM tournament_notices WHERE tournament_id = v_id;
  DELETE FROM tournaments WHERE id = v_id RETURNING id INTO v_deleted;
  RETURN jsonb_build_object('children', NULL,
    'tournament', CASE WHEN v_deleted IS NULL THEN NULL ELSE jsonb_build_object('id', v_deleted) END);
END
$$;
CALL api_expose('delete_unplayed_tournament', 'USER');

-- Sin premio (clientes anteriores) se conserva lo guardado.
-- El premio sigue la misma regla que isTournamentPrize() en src/shared/textLimits.ts.
-- Las mismas reglas que create_tournament: formato 1 o 2 vueltas, duración 30/60/90/120 y fecha de inicio
-- obligatoria dentro de la temporada. Si cambia la duración se desprograman los partidos programados (los
-- apartados ya no coinciden); si la fecha de inicio avanza, solo los anteriores a ella. «unscheduled» los cuenta.
CREATE OR REPLACE FUNCTION public.update_tournament_settings(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_prize text := p ->> 'prize';
  v_legs int := (p ->> 'legs')::int;
  v_minutes int := (p ->> 'durationMinutes')::int;
  v_start date := (p ->> 'startDate')::date;
  v_old_minutes int;
  v_old_start date;
  v_saved text;
  v_unscheduled int := 0;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('tournament', NULL, 'unscheduled', NULL);
  END IF;
  SELECT duration_minutes, start_date INTO v_old_minutes, v_old_start FROM tournaments WHERE id = v_id;
  UPDATE tournaments t
  SET legs = v_legs,
      football_type = (p ->> 'footballType')::football_type,
      duration_minutes = v_minutes,
      start_date = v_start,
      prize = COALESCE(btrim(v_prize), prize)
  WHERE t.id = v_id
    AND NOT tournament_locked(v_id)
    AND v_legs IN (1, 2)
    AND v_minutes IN (30, 60, 90, 120)
    AND v_start IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM seasons s
      WHERE s.id = t.season_id
        AND (s.start_date IS NULL OR v_start >= s.start_date)
        AND (s.end_date IS NULL OR v_start <= s.end_date)
    )
    AND (
      v_prize IS NULL
      OR btrim(v_prize) = ''
      OR (
        char_length(btrim(v_prize)) <= 60
        AND btrim(v_prize) ~ '^([A-Za-z0-9À-ÖØ-öø-ÿ.,+$/()-]+)( [A-Za-z0-9À-ÖØ-öø-ÿ.,+$/()-]+)*$'
      )
    )
  RETURNING id INTO v_saved;
  IF v_saved IS NOT NULL THEN
    IF v_old_minutes IS DISTINCT FROM v_minutes THEN
      v_unscheduled := unschedule_tournament_matches(v_id);
    ELSIF v_old_start IS NULL OR v_start > v_old_start THEN
      v_unscheduled := unschedule_tournament_matches(v_id, v_start);
    END IF;
  END IF;
  RETURN jsonb_build_object(
    'tournament', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END,
    'unscheduled', CASE WHEN v_saved IS NULL THEN NULL ELSE to_jsonb(v_unscheduled) END);
END
$$;
CALL api_expose('update_tournament_settings', 'USER');

-- Inscribe un club (superadmin); siempre que no esté bloqueado el torneo, se inscribe. «conflicts»
-- [{playerName, clubName}] es un aviso: jugadores activos del club que ya juegan ese torneo activos con otro club
-- inscrito (si anotan con los dos, cuenta para cada uno). Volver a inscribir a uno que ya está no se revisa.
CREATE OR REPLACE FUNCTION public.add_tournament_club(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_tournament text := p ->> 'tournamentId';
  v_club text := p ->> 'clubId';
  v_conflicts jsonb;
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR v_tournament IS NULL OR v_club IS NULL OR tournament_locked(v_tournament) THEN
    RETURN jsonb_build_object('row', NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tournament_clubs WHERE tournament_id = v_tournament AND club_id = v_club) THEN
    SELECT jsonb_agg(jsonb_build_object('playerName', pl.name, 'clubName', c.name) ORDER BY pl.name, c.name)
    INTO v_conflicts
    FROM club_players mine
    JOIN players pl ON pl.id = mine.player_id
    JOIN club_players other ON other.player_id = mine.player_id AND other.club_id <> v_club
      AND other.active AND other.deleted_at IS NULL AND NOT other.is_coach
    JOIN tournament_clubs tc ON tc.club_id = other.club_id AND tc.tournament_id = v_tournament
    JOIN clubs c ON c.id = other.club_id
    WHERE mine.club_id = v_club AND mine.active AND mine.deleted_at IS NULL AND NOT mine.is_coach;
  END IF;
  INSERT INTO tournament_clubs (tournament_id, club_id, created_at)
  VALUES (v_tournament, v_club, now())
  ON CONFLICT (tournament_id, club_id) DO UPDATE SET tournament_id = EXCLUDED.tournament_id
  RETURNING tournament_id INTO v_saved;
  RETURN jsonb_build_object('row', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END,
    'conflicts', v_conflicts);
END
$$;
CALL api_expose('add_tournament_club', 'USER');

-- No se quita un club que ya jugó en el torneo
CREATE OR REPLACE FUNCTION public.remove_tournament_club(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_tournament text := p ->> 'tournamentId';
  v_club text := p ->> 'clubId';
  v_saved text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('row', NULL);
  END IF;
  DELETE FROM tournament_clubs
  WHERE tournament_id = v_tournament AND club_id = v_club
    AND NOT tournament_locked(v_tournament)
    AND NOT EXISTS (
      SELECT 1 FROM matches
      WHERE tournament_id = v_tournament
        AND status = 'PLAYED'
        AND (home_club_id = v_club OR away_club_id = v_club)
    )
  RETURNING tournament_id INTO v_saved;
  RETURN jsonb_build_object('row', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('remove_tournament_club', 'USER');

-- ---------- Calendario ----------

-- homeScore/awayScore estaban @retired en el .gql: se ignoran
CREATE OR REPLACE FUNCTION public.insert_unplayed_match(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_tournament text := p ->> 'tournamentId';
  v_round_label text := p ->> 'roundLabel';
  v_home text := p ->> 'homeClubId';
  v_away text := p ->> 'awayClubId';
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR v_id IS NULL OR v_tournament IS NULL OR v_round_label IS NULL
     OR v_home IS NULL OR v_away IS NULL OR tournament_locked(v_tournament) THEN
    RETURN jsonb_build_object('match', NULL);
  END IF;
  INSERT INTO matches (
    id, tournament_id, round_label, round_number,
    home_club_id, away_club_id, status, venue, walkover, created_at
  )
  VALUES (
    v_id, v_tournament, v_round_label, (p ->> 'roundNumber')::int,
    v_home, v_away, coalesce(p ->> 'status', 'UNSCHEDULED')::match_status, '',
    coalesce((p ->> 'walkover')::boolean, false), now()
  )
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('insert_unplayed_match', 'USER');

CREATE OR REPLACE FUNCTION public.mark_match_walkover(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_saved text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('match', NULL);
  END IF;
  UPDATE matches
  SET status = 'PLAYED'::match_status,
      walkover = (p ->> 'walkover')::boolean,
      no_show = NULL,
      home_score = (p ->> 'homeScore')::int,
      away_score = (p ->> 'awayScore')::int
  WHERE id = p ->> 'id'
    AND NOT match_locked(p ->> 'id')
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('mark_match_walkover', 'USER');

CREATE OR REPLACE FUNCTION public.delete_unplayed_match(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_saved text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('match', NULL);
  END IF;
  DELETE FROM matches
  WHERE id = p ->> 'id' AND status <> 'PLAYED' AND NOT match_locked(p ->> 'id')
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('delete_unplayed_match', 'USER');

-- Un partido otorgado por ingreso tardío (W.O.) vuelve a «por programar»: 0-0 sin fecha, hora ni cancha,
-- se liberan sus apartados y se borran sus eventos. El superadmin lo confirma en el calendario del torneo.
CREATE OR REPLACE FUNCTION public.reset_walkover_match(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_saved text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('match', NULL);
  END IF;
  UPDATE matches
  SET status = 'UNSCHEDULED'::match_status, walkover = false, no_show = NULL,
      home_score = NULL, away_score = NULL, penalties_home = NULL, penalties_away = NULL,
      match_date = NULL, start_time = NULL, court_id = NULL, venue = '', updated_at = now()
  WHERE id = v_id AND walkover = true AND NOT match_locked(v_id)
  RETURNING id INTO v_saved;
  IF v_saved IS NOT NULL THEN
    DELETE FROM court_holds WHERE match_id = v_saved;
    DELETE FROM match_goals WHERE match_id = v_saved;
    DELETE FROM match_cards WHERE match_id = v_saved;
  END IF;
  RETURN jsonb_build_object('match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('reset_walkover_match', 'USER');

-- No se presentó el local (HOME), el visitante (AWAY) o ninguno (BOTH): el partido se da por jugado como W.O.,
-- 3-0 a favor del que llegó o 0-0 si faltaron los dos (la tabla les da derrota a ambos, 0006_no_presentado.sql).
-- Vale para partidos con fecha de hoy o anterior, programados o ya capturados, pero no para el W.O. por ingreso
-- tardío. Se borran goles y tarjetas; la cancha apartada se conserva porque estuvo reservada.
CREATE OR REPLACE FUNCTION public.mark_match_no_show(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_no_show text := p ->> 'noShow';
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR v_id IS NULL OR v_no_show IS NULL
     OR v_no_show NOT IN ('HOME', 'AWAY', 'BOTH') OR match_locked(v_id) THEN
    RETURN jsonb_build_object('match', NULL);
  END IF;
  UPDATE matches
  SET status = 'PLAYED'::match_status,
      walkover = true,
      no_show = v_no_show::match_no_show,
      home_score = CASE WHEN v_no_show = 'AWAY' THEN 3 ELSE 0 END,
      away_score = CASE WHEN v_no_show = 'HOME' THEN 3 ELSE 0 END,
      penalties_home = NULL, penalties_away = NULL,
      updated_at = now()
  WHERE id = v_id
    AND match_date IS NOT NULL AND match_date <= CURRENT_DATE
    AND (status = 'SCHEDULED'::match_status
      OR (status = 'PLAYED'::match_status AND (NOT walkover OR no_show IS NOT NULL)))
  RETURNING id INTO v_saved;
  IF v_saved IS NOT NULL THEN
    DELETE FROM match_goals WHERE match_id = v_saved;
    DELETE FROM match_cards WHERE match_id = v_saved;
    UPDATE tournaments
    SET status = 'ACTIVE'::tournament_status
    WHERE id = (SELECT tournament_id FROM matches WHERE id = v_saved) AND status = 'UPCOMING';
  END IF;
  RETURN jsonb_build_object('match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('mark_match_no_show', 'USER');

-- Deshace un «no se presentó» marcado por error: vuelve a programado con su fecha, hora y cancha, sin marcador.
CREATE OR REPLACE FUNCTION public.clear_match_no_show(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR v_id IS NULL OR match_locked(v_id) THEN
    RETURN jsonb_build_object('match', NULL);
  END IF;
  UPDATE matches
  SET status = 'SCHEDULED'::match_status, walkover = false, no_show = NULL,
      home_score = NULL, away_score = NULL, penalties_home = NULL, penalties_away = NULL,
      updated_at = now()
  WHERE id = v_id AND no_show IS NOT NULL
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('clear_match_no_show', 'USER');

-- Renumera la jornada de un partido no jugado (al pasar un torneo a 1 partido, el cruce que se conserva
-- puede venir de la vuelta y hay que llevarlo a su jornada de ida).
CREATE OR REPLACE FUNCTION public.set_match_round(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_label text := btrim(coalesce(p ->> 'roundLabel', ''));
  v_saved text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('match', NULL);
  END IF;
  UPDATE matches
  SET round_label = v_label, round_number = (p ->> 'roundNumber')::int, updated_at = now()
  WHERE id = v_id
    AND status <> 'PLAYED'
    AND NOT match_locked(v_id)
    AND char_length(v_label) BETWEEN 1 AND 16
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('set_match_round', 'USER');

-- Programa fecha, hora, sede y cancha de un partido no jugado. La fecha no puede ser anterior al inicio
-- del torneo (o de su temporada, si el torneo no tiene fecha propia); el formulario pone el mismo «min».
CREATE OR REPLACE FUNCTION public.schedule_official_match(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_date date := (p ->> 'matchDate')::date;
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR v_date IS NULL THEN
    RETURN jsonb_build_object('match', NULL);
  END IF;
  UPDATE matches m
  SET match_date = v_date,
      start_time = p ->> 'startTime',
      venue = p ->> 'venue',
      court_id = NULLIF(p ->> 'courtId', ''),
      status = 'SCHEDULED'::match_status
  WHERE m.id = v_id
    AND m.status <> 'PLAYED'
    AND NOT match_locked(v_id)
    AND v_date >= coalesce(
      (SELECT coalesce(t.start_date, s.start_date) FROM tournaments t JOIN seasons s ON s.id = t.season_id WHERE t.id = m.tournament_id),
      v_date)
  RETURNING m.id INTO v_saved;
  RETURN jsonb_build_object('match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('schedule_official_match', 'USER');

CREATE OR REPLACE FUNCTION public.clear_match_court_holds(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('cleared', NULL);
  END IF;
  DELETE FROM court_holds WHERE match_id = p ->> 'matchId';
  RETURN jsonb_build_object('cleared', NULL);
END
$$;
CALL api_expose('clear_match_court_holds', 'USER');

-- Reserva de cancha ligada al partido (id = match_<matchId>, lo genera el cliente)
CREATE OR REPLACE FUNCTION public.save_match_court_hold(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id text := p ->> 'id';
  v_court text := p ->> 'courtId';
  v_date date := (p ->> 'holdDate')::date;
  v_start text := p ->> 'startTime';
  v_end text := p ->> 'endTime';
  v_match text := p ->> 'matchId';
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR v_id IS NULL OR v_court IS NULL OR v_date IS NULL
     OR v_start IS NULL OR v_end IS NULL OR v_match IS NULL OR match_locked(v_match) THEN
    RETURN jsonb_build_object('courtHold', NULL);
  END IF;
  INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, match_id, note)
  VALUES (v_id, v_court, v_date, v_start, v_end, 'MATCH'::court_hold_source, v_match, '')
  ON CONFLICT (id) DO UPDATE SET
    court_id = EXCLUDED.court_id,
    hold_date = EXCLUDED.hold_date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    source = EXCLUDED.source,
    match_id = EXCLUDED.match_id
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('courtHold', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('save_match_court_hold', 'USER');

-- ---------- Marcador (hoja del superadmin) ----------

CREATE OR REPLACE FUNCTION public.save_match_score(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_saved text;
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('match', NULL);
  END IF;
  UPDATE matches
  SET home_score = (p ->> 'homeScore')::int,
      away_score = (p ->> 'awayScore')::int,
      status = 'PLAYED'::match_status,
      walkover = coalesce((p ->> 'walkover')::boolean, false),
      no_show = NULL
  WHERE id = p ->> 'id'
    AND NOT match_locked(p ->> 'id')
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('save_match_score', 'USER');

CREATE OR REPLACE FUNCTION public.clear_match_events(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT is_platform_admin() OR match_locked(p ->> 'matchId') THEN
    RETURN jsonb_build_object('goals', NULL, 'cards', NULL);
  END IF;
  DELETE FROM match_goals WHERE match_id = p ->> 'matchId';
  DELETE FROM match_cards WHERE match_id = p ->> 'matchId';
  RETURN jsonb_build_object('goals', NULL, 'cards', NULL);
END
$$;
CALL api_expose('clear_match_events', 'USER');

-- El primer resultado pone en marcha un torneo que estaba por empezar
CREATE OR REPLACE FUNCTION public.activate_tournament(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    RETURN jsonb_build_object('tournament', NULL);
  END IF;
  UPDATE tournaments
  SET status = 'ACTIVE'::tournament_status
  WHERE id = (SELECT tournament_id FROM matches WHERE id = p ->> 'matchId')
    AND status = 'UPCOMING';
  RETURN jsonb_build_object('tournament', NULL);
END
$$;
CALL api_expose('activate_tournament', 'USER');

-- Tarjeta de la hoja de marcador; el minuto solo se guarda si está entre 1 y 150. El jugador y su nombre salen de
-- players (del mismo club), así que volver a guardar la hoja no pierde el nombre de un jugador de baja o eliminado
-- (la hoja se guarda borrando y volviendo a insertar); el nombre que manda el cliente es el respaldo.
CREATE OR REPLACE FUNCTION public.insert_match_card(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_match text := p ->> 'matchId';
  v_club text := p ->> 'clubId';
  v_color text := p ->> 'color';
  v_minute int := (p ->> 'minute')::int;
  v_player text;
  v_name text;
  v_saved uuid;
BEGIN
  IF NOT is_platform_admin() OR v_match IS NULL OR v_club IS NULL OR v_color IS NULL OR match_locked(v_match) THEN
    RETURN jsonb_build_object('card', NULL);
  END IF;
  SELECT pl.id, pl.name INTO v_player, v_name
  FROM players pl WHERE pl.id = NULLIF(p ->> 'playerId', '') AND is_club_player(pl.id, v_club);
  INSERT INTO match_cards (match_id, club_id, player_id, player_name, color, minute)
  VALUES (
    v_match, v_club, v_player, coalesce(NULLIF(v_name, ''), p ->> 'playerName', ''), v_color::card_color,
    CASE WHEN v_minute BETWEEN 1 AND 150 THEN v_minute END
  )
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('card', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('insert_match_card', 'USER');

-- Gol del modal «Marcador» con su minuto; los nombres se leen de players
CREATE OR REPLACE FUNCTION public.insert_timed_match_goal(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_match text := p ->> 'matchId';
  v_club text := p ->> 'clubId';
  v_sort int := (p ->> 'sortOrder')::int;
  v_scorer text := NULLIF(coalesce(p ->> 'scorerId', ''), '');
  v_assist text := NULLIF(coalesce(p ->> 'assistId', ''), '');
  v_minute int := (p ->> 'minute')::int;
  v_saved uuid;
BEGIN
  IF NOT is_platform_admin() OR v_match IS NULL OR v_club IS NULL OR v_sort IS NULL OR match_locked(v_match) THEN
    RETURN jsonb_build_object('goal', NULL);
  END IF;
  INSERT INTO match_goals (
    match_id, club_id, sort_order, scorer_id, scorer_name,
    assist_id, assist_name, is_penalty, is_own_goal, minute
  )
  VALUES (
    v_match, v_club, v_sort,
    (SELECT id FROM players WHERE id = v_scorer),
    COALESCE((SELECT name FROM players WHERE id = v_scorer), ''),
    (SELECT id FROM players WHERE id = v_assist),
    COALESCE((SELECT name FROM players WHERE id = v_assist), ''),
    coalesce((p ->> 'isPenalty')::boolean, false),
    coalesce((p ->> 'isOwnGoal')::boolean, false),
    CASE WHEN v_minute BETWEEN 1 AND 150 THEN v_minute END
  )
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('goal', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('insert_timed_match_goal', 'USER');

-- ---------- Marcador en vivo ----------
-- Mientras el partido sigue SCHEDULED, cada evento se guarda al momento y el marcador
-- se recalcula contando match_goals (club_id = equipo al que se le suma el gol).
-- La tabla solo cuenta PLAYED, así que el marcador parcial no la toca.
-- El id del evento lo genera el navegador: repetir la operación no duplica nada.

CREATE OR REPLACE FUNCTION public.add_live_match_goal(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid := (p ->> 'id')::uuid;
  v_match text := p ->> 'matchId';
  v_club text := p ->> 'clubId';
  v_scorer text := NULLIF(coalesce(p ->> 'scorerId', ''), '');
  v_assist text := NULLIF(coalesce(p ->> 'assistId', ''), '');
  v_minute int := (p ->> 'minute')::int;
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR v_id IS NULL OR v_match IS NULL OR v_club IS NULL OR match_locked(v_match) THEN
    RETURN jsonb_build_object('goal', NULL, 'match', NULL);
  END IF;
  -- Un jugador eliminado de todos sus clubes (borrado lógico) no recibe goles nuevos; reintentar uno ya guardado sí
  -- pasa. No se exige que sea del club: en un autogol el goleador es del rival.
  IF EXISTS (SELECT 1 FROM players pl WHERE pl.id IN (v_scorer, v_assist)
               AND NOT EXISTS (SELECT 1 FROM club_players cp WHERE cp.player_id = pl.id AND cp.deleted_at IS NULL))
     AND NOT EXISTS (SELECT 1 FROM match_goals WHERE id = v_id) THEN
    RETURN jsonb_build_object('goal', NULL, 'match', NULL);
  END IF;
  INSERT INTO match_goals (
    id, match_id, club_id, sort_order, scorer_id, scorer_name,
    assist_id, assist_name, is_penalty, is_own_goal, minute
  )
  SELECT
    v_id, m.id, v_club,
    COALESCE((SELECT MAX(sort_order) FROM match_goals WHERE match_id = m.id AND club_id = v_club), 0) + 1,
    (SELECT id FROM players WHERE id = v_scorer),
    COALESCE((SELECT name FROM players WHERE id = v_scorer), ''),
    (SELECT id FROM players WHERE id = v_assist),
    COALESCE((SELECT name FROM players WHERE id = v_assist), ''),
    coalesce((p ->> 'isPenalty')::boolean, false),
    coalesce((p ->> 'isOwnGoal')::boolean, false),
    CASE WHEN v_minute BETWEEN 1 AND 150 THEN v_minute END
  FROM matches m
  WHERE m.id = v_match
    AND m.status = 'SCHEDULED'
    AND v_club IN (m.home_club_id, m.away_club_id)
  ON CONFLICT (id) DO NOTHING;

  UPDATE matches m
  SET home_score = (SELECT COUNT(*) FROM match_goals g WHERE g.match_id = m.id AND g.club_id = m.home_club_id)::smallint,
      away_score = (SELECT COUNT(*) FROM match_goals g WHERE g.match_id = m.id AND g.club_id = m.away_club_id)::smallint,
      updated_at = now()
  WHERE m.id = v_match
    AND m.status = 'SCHEDULED'
    AND EXISTS (SELECT 1 FROM match_goals WHERE id = v_id AND match_id = v_match)
  RETURNING m.id INTO v_saved;
  RETURN jsonb_build_object('goal', NULL,
    'match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('add_live_match_goal', 'USER');

CREATE OR REPLACE FUNCTION public.delete_live_match_goal(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_match text := p ->> 'matchId';
  v_goal uuid := (p ->> 'goalId')::uuid;
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR match_locked(v_match) THEN
    RETURN jsonb_build_object('removed', NULL, 'match', NULL);
  END IF;
  DELETE FROM match_goals
  WHERE id = v_goal
    AND match_id = v_match
    AND EXISTS (SELECT 1 FROM matches WHERE id = v_match AND status = 'SCHEDULED');

  UPDATE matches m
  SET home_score = (SELECT COUNT(*) FROM match_goals g WHERE g.match_id = m.id AND g.club_id = m.home_club_id)::smallint,
      away_score = (SELECT COUNT(*) FROM match_goals g WHERE g.match_id = m.id AND g.club_id = m.away_club_id)::smallint,
      updated_at = now()
  WHERE m.id = v_match
    AND m.status = 'SCHEDULED'
    AND NOT EXISTS (SELECT 1 FROM match_goals WHERE id = v_goal)
  RETURNING m.id INTO v_saved;
  RETURN jsonb_build_object('removed', NULL,
    'match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('delete_live_match_goal', 'USER');

CREATE OR REPLACE FUNCTION public.add_live_match_card(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid := (p ->> 'id')::uuid;
  v_match text := p ->> 'matchId';
  v_club text := p ->> 'clubId';
  v_player text := NULLIF(coalesce(p ->> 'playerId', ''), '');
  v_minute int := (p ->> 'minute')::int;
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR v_id IS NULL OR v_match IS NULL OR v_club IS NULL OR match_locked(v_match) THEN
    RETURN jsonb_build_object('card', NULL, 'match', NULL);
  END IF;
  -- Un jugador eliminado de todos sus clubes (borrado lógico) no recibe tarjetas nuevas; reintentar una ya guardada sí pasa
  IF EXISTS (SELECT 1 FROM players pl WHERE pl.id = v_player
               AND NOT EXISTS (SELECT 1 FROM club_players cp WHERE cp.player_id = pl.id AND cp.deleted_at IS NULL))
     AND NOT EXISTS (SELECT 1 FROM match_cards WHERE id = v_id) THEN
    RETURN jsonb_build_object('card', NULL, 'match', NULL);
  END IF;
  INSERT INTO match_cards (id, match_id, club_id, player_id, player_name, color, minute)
  SELECT
    v_id, m.id, v_club,
    (SELECT id FROM players WHERE id = v_player),
    COALESCE((SELECT name FROM players WHERE id = v_player), ''),
    (p ->> 'color')::card_color,
    CASE WHEN v_minute BETWEEN 1 AND 150 THEN v_minute END
  FROM matches m
  WHERE m.id = v_match
    AND m.status = 'SCHEDULED'
    AND v_club IN (m.home_club_id, m.away_club_id)
  ON CONFLICT (id) DO NOTHING;

  UPDATE matches
  SET updated_at = now()
  WHERE id = v_match
    AND status = 'SCHEDULED'
    AND EXISTS (SELECT 1 FROM match_cards WHERE id = v_id AND match_id = v_match)
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('card', NULL,
    'match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('add_live_match_card', 'USER');

CREATE OR REPLACE FUNCTION public.delete_live_match_card(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_match text := p ->> 'matchId';
  v_card uuid := (p ->> 'cardId')::uuid;
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR match_locked(v_match) THEN
    RETURN jsonb_build_object('removed', NULL, 'match', NULL);
  END IF;
  DELETE FROM match_cards
  WHERE id = v_card
    AND match_id = v_match
    AND EXISTS (SELECT 1 FROM matches WHERE id = v_match AND status = 'SCHEDULED');

  UPDATE matches
  SET updated_at = now()
  WHERE id = v_match
    AND status = 'SCHEDULED'
    AND NOT EXISTS (SELECT 1 FROM match_cards WHERE id = v_card)
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('removed', NULL,
    'match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('delete_live_match_card', 'USER');

-- Cierra el partido en vivo: el marcador sale de match_goals y pasa a contar en la tabla
CREATE OR REPLACE FUNCTION public.finish_live_match(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_match text := p ->> 'matchId';
  v_saved text;
BEGIN
  IF NOT is_platform_admin() OR match_locked(v_match) THEN
    RETURN jsonb_build_object('tournament', NULL, 'match', NULL);
  END IF;
  UPDATE tournaments
  SET status = 'ACTIVE'::tournament_status
  WHERE id = (SELECT tournament_id FROM matches WHERE id = v_match AND status = 'SCHEDULED')
    AND status = 'UPCOMING';

  UPDATE matches m
  SET home_score = (SELECT COUNT(*) FROM match_goals g WHERE g.match_id = m.id AND g.club_id = m.home_club_id)::smallint,
      away_score = (SELECT COUNT(*) FROM match_goals g WHERE g.match_id = m.id AND g.club_id = m.away_club_id)::smallint,
      status = 'PLAYED'::match_status,
      updated_at = now()
  WHERE m.id = v_match
    AND m.status = 'SCHEDULED'
  RETURNING m.id INTO v_saved;
  RETURN jsonb_build_object('tournament', NULL,
    'match', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('finish_live_match', 'USER');

RESET ROLE;
