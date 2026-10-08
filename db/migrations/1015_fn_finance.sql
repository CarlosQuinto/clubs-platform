-- Finanzas de la liga (tablas en 0007_finanzas_liga.sql).
--
-- Cargos automáticos: triggers sobre matches, match_cards, tournament_clubs, court_holds y ads llaman a una
-- función league_sync_* que compara lo que debería cobrarse con lo que ya existe:
-- - lo que falta se crea con league_charge_put (o revive si el sistema lo había cancelado);
-- - lo que ya no tiene origen (se borró la tarjeta, se dio de baja del torneo) pasa a CANCELADO, solo si sigue
--   PENDIENTE y sin abonos; una renta cancelada pierde además sus abonos (se devolvió lo pagado). Desactivar una tarifa no cancela lo ya cobrado: solo deja de generar cargos nuevos.
-- Solo se cobra lo que la temporada tiene activo en league_fees. Los cargos manuales no tienen source_key.
--
-- RPC: lecturas con require_platform_admin() (42501); mutaciones devuelven NULL si no hay permiso o la
-- validación falla. Textos con las reglas de src/shared/textLimits.ts (financeText, payerName).
SET ROLE postgres;

-- ---------- Ayudas internas (sin exponer) ----------

-- Lo abonado a cada cargo
CREATE OR REPLACE VIEW league_charge_paid AS
  SELECT c.id, coalesce(sum(lp.amount), 0)::numeric(12,2) AS paid
  FROM league_charges c
  LEFT JOIN league_payments lp ON lp.charge_id = c.id
  GROUP BY c.id;

-- Fecha 'YYYY-MM-DD' válida o NULL (2026-02-31 no revienta la función con 22008)
CREATE OR REPLACE FUNCTION public.league_date(p_value text)
RETURNS date LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_value IS NULL OR p_value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
    RETURN NULL;
  END IF;
  RETURN p_value::date;
EXCEPTION WHEN others THEN
  RETURN NULL;
END
$$;

-- Hoy en la liga: Hermosillo, UTC-7 todo el año (sin horario de verano), la zona de la demo y de docker:smoke.
-- La base corre en UTC, donde una renta de hoy en la noche ya es «ayer». Es la fecha que el administrador ve en
-- Canchas; se usa para saber si una renta ya pasó. Desfase fijo: no depende de los datos de zonas horarias.
CREATE OR REPLACE FUNCTION public.league_today()
RETURNS date LANGUAGE sql STABLE AS $$
  SELECT ((now() AT TIME ZONE 'UTC') - interval '7 hours')::date
$$;

-- Temporada de una fecha: la que la contiene (la activa primero); si ninguna, la activa más reciente.
CREATE OR REPLACE FUNCTION public.league_season_on(p_date date)
RETURNS text LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT id FROM (
    SELECT id, 0 AS pri, active, start_date FROM seasons
    WHERE start_date IS NOT NULL AND start_date <= p_date AND (end_date IS NULL OR end_date >= p_date)
    UNION ALL
    SELECT id, 1, active, start_date FROM seasons WHERE active
  ) s
  ORDER BY pri, active DESC, start_date DESC NULLS LAST, id
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.league_season_on(date) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.league_kind_label(p_kind text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_kind
    WHEN 'CLUB_REGISTRATION' THEN 'Registro del club en la plataforma'
    WHEN 'CLUB_PAGE' THEN 'Página del club'
    WHEN 'SEASON_ENROLLMENT' THEN 'Inscripción a la temporada'
    WHEN 'TOURNAMENT_ENROLLMENT' THEN 'Inscripción al torneo'
    WHEN 'DEPOSIT' THEN 'Fianza'
    WHEN 'MATCH_REFEREE' THEN 'Arbitraje'
    WHEN 'MATCH_COURT' THEN 'Uso de cancha'
    WHEN 'COURT_RENTAL' THEN 'Renta de cancha'
    WHEN 'CARD_YELLOW' THEN 'Tarjeta amarilla'
    WHEN 'CARD_RED' THEN 'Tarjeta roja'
    WHEN 'WALKOVER' THEN 'No presentarse'
    WHEN 'PROTEST' THEN 'Protesta'
    WHEN 'RESCHEDULE' THEN 'Reprogramación'
    WHEN 'PLAYER_CARD' THEN 'Credencial de jugador'
    WHEN 'LATE_SIGNING' THEN 'Fichaje tardío'
    WHEN 'AD' THEN 'Publicidad'
    WHEN 'SPONSORSHIP' THEN 'Patrocinio'
    ELSE 'Otro'
  END
$$;

CREATE OR REPLACE FUNCTION public.league_month_label(p_date date)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT (ARRAY['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
    'octubre', 'noviembre', 'diciembre'])[extract(month FROM p_date)::int] || ' ' || extract(year FROM p_date)::int
$$;

-- «Halcones vs Unión · J4» (o «· Final» si la jornada no es un número)
CREATE OR REPLACE FUNCTION public.league_match_label(p_match text)
RETURNS text LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT hc.name || ' vs ' || ac.name || ' · '
    || CASE WHEN m.round_label ~ '^[0-9]+$' THEN 'J' || m.round_label ELSE m.round_label END
  FROM matches m
  JOIN clubs hc ON hc.id = m.home_club_id
  JOIN clubs ac ON ac.id = m.away_club_id
  WHERE m.id = p_match
$$;
REVOKE ALL ON FUNCTION public.league_match_label(text) FROM PUBLIC, anon, authenticated;

-- Precio del registro del club en la plataforma según la tarifa de la temporada en que se dio de alta
CREATE OR REPLACE FUNCTION public.league_registration_fee(p_season text)
RETURNS numeric LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT f.amount FROM league_fees f
  WHERE f.season_id = p_season AND f.kind = 'CLUB_REGISTRATION' AND f.enabled AND f.amount > 0
$$;
REVOKE ALL ON FUNCTION public.league_registration_fee(text) FROM PUBLIC, anon, authenticated;

-- ¿Se cobra este tipo en la temporada? Uso de cancha, renta y publicidad toman su precio del propio registro
-- (cancha o anuncio) y se cobran solos salvo que la tarifa se haya apagado; los demás necesitan tarifa
-- activa con precio.
CREATE OR REPLACE FUNCTION public.league_fee_on(p_season text, p_kind text)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT CASE
    WHEN p_season IS NULL THEN false
    WHEN p_kind IN ('MATCH_COURT', 'COURT_RENTAL', 'AD') THEN coalesce(
      (SELECT f.enabled FROM league_fees f WHERE f.season_id = p_season AND f.kind = p_kind::league_fee_kind), true)
    ELSE EXISTS (
      SELECT 1 FROM league_fees f
      WHERE f.season_id = p_season AND f.kind = p_kind::league_fee_kind AND f.enabled AND f.amount > 0)
  END
$$;
REVOKE ALL ON FUNCTION public.league_fee_on(text, text) FROM PUBLIC, anon, authenticated;

-- Tipos que la liga cobra (las tarifas y los cargos manuales solo aceptan estos). El enum conserva otros
-- valores de la primera versión, que ya no se usan.
CREATE OR REPLACE FUNCTION public.league_fee_kinds()
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['TOURNAMENT_ENROLLMENT', 'CLUB_REGISTRATION', 'MATCH_REFEREE', 'MATCH_COURT', 'WALKOVER',
    'CARD_YELLOW', 'CARD_RED', 'COURT_RENTAL', 'AD']
$$;

-- Estado según lo abonado (no toca condonados ni cancelados)
CREATE OR REPLACE FUNCTION public.league_charge_refresh(p_charge text)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE league_charges c
  SET status = CASE
        WHEN cp.paid <= 0 THEN 'PENDIENTE'::league_charge_status
        WHEN cp.paid < c.amount THEN 'PARCIAL'::league_charge_status
        ELSE 'PAGADO'::league_charge_status
      END,
      updated_at = now()
  FROM league_charge_paid cp
  WHERE c.id = p_charge AND cp.id = c.id AND c.status NOT IN ('CONDONADO', 'CANCELADO');
END
$$;
REVOKE ALL ON FUNCTION public.league_charge_refresh(text) FROM PUBLIC, anon, authenticated;

-- Crea un cargo automático si no existe; revive uno que el sistema canceló. p_reprice actualiza el monto de
-- uno pendiente sin abonos (rentas y anuncios, cuyo monto sale del propio registro). Devuelve true si lo creó
-- o lo revivió.
CREATE OR REPLACE FUNCTION public.league_charge_put(
  p_kind text, p_key text, p_club text, p_payer text, p_contact text, p_amount numeric, p_concept text,
  p_charged_on date, p_season text, p_tournament text, p_match text, p_reprice boolean)
RETURNS boolean LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_row league_charges;
  v_paid numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 OR p_key IS NULL THEN
    RETURN false;
  END IF;
  SELECT * INTO v_row FROM league_charges
  WHERE kind = p_kind::league_fee_kind AND source_key = p_key AND coalesce(club_id, '') = coalesce(p_club, '')
  FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO league_charges (id, kind, club_id, payer_name, payer_contact, concept, amount, charged_on,
      season_id, tournament_id, match_id, source_key)
    VALUES (gen_random_uuid()::text, p_kind::league_fee_kind, p_club, left(coalesce(p_payer, ''), 160),
      left(coalesce(p_contact, ''), 160), left(p_concept, 160), round(p_amount, 2), coalesce(p_charged_on, CURRENT_DATE),
      p_season, p_tournament, p_match, p_key);
    RETURN true;
  END IF;
  SELECT paid INTO v_paid FROM league_charge_paid WHERE id = v_row.id;
  IF v_row.status = 'CANCELADO' AND v_row.auto_cancelled AND v_paid = 0 THEN
    UPDATE league_charges
    SET status = 'PENDIENTE', auto_cancelled = false, amount = round(p_amount, 2), concept = left(p_concept, 160),
        payer_name = left(coalesce(p_payer, ''), 160), payer_contact = left(coalesce(p_contact, ''), 160),
        charged_on = coalesce(p_charged_on, charged_on), season_id = p_season, tournament_id = p_tournament,
        match_id = p_match, updated_at = now()
    WHERE id = v_row.id;
    RETURN true;
  END IF;
  IF v_row.status = 'PENDIENTE' AND v_paid = 0 THEN
    UPDATE league_charges
    SET concept = left(p_concept, 160), payer_name = left(coalesce(p_payer, ''), 160),
        payer_contact = left(coalesce(p_contact, ''), 160),
        amount = CASE WHEN p_reprice THEN round(p_amount, 2) ELSE amount END, updated_at = now()
    WHERE id = v_row.id;
  END IF;
  RETURN false;
END
$$;
REVOKE ALL ON FUNCTION public.league_charge_put(text, text, text, text, text, numeric, text, date, text, text, text, boolean)
  FROM PUBLIC, anon, authenticated;

-- ---------- Partidos: arbitraje, uso de cancha, no presentarse y tarjetas ----------

-- Lo que un partido origina. e_amount es NULL si la tarifa no está activa: el hecho existe (no se cancela
-- lo ya cobrado) pero no se crea un cargo nuevo. Las tarjetas se cobran cuando el partido está jugado.
-- El uso de cancha cuesta lo que la cancha del partido por hora × la duración del partido (a medias si no
-- se dice otra cosa en la tarifa); sin cancha o con costo 0 no hay cargo.
CREATE OR REPLACE FUNCTION public.league_match_expected(p_match text)
RETURNS TABLE (e_kind text, e_key text, e_club text, e_payer text, e_amount numeric, e_concept text,
  e_day date, e_season text, e_tournament text)
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  WITH m AS (
    SELECT m.id, m.status, m.walkover, m.no_show, coalesce(m.match_date, CURRENT_DATE) AS day,
      m.home_club_id, m.away_club_id, t.id AS tid, t.season_id AS sid, league_match_label(m.id) AS label,
      CASE WHEN league_fee_on(t.season_id, 'MATCH_COURT') AND coalesce(co.hourly_rate, 0) > 0
        THEN round(co.hourly_rate * t.duration_minutes / 60.0, 2) END AS court_cost,
      coalesce((SELECT f.split_mode FROM league_fees f WHERE f.season_id = t.season_id AND f.kind = 'MATCH_COURT'),
        'HALF') AS court_split
    FROM matches m JOIN tournaments t ON t.id = m.tournament_id
    LEFT JOIN courts co ON co.id = m.court_id
    WHERE m.id = p_match
  ),
  sides AS (
    SELECT 'HOME' AS side, m.home_club_id AS club FROM m
    UNION ALL
    SELECT 'AWAY', m.away_club_id FROM m
  ),
  fee AS (
    SELECT f.kind::text AS kind, f.amount, f.split_mode
    FROM league_fees f JOIN m ON f.season_id = m.sid
    WHERE f.enabled AND f.amount > 0
  ),
  cards AS (
    SELECT mc.club_id,
      CASE mc.color WHEN 'YELLOW' THEN 'CARD_YELLOW' ELSE 'CARD_RED' END AS kind,
      -- El nombre se guarda en la tarjeta al capturarla; el id se pierde si se borra el jugador (SET NULL)
      coalesce(nullif(mc.player_name, ''), mc.player_id, 'sin-nombre') AS who,
      coalesce(nullif(mc.player_name, ''), pl.name, 'Jugador') AS pname,
      row_number() OVER (
        PARTITION BY mc.club_id, mc.color, coalesce(nullif(mc.player_name, ''), mc.player_id, 'sin-nombre')
        ORDER BY mc.minute NULLS LAST, mc.id) AS n
    FROM match_cards mc LEFT JOIN players pl ON pl.id = mc.player_id
    WHERE mc.match_id = p_match
  )
  SELECT 'MATCH_REFEREE', 'match:' || m.id, s.club, cl.name,
    CASE WHEN f.split_mode <> 'HALF' THEN f.amount WHEN s.side = 'HOME' THEN round(f.amount / 2, 2)
      ELSE f.amount - round(f.amount / 2, 2) END,
    league_kind_label('MATCH_REFEREE') || ' · ' || m.label, m.day, m.sid, m.tid
  FROM m CROSS JOIN sides s
  JOIN clubs cl ON cl.id = s.club
  LEFT JOIN fee f ON f.kind = 'MATCH_REFEREE'
  WHERE m.status = 'PLAYED' AND NOT m.walkover
  UNION ALL
  SELECT 'MATCH_COURT', 'match:' || m.id, s.club, cl.name,
    CASE WHEN m.court_split = 'EACH' THEN m.court_cost WHEN s.side = 'HOME' THEN round(m.court_cost / 2, 2)
      ELSE m.court_cost - round(m.court_cost / 2, 2) END,
    league_kind_label('MATCH_COURT') || ' · ' || m.label, m.day, m.sid, m.tid
  FROM m CROSS JOIN sides s
  JOIN clubs cl ON cl.id = s.club
  WHERE m.status = 'PLAYED' AND NOT m.walkover
  UNION ALL
  SELECT 'WALKOVER', 'match:' || m.id, s.club, cl.name, f.amount,
    league_kind_label('WALKOVER') || ' · ' || m.label, m.day, m.sid, m.tid
  FROM m CROSS JOIN sides s
  JOIN clubs cl ON cl.id = s.club
  LEFT JOIN fee f ON f.kind = 'WALKOVER'
  WHERE m.no_show IS NOT NULL AND (m.no_show::text = 'BOTH' OR m.no_show::text = s.side)
  UNION ALL
  SELECT c.kind, 'match:' || m.id || ':' || c.who || ':' || c.n, c.club_id, cl.name, f.amount,
    league_kind_label(c.kind) || ' · ' || c.pname || ' · ' || m.label, m.day, m.sid, m.tid
  FROM m CROSS JOIN cards c
  JOIN clubs cl ON cl.id = c.club_id
  LEFT JOIN fee f ON f.kind = c.kind
  WHERE m.status = 'PLAYED' AND NOT m.walkover
$$;
REVOKE ALL ON FUNCTION public.league_match_expected(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.league_sync_match(p_match text)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_expected jsonb;
  r record;
BEGIN
  -- Sin early exit por tarifas: el uso de cancha se cobra aunque no haya ninguna tarifa guardada
  IF p_match IS NULL THEN
    RETURN;
  END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(e)), '[]'::jsonb) INTO v_expected FROM league_match_expected(p_match) e;

  UPDATE league_charges c
  SET status = 'CANCELADO', auto_cancelled = true, updated_at = now()
  WHERE c.match_id = p_match AND c.source_key IS NOT NULL AND c.status = 'PENDIENTE'
    AND NOT EXISTS (SELECT 1 FROM league_payments lp WHERE lp.charge_id = c.id)
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_to_recordset(v_expected) AS e (e_kind text, e_key text, e_club text)
      WHERE e.e_kind = c.kind::text AND e.e_key = c.source_key AND e.e_club IS NOT DISTINCT FROM c.club_id);

  FOR r IN
    SELECT * FROM jsonb_to_recordset(v_expected) AS e (e_kind text, e_key text, e_club text, e_payer text,
      e_amount numeric, e_concept text, e_day date, e_season text, e_tournament text)
    WHERE e.e_amount IS NOT NULL
  LOOP
    PERFORM league_charge_put(r.e_kind, r.e_key, r.e_club, r.e_payer, '', r.e_amount, r.e_concept, r.e_day,
      r.e_season, r.e_tournament, p_match, false);
  END LOOP;
END
$$;
REVOKE ALL ON FUNCTION public.league_sync_match(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.league_trg_matches()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE league_charges c
    SET status = 'CANCELADO', auto_cancelled = true, updated_at = now()
    WHERE c.match_id = OLD.id AND c.source_key IS NOT NULL AND c.status = 'PENDIENTE'
      AND NOT EXISTS (SELECT 1 FROM league_payments lp WHERE lp.charge_id = c.id);
    RETURN OLD;
  END IF;
  PERFORM league_sync_match(NEW.id);
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS league_matches_sync ON matches;
CREATE TRIGGER league_matches_sync
  AFTER INSERT OR UPDATE OF status, walkover, no_show, match_date, home_club_id, away_club_id, round_label, court_id
  ON matches FOR EACH ROW EXECUTE FUNCTION league_trg_matches();
DROP TRIGGER IF EXISTS league_matches_delete ON matches;
CREATE TRIGGER league_matches_delete BEFORE DELETE ON matches FOR EACH ROW EXECUTE FUNCTION league_trg_matches();

CREATE OR REPLACE FUNCTION public.league_trg_match_cards()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM league_sync_match(OLD.match_id);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND (TG_OP = 'INSERT' OR NEW.match_id IS DISTINCT FROM OLD.match_id) THEN
    PERFORM league_sync_match(NEW.match_id);
  END IF;
  RETURN NULL;
END
$$;
DROP TRIGGER IF EXISTS league_match_cards_sync ON match_cards;
CREATE TRIGGER league_match_cards_sync
  AFTER INSERT OR UPDATE OR DELETE ON match_cards FOR EACH ROW EXECUTE FUNCTION league_trg_match_cards();

-- ---------- Inscripción a torneos ----------

CREATE OR REPLACE FUNCTION public.league_sync_enrollment(p_tournament text, p_club text)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_enrolled boolean;
  v_season text;
  v_tname text;
  v_cname text;
  v_day date;
  r record;
BEGIN
  IF p_tournament IS NULL OR p_club IS NULL
     OR (NOT EXISTS (SELECT 1 FROM league_fees WHERE enabled)
         AND NOT EXISTS (SELECT 1 FROM league_charges WHERE source_key = 'tournament:' || p_tournament AND club_id = p_club)) THEN
    RETURN;
  END IF;
  -- La fecha del cargo es la de la inscripción (también al registrar inscripciones que ya existían)
  SELECT true, coalesce(created_at::date, CURRENT_DATE) INTO v_enrolled, v_day
  FROM tournament_clubs WHERE tournament_id = p_tournament AND club_id = p_club;
  v_enrolled := coalesce(v_enrolled, false);
  SELECT t.season_id, t.name INTO v_season, v_tname FROM tournaments t WHERE t.id = p_tournament;
  SELECT name INTO v_cname FROM clubs WHERE id = p_club;

  IF NOT v_enrolled OR v_season IS NULL THEN
    UPDATE league_charges c
    SET status = 'CANCELADO', auto_cancelled = true, updated_at = now()
    WHERE c.source_key = 'tournament:' || p_tournament AND c.club_id = p_club
      AND c.kind IN ('TOURNAMENT_ENROLLMENT', 'DEPOSIT') AND c.status = 'PENDIENTE'
      AND NOT EXISTS (SELECT 1 FROM league_payments lp WHERE lp.charge_id = c.id);
    RETURN;
  END IF;

  FOR r IN
    SELECT f.kind::text AS kind, f.amount FROM league_fees f
    WHERE f.season_id = v_season AND f.enabled AND f.amount > 0 AND f.kind = 'TOURNAMENT_ENROLLMENT'
  LOOP
    PERFORM league_charge_put(r.kind, 'tournament:' || p_tournament, p_club, v_cname, '', r.amount,
      league_kind_label(r.kind) || ' · ' || v_tname, v_day, v_season, p_tournament, NULL, false);
  END LOOP;
END
$$;
REVOKE ALL ON FUNCTION public.league_sync_enrollment(text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.league_trg_tournament_clubs()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM league_sync_enrollment(OLD.tournament_id, OLD.club_id);
  ELSE
    PERFORM league_sync_enrollment(NEW.tournament_id, NEW.club_id);
  END IF;
  RETURN NULL;
END
$$;
DROP TRIGGER IF EXISTS league_tournament_clubs_sync ON tournament_clubs;
CREATE TRIGGER league_tournament_clubs_sync
  AFTER INSERT OR DELETE ON tournament_clubs FOR EACH ROW EXECUTE FUNCTION league_trg_tournament_clubs();

-- ---------- Registro del club en la plataforma: un solo pago ----------

-- Se cobra una vez por club (source_key 'club:<id>'), al darse de alta, con la tarifa de la temporada de
-- su fecha de alta. No depende de los torneos. Un club borrado (deleted_at) ya no genera el cobro.
CREATE OR REPLACE FUNCTION public.league_sync_club_registration(p_club text)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  c record;
  v_season text;
  v_fee numeric;
BEGIN
  IF p_club IS NULL THEN
    RETURN;
  END IF;
  SELECT id, name, created_at::date AS day INTO c FROM clubs WHERE id = p_club AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  v_season := league_season_on(c.day);
  v_fee := league_registration_fee(v_season);
  IF v_fee IS NULL THEN
    RETURN;
  END IF;
  PERFORM league_charge_put('CLUB_REGISTRATION', 'club:' || c.id, c.id, c.name, '', v_fee,
    'Registro del club en la plataforma', c.day, v_season, NULL, NULL, false);
END
$$;
REVOKE ALL ON FUNCTION public.league_sync_club_registration(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.league_trg_clubs_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM league_sync_club_registration(NEW.id);
  RETURN NULL;
END
$$;
DROP TRIGGER IF EXISTS league_clubs_insert ON clubs;
CREATE TRIGGER league_clubs_insert AFTER INSERT ON clubs FOR EACH ROW EXECUTE FUNCTION league_trg_clubs_insert();

-- ---------- Renta de canchas (reservas manuales) ----------

-- Id del abono automático de una renta. md5 para que quepa en varchar(128) aunque el id de la renta mida 128.
CREATE OR REPLACE FUNCTION public.league_hold_payment_id(p_hold text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT 'auto-hold:' || md5(p_hold)
$$;

-- Cada renta manual es un cobro a quien aparta (el nombre de la nota), pagado al apartar: completo
-- (court_holds.deposit NULL) o con un anticipo. El abono automático cubre eso y el resto se cobra después
-- (set_league_charge_paid). El precio se fija al apartar con el costo por hora de la cancha; solo se vuelve a
-- calcular si cambian la cancha, la fecha o el horario de la renta (p_reprice), nunca al resincronizar.
-- Si la renta ya no existe, lo pagado se devolvió: se borran los abonos de su cargo y el cargo se anula
-- (delete_manual_court_hold con keepPaid deja antes el cargo como historial, sin clave). Si la tarifa de renta
-- está apagada no se crean cobros nuevos (los existentes se quedan).
DROP FUNCTION IF EXISTS public.league_sync_hold(text);
CREATE OR REPLACE FUNCTION public.league_sync_hold(p_hold text, p_reprice boolean)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  h record;
  v_season text;
  v_minutes int;
  v_amount numeric := 0;
  v_payer text;
  v_concept text;
  v_charge league_charges;
  v_other numeric;
  v_auto numeric;
  v_key text := 'hold:' || p_hold;
  v_pay text := league_hold_payment_id(p_hold);
BEGIN
  IF p_hold IS NULL THEN
    RETURN;
  END IF;
  SELECT ch.*, co.name AS court_name, co.hourly_rate INTO h
  FROM court_holds ch
  JOIN courts co ON co.id = ch.court_id
  WHERE ch.id = p_hold AND ch.source = 'MANUAL';

  IF NOT FOUND THEN
    -- Renta cancelada: se devolvió lo pagado (no se tocan las condonadas ni las canceladas a mano)
    DELETE FROM league_payments lp
    USING league_charges c
    WHERE lp.charge_id = c.id AND c.kind = 'COURT_RENTAL' AND c.source_key = v_key
      AND c.status NOT IN ('CANCELADO', 'CONDONADO');
    UPDATE league_charges c
    SET status = 'CANCELADO', auto_cancelled = true, updated_at = now()
    WHERE c.kind = 'COURT_RENTAL' AND c.source_key = v_key AND c.status NOT IN ('CANCELADO', 'CONDONADO');
    RETURN;
  END IF;

  v_season := league_season_on(h.hold_date);
  v_minutes := (split_part(h.end_time, ':', 1)::int * 60 + split_part(h.end_time, ':', 2)::int)
    - (split_part(h.start_time, ':', 1)::int * 60 + split_part(h.start_time, ':', 2)::int);
  IF league_fee_on(v_season, 'COURT_RENTAL') THEN
    v_amount := round(coalesce(h.hourly_rate, 0) * v_minutes / 60.0, 2);
  END IF;

  v_payer := coalesce(nullif(split_part(h.note, ' · ', 1), ''), 'Externo');
  v_concept := league_kind_label('COURT_RENTAL') || ' · ' || h.court_name || ' · ' || to_char(h.hold_date, 'DD/MM/YYYY')
    || ' ' || h.start_time || '–' || h.end_time;
  SELECT * INTO v_charge FROM league_charges
  WHERE kind = 'COURT_RENTAL' AND source_key = v_key AND club_id IS NULL
  FOR UPDATE;
  -- Sin precio (tarifa apagada o cancha en $0) no se crea ni se revive un cobro; el que ya existe conserva su
  -- monto y su abono sigue al anticipo
  IF v_amount <= 0 AND (NOT FOUND OR v_charge.status = 'CANCELADO') THEN
    RETURN;
  END IF;
  IF v_charge.id IS NULL THEN
    INSERT INTO league_charges (id, kind, club_id, payer_name, payer_contact, concept, amount, charged_on,
      season_id, source_key)
    VALUES (gen_random_uuid()::text, 'COURT_RENTAL', NULL, left(v_payer, 160), left(h.guest_email, 160),
      left(v_concept, 160), v_amount, least(h.hold_date, CURRENT_DATE), v_season, v_key)
    RETURNING * INTO v_charge;
  ELSIF (v_charge.status = 'CANCELADO' AND NOT v_charge.auto_cancelled) OR v_charge.status = 'CONDONADO' THEN
    -- El administrador la canceló o la condonó a mano: no se toca
    RETURN;
  ELSE
    UPDATE league_charges
    SET amount = CASE WHEN (p_reprice OR status = 'CANCELADO') AND v_amount > 0 THEN v_amount ELSE amount END,
        concept = CASE WHEN (p_reprice OR status = 'CANCELADO') AND v_amount > 0 THEN left(v_concept, 160) ELSE concept END,
        payer_name = left(v_payer, 160),
        payer_contact = left(h.guest_email, 160),
        status = CASE WHEN status = 'CANCELADO' THEN 'PENDIENTE' ELSE status END,
        auto_cancelled = false, updated_at = now()
    WHERE id = v_charge.id
    RETURNING * INTO v_charge;
  END IF;

  -- El abono automático cubre lo pagado al apartar (todo o el anticipo), sin pasar de lo que falte después
  -- de los demás abonos (el resto cobrado, o cargos de la primera versión pagados a mano); el de la primera
  -- versión, con id 'auto-hold:' || id, se reemplaza por el nuevo.
  DELETE FROM league_payments WHERE id = 'auto-hold:' || p_hold AND id <> v_pay;
  SELECT coalesce(sum(amount), 0) INTO v_other FROM league_payments WHERE charge_id = v_charge.id AND id <> v_pay;
  v_auto := greatest(0, least(coalesce(h.deposit, v_charge.amount), v_charge.amount - v_other));
  IF v_auto > 0 THEN
    INSERT INTO league_payments (id, charge_id, amount, paid_on, method, note)
    VALUES (v_pay, v_charge.id, v_auto, least(h.hold_date, CURRENT_DATE), 'OTRO',
      CASE WHEN coalesce(h.deposit, v_charge.amount) < v_charge.amount THEN 'Anticipo al apartar' ELSE 'Pagada al apartar' END)
    ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount, charge_id = EXCLUDED.charge_id, note = EXCLUDED.note;
  ELSE
    DELETE FROM league_payments WHERE id = v_pay;
  END IF;
  PERFORM league_charge_refresh(v_charge.id);
END
$$;
REVOKE ALL ON FUNCTION public.league_sync_hold(text, boolean) FROM PUBLIC, anon, authenticated;

-- Cobro vigente de una renta (sin los cancelados) para Canchas: monto, lo abonado, estado y restPaid (lo cobrado
-- aparte del abono automático, o sea el resto). NULL si no hay (tarifa apagada o cancha sin costo).
CREATE OR REPLACE FUNCTION public.league_hold_rental(p_hold text)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('chargeId', c.id, 'amount', c.amount, 'status', to_jsonb(c.status),
    'paid', coalesce((SELECT sum(lp.amount) FROM league_payments lp WHERE lp.charge_id = c.id), 0),
    'restPaid', coalesce((SELECT sum(lp.amount) FROM league_payments lp
      WHERE lp.charge_id = c.id AND lp.id NOT LIKE 'auto-hold:%'), 0))
  FROM league_charges c
  WHERE c.kind = 'COURT_RENTAL' AND c.source_key = 'hold:' || p_hold AND c.club_id IS NULL AND c.status <> 'CANCELADO'
$$;
REVOKE ALL ON FUNCTION public.league_hold_rental(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.league_trg_court_holds()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Una renta que ya pasó (en la fecha de la liga) se jugó: si se borra (p. ej. al borrar la cancha) su cobro
    -- queda en las finanzas tal cual. Las cancelaciones con decisión (delete_manual_court_hold con keepPaid) no
    -- dependen de este corte.
    IF OLD.hold_date < league_today() THEN
      RETURN NULL;
    END IF;
    PERFORM league_sync_hold(OLD.id, false);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM league_sync_hold(NEW.id, true);
  ELSE
    PERFORM league_sync_hold(NEW.id,
      (OLD.court_id, OLD.hold_date, OLD.start_time, OLD.end_time) IS DISTINCT FROM
      (NEW.court_id, NEW.hold_date, NEW.start_time, NEW.end_time));
  END IF;
  RETURN NULL;
END
$$;
DROP TRIGGER IF EXISTS league_court_holds_sync ON court_holds;
CREATE TRIGGER league_court_holds_sync
  AFTER INSERT OR UPDATE OR DELETE ON court_holds FOR EACH ROW EXECUTE FUNCTION league_trg_court_holds();

-- ---------- Publicidad ----------

CREATE OR REPLACE FUNCTION public.league_sync_ad(p_ad text)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  a record;
  v_season text;
BEGIN
  IF p_ad IS NULL THEN
    RETURN;
  END IF;
  SELECT * INTO a FROM ads WHERE id = p_ad AND price > 0;
  IF NOT FOUND THEN
    UPDATE league_charges c
    SET status = 'CANCELADO', auto_cancelled = true, updated_at = now()
    WHERE c.source_key = 'ad:' || p_ad AND c.kind = 'AD' AND c.status = 'PENDIENTE'
      AND NOT EXISTS (SELECT 1 FROM league_payments lp WHERE lp.charge_id = c.id);
    RETURN;
  END IF;
  v_season := league_season_on(a.starts_on);
  -- Un anuncio con precio se cobra solo, salvo que la tarifa de publicidad esté apagada
  IF NOT league_fee_on(v_season, 'AD') THEN
    RETURN;
  END IF;
  PERFORM league_charge_put('AD', 'ad:' || p_ad, NULL, coalesce(nullif(a.advertiser_name, ''), a.brand),
    a.advertiser_contact, a.price,
    league_kind_label('AD') || ' · ' || a.brand || ' · ' || to_char(a.starts_on, 'DD/MM/YYYY') || '–'
      || to_char(a.ends_on, 'DD/MM/YYYY'),
    a.starts_on, v_season, NULL, NULL, true);
END
$$;
REVOKE ALL ON FUNCTION public.league_sync_ad(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.league_trg_ads()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM league_sync_ad(OLD.id);
  ELSE
    PERFORM league_sync_ad(NEW.id);
  END IF;
  RETURN NULL;
END
$$;
DROP TRIGGER IF EXISTS league_ads_sync ON ads;
CREATE TRIGGER league_ads_sync
  AFTER INSERT OR UPDATE OF price, advertiser_name, advertiser_contact, brand, starts_on, ends_on OR DELETE
  ON ads FOR EACH ROW EXECUTE FUNCTION league_trg_ads();

-- ---------- Club borrado del todo ----------

-- La app solo oculta clubes (deleted_at), pero un borrado real (p. ej. la limpieza de la demo) deja sus cobros
-- sin club (ON DELETE SET NULL). Antes se les quita la clave automática: quedan como historial y no chocan en
-- league_charges_source_idx con los cobros del rival del mismo partido, que también quedarían sin club.
CREATE OR REPLACE FUNCTION public.league_trg_clubs_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE league_charges SET source_key = NULL, updated_at = now() WHERE club_id = OLD.id AND source_key IS NOT NULL;
  RETURN OLD;
END
$$;
DROP TRIGGER IF EXISTS league_clubs_delete ON clubs;
CREATE TRIGGER league_clubs_delete BEFORE DELETE ON clubs FOR EACH ROW EXECUTE FUNCTION league_trg_clubs_delete();

-- ---------- Lo que ya pasó ----------

-- Registra los cobros que falten de una temporada: registro de los clubes dados de alta en ella, inscripciones
-- y partidos de sus torneos, y rentas y anuncios cuya fecha cae en ella. No duplica (league_charge_put / source_key). Devuelve cuántos cargos
-- activos hay de más al terminar.
CREATE OR REPLACE FUNCTION public.league_backfill_season(p_season text)
RETURNS int LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_before int;
  r record;
BEGIN
  IF p_season IS NULL THEN
    RETURN 0;
  END IF;
  SELECT count(*) INTO v_before FROM league_charges WHERE status <> 'CANCELADO';
  FOR r IN
    SELECT id FROM clubs WHERE deleted_at IS NULL AND league_season_on(created_at::date) = p_season ORDER BY created_at, id
  LOOP
    PERFORM league_sync_club_registration(r.id);
  END LOOP;
  FOR r IN
    SELECT tc.tournament_id, tc.club_id FROM tournament_clubs tc
    JOIN tournaments t ON t.id = tc.tournament_id
    WHERE t.season_id = p_season
    ORDER BY tc.created_at, tc.tournament_id, tc.club_id
  LOOP
    PERFORM league_sync_enrollment(r.tournament_id, r.club_id);
  END LOOP;
  FOR r IN
    SELECT m.id FROM matches m JOIN tournaments t ON t.id = m.tournament_id
    WHERE t.season_id = p_season AND (m.status = 'PLAYED' OR m.no_show IS NOT NULL)
  LOOP
    PERFORM league_sync_match(r.id);
  END LOOP;
  FOR r IN SELECT id FROM court_holds WHERE source = 'MANUAL' AND league_season_on(hold_date) = p_season LOOP
    PERFORM league_sync_hold(r.id, false);
  END LOOP;
  FOR r IN SELECT id FROM ads WHERE price > 0 AND league_season_on(starts_on) = p_season LOOP
    PERFORM league_sync_ad(r.id);
  END LOOP;
  RETURN (SELECT count(*) FROM league_charges WHERE status <> 'CANCELADO') - v_before;
END
$$;
REVOKE ALL ON FUNCTION public.league_backfill_season(text) FROM PUBLIC, anon, authenticated;

-- ---------- Lecturas (superadmin) ----------

-- Temporadas, torneos, clubes y tarifas de una temporada (si no se indica, la de hoy; si ninguna la cubre, la más reciente)
CREATE OR REPLACE FUNCTION public.admin_finance_setup(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_season text;
BEGIN
  PERFORM require_platform_admin();
  v_season := coalesce(
    (SELECT id FROM seasons WHERE id = p ->> 'seasonId'),
    league_season_on(CURRENT_DATE),
    (SELECT id FROM seasons ORDER BY active DESC, start_date DESC NULLS LAST, id LIMIT 1));
  RETURN jsonb_build_object(
    'seasonId', v_season,
    'seasons', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'active', s.active,
        'startDate', to_jsonb(s.start_date), 'endDate', to_jsonb(s.end_date))
        ORDER BY s.active DESC, s.start_date DESC NULLS LAST, s.id), '[]'::jsonb)
      FROM seasons s),
    'tournaments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'seasonId', t.season_id)
        ORDER BY t.start_date DESC NULLS LAST, t.name), '[]'::jsonb)
      FROM tournaments t),
    'clubs', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'active', c.active) ORDER BY c.name, c.id), '[]'::jsonb)
      FROM clubs c WHERE c.deleted_at IS NULL),
    'fees', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('kind', to_jsonb(f.kind), 'enabled', f.enabled, 'amount', f.amount,
        'period', f.period, 'splitMode', f.split_mode, 'includesRegistration', f.includes_registration)
        ORDER BY f.kind), '[]'::jsonb)
      FROM league_fees f WHERE f.season_id = v_season)
  );
END
$$;
CALL api_expose('admin_finance_setup', 'USER');

-- Un cargo con lo abonado, el saldo y sus abonos
CREATE OR REPLACE FUNCTION public.league_charge_json(p_charge text)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'id', c.id, 'kind', to_jsonb(c.kind), 'status', to_jsonb(c.status), 'concept', c.concept,
    'amount', c.amount, 'paid', cp.paid, 'balance', CASE WHEN c.status IN ('PENDIENTE', 'PARCIAL') THEN c.amount - cp.paid ELSE 0 END,
    'chargedOn', to_jsonb(c.charged_on), 'dueDate', to_jsonb(c.due_date),
    'club', CASE WHEN c.club_id IS NULL THEN NULL ELSE jsonb_build_object('id', c.club_id, 'name', cl.name) END,
    'payerName', c.payer_name, 'payerContact', c.payer_contact,
    'seasonId', c.season_id,
    'tournament', CASE WHEN c.tournament_id IS NULL THEN NULL ELSE jsonb_build_object('id', c.tournament_id, 'name', t.name) END,
    'matchId', c.match_id,
    'note', c.note, 'automatic', c.source_key IS NOT NULL, 'createdAt', api_ts(c.created_at),
    'payments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', lp.id, 'amount', lp.amount, 'paidOn', to_jsonb(lp.paid_on),
        'method', to_jsonb(lp.method), 'note', lp.note) ORDER BY lp.paid_on, lp.created_at), '[]'::jsonb)
      FROM league_payments lp WHERE lp.charge_id = c.id)
  )
  FROM league_charges c
  JOIN league_charge_paid cp ON cp.id = c.id
  LEFT JOIN clubs cl ON cl.id = c.club_id
  LEFT JOIN tournaments t ON t.id = c.tournament_id
  WHERE c.id = p_charge
$$;
REVOKE ALL ON FUNCTION public.league_charge_json(text) FROM PUBLIC, anon, authenticated;

-- Cargos con filtros opcionales: seasonId, tournamentId, clubId, status, kind. Los más recientes primero (500).
CREATE OR REPLACE FUNCTION public.admin_league_charges(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM require_platform_admin();
  RETURN jsonb_build_object('charges', (
    SELECT coalesce(jsonb_agg(league_charge_json(c.id) ORDER BY c.charged_on DESC, c.created_at DESC, c.id), '[]'::jsonb)
    FROM (
      SELECT c.id, c.charged_on, c.created_at FROM league_charges c
      WHERE (p ->> 'seasonId' IS NULL OR c.season_id = p ->> 'seasonId')
        AND (p ->> 'tournamentId' IS NULL OR c.tournament_id = p ->> 'tournamentId')
        AND (p ->> 'clubId' IS NULL OR c.club_id = p ->> 'clubId')
        AND (p ->> 'status' IS NULL OR c.status::text = p ->> 'status')
        AND (p ->> 'kind' IS NULL OR c.kind::text = p ->> 'kind')
      ORDER BY c.charged_on DESC, c.created_at DESC, c.id
      LIMIT 500
    ) c));
END
$$;
CALL api_expose('admin_league_charges', 'USER');

CREATE OR REPLACE FUNCTION public.admin_league_expenses(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM require_platform_admin();
  RETURN jsonb_build_object('expenses', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', e.id, 'category', e.category, 'description', e.description, 'amount', e.amount,
      'spentOn', to_jsonb(e.spent_on), 'seasonId', e.season_id,
      'tournament', CASE WHEN e.tournament_id IS NULL THEN NULL ELSE jsonb_build_object('id', e.tournament_id, 'name', t.name) END,
      'chargeId', e.charge_id)
      ORDER BY e.spent_on DESC, e.created_at DESC, e.id), '[]'::jsonb)
    FROM (
      SELECT * FROM league_expenses e
      WHERE (p ->> 'seasonId' IS NULL OR e.season_id = p ->> 'seasonId')
        AND (p ->> 'tournamentId' IS NULL OR e.tournament_id = p ->> 'tournamentId')
      ORDER BY e.spent_on DESC, e.created_at DESC, e.id
      LIMIT 500
    ) e
    LEFT JOIN tournaments t ON t.id = e.tournament_id));
END
$$;
CALL api_expose('admin_league_expenses', 'USER');

-- Resumen por periodo. scope: TOTAL | YEAR (year) | MONTH (year, month) | SEASON (seasonId) | TOURNAMENT (tournamentId).
-- Lo cobrado cuenta por la fecha del abono; lo generado y lo pendiente por la fecha del cargo; gastos y pérdidas
-- por la fecha del gasto. Temporada y torneo filtran por el vínculo del cargo o del gasto.
-- No es STABLE: arma tablas temporales, y PostgREST ejecuta las STABLE en transacciones de solo lectura.
CREATE OR REPLACE FUNCTION public.admin_finance_summary(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_scope text := p ->> 'scope';
  v_year int;
  v_month int;
  v_from date;
  v_to date;
  v_season text;
  v_tournament text;
  v_summary jsonb;
  v_series jsonb := '[]'::jsonb;
BEGIN
  PERFORM require_platform_admin();
  IF v_scope IS NULL OR v_scope NOT IN ('TOTAL', 'YEAR', 'MONTH', 'SEASON', 'TOURNAMENT') THEN
    RETURN jsonb_build_object('summary', NULL);
  END IF;
  IF v_scope IN ('YEAR', 'MONTH') THEN
    IF coalesce(p ->> 'year', '') !~ '^(19|20)[0-9]{2}$'
       OR (v_scope = 'MONTH' AND coalesce(p ->> 'month', '') !~ '^(0?[1-9]|1[0-2])$') THEN
      RETURN jsonb_build_object('summary', NULL);
    END IF;
    v_year := (p ->> 'year')::int;
    IF v_scope = 'YEAR' THEN
      v_from := make_date(v_year, 1, 1);
      v_to := make_date(v_year, 12, 31);
    ELSE
      v_month := (p ->> 'month')::int;
      v_from := make_date(v_year, v_month, 1);
      v_to := (v_from + interval '1 month' - interval '1 day')::date;
    END IF;
  ELSIF v_scope = 'SEASON' THEN
    SELECT id INTO v_season FROM seasons WHERE id = p ->> 'seasonId';
    IF v_season IS NULL THEN RETURN jsonb_build_object('summary', NULL); END IF;
  ELSIF v_scope = 'TOURNAMENT' THEN
    SELECT id INTO v_tournament FROM tournaments WHERE id = p ->> 'tournamentId';
    IF v_tournament IS NULL THEN RETURN jsonb_build_object('summary', NULL); END IF;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS league_sum_charges (id text, kind text, status text, amount numeric, paid numeric,
    charged_on date, match_id text, club_id text) ON COMMIT DROP;
  CREATE TEMP TABLE IF NOT EXISTS league_sum_payments (charge_id text, kind text, amount numeric, paid_on date,
    match_id text) ON COMMIT DROP;
  CREATE TEMP TABLE IF NOT EXISTS league_sum_expenses (category text, amount numeric, spent_on date) ON COMMIT DROP;
  DELETE FROM league_sum_charges WHERE true;
  DELETE FROM league_sum_payments WHERE true;
  DELETE FROM league_sum_expenses WHERE true;

  INSERT INTO league_sum_charges
  SELECT c.id, c.kind::text, c.status::text, c.amount, cp.paid, c.charged_on, c.match_id, c.club_id
  FROM league_charges c JOIN league_charge_paid cp ON cp.id = c.id
  WHERE c.status <> 'CANCELADO'
    AND (v_scope = 'TOTAL'
      OR (v_scope IN ('YEAR', 'MONTH') AND c.charged_on BETWEEN v_from AND v_to)
      OR (v_scope = 'SEASON' AND c.season_id = v_season)
      OR (v_scope = 'TOURNAMENT' AND c.tournament_id = v_tournament));

  INSERT INTO league_sum_payments
  SELECT lp.charge_id, c.kind::text, lp.amount, lp.paid_on, c.match_id
  FROM league_payments lp JOIN league_charges c ON c.id = lp.charge_id
  WHERE v_scope = 'TOTAL'
    OR (v_scope IN ('YEAR', 'MONTH') AND lp.paid_on BETWEEN v_from AND v_to)
    OR (v_scope = 'SEASON' AND c.season_id = v_season)
    OR (v_scope = 'TOURNAMENT' AND c.tournament_id = v_tournament);

  INSERT INTO league_sum_expenses
  SELECT e.category, e.amount, e.spent_on
  FROM league_expenses e
  WHERE v_scope = 'TOTAL'
    OR (v_scope IN ('YEAR', 'MONTH') AND e.spent_on BETWEEN v_from AND v_to)
    OR (v_scope = 'SEASON' AND e.season_id = v_season)
    OR (v_scope = 'TOURNAMENT' AND e.tournament_id = v_tournament);

  SELECT jsonb_build_object(
    'generated', g.generated, 'collected', col.collected, 'pending', g.pending, 'condoned', g.condoned,
    'expenses', ex.expenses, 'refunds', ex.refunds, 'damages', ex.damages,
    'losses', g.condoned + ex.refunds + ex.damages,
    'result', col.collected - ex.expenses - ex.refunds - ex.damages)
  INTO v_summary
  FROM
    (SELECT coalesce(sum(amount), 0) AS generated,
       coalesce(sum(amount - paid) FILTER (WHERE status IN ('PENDIENTE', 'PARCIAL')), 0) AS pending,
       coalesce(sum(amount - paid) FILTER (WHERE status = 'CONDONADO'), 0) AS condoned
     FROM league_sum_charges) g,
    (SELECT coalesce(sum(amount), 0) AS collected FROM league_sum_payments) col,
    (SELECT coalesce(sum(amount) FILTER (WHERE category NOT IN ('DEVOLUCION', 'DANOS')), 0) AS expenses,
       coalesce(sum(amount) FILTER (WHERE category = 'DEVOLUCION'), 0) AS refunds,
       coalesce(sum(amount) FILTER (WHERE category = 'DANOS'), 0) AS damages
     FROM league_sum_expenses) ex;

  IF v_scope IN ('YEAR', 'SEASON', 'TOTAL') THEN
    WITH bounds AS (
      SELECT CASE
          WHEN v_scope = 'YEAR' THEN v_from
          WHEN v_scope = 'SEASON' THEN date_trunc('month', coalesce(
            (SELECT start_date FROM seasons WHERE id = v_season),
            least((SELECT min(charged_on) FROM league_sum_charges), (SELECT min(paid_on) FROM league_sum_payments),
              (SELECT min(spent_on) FROM league_sum_expenses)), CURRENT_DATE))::date
          ELSE date_trunc('year', coalesce(least((SELECT min(charged_on) FROM league_sum_charges),
            (SELECT min(paid_on) FROM league_sum_payments), (SELECT min(spent_on) FROM league_sum_expenses)),
            CURRENT_DATE))::date
        END AS first_day,
        CASE
          WHEN v_scope = 'YEAR' THEN v_to
          WHEN v_scope = 'SEASON' THEN greatest(
            coalesce((SELECT end_date FROM seasons WHERE id = v_season), CURRENT_DATE),
            coalesce((SELECT max(charged_on) FROM league_sum_charges), CURRENT_DATE),
            coalesce((SELECT max(paid_on) FROM league_sum_payments), CURRENT_DATE),
            coalesce((SELECT max(spent_on) FROM league_sum_expenses), CURRENT_DATE))
          ELSE greatest(CURRENT_DATE,
            coalesce((SELECT max(charged_on) FROM league_sum_charges), CURRENT_DATE),
            coalesce((SELECT max(paid_on) FROM league_sum_payments), CURRENT_DATE),
            coalesce((SELECT max(spent_on) FROM league_sum_expenses), CURRENT_DATE))
        END AS last_day
    ),
    buckets AS (
      SELECT b::date AS b_from,
        (b + CASE WHEN v_scope = 'TOTAL' THEN interval '1 year' ELSE interval '1 month' END - interval '1 day')::date AS b_to
      FROM bounds,
        generate_series(bounds.first_day, bounds.last_day,
          CASE WHEN v_scope = 'TOTAL' THEN interval '1 year' ELSE interval '1 month' END) AS b
      LIMIT 60
    )
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'key', to_char(k.b_from, CASE WHEN v_scope = 'TOTAL' THEN 'YYYY' ELSE 'YYYY-MM' END),
      'label', CASE WHEN v_scope = 'TOTAL' THEN to_char(k.b_from, 'YYYY') ELSE league_month_label(k.b_from) END,
      'generated', (SELECT coalesce(sum(amount), 0) FROM league_sum_charges WHERE charged_on BETWEEN k.b_from AND k.b_to),
      'collected', (SELECT coalesce(sum(amount), 0) FROM league_sum_payments WHERE paid_on BETWEEN k.b_from AND k.b_to),
      'expenses', (SELECT coalesce(sum(amount), 0) FROM league_sum_expenses
        WHERE spent_on BETWEEN k.b_from AND k.b_to AND category NOT IN ('DEVOLUCION', 'DANOS')),
      'losses', (SELECT coalesce(sum(amount), 0) FROM league_sum_expenses
          WHERE spent_on BETWEEN k.b_from AND k.b_to AND category IN ('DEVOLUCION', 'DANOS'))
        + (SELECT coalesce(sum(amount - paid), 0) FROM league_sum_charges
          WHERE status = 'CONDONADO' AND charged_on BETWEEN k.b_from AND k.b_to))
      ORDER BY k.b_from), '[]'::jsonb)
    INTO v_series
    FROM buckets k;
  ELSIF v_scope = 'TOURNAMENT' THEN
    WITH rounds AS (
      SELECT coalesce(m.round_label, '') AS round_label, coalesce(m.round_number, 9999) AS round_number
      FROM league_sum_charges c LEFT JOIN matches m ON m.id = c.match_id
      UNION
      SELECT coalesce(m.round_label, ''), coalesce(m.round_number, 9999)
      FROM league_sum_payments lp LEFT JOIN matches m ON m.id = lp.match_id
    )
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'key', r.round_label,
      'label', CASE WHEN r.round_label = '' THEN 'Inscripciones y otros'
        WHEN r.round_label ~ '^[0-9]+$' THEN 'Jornada ' || r.round_label ELSE r.round_label END,
      'generated', (SELECT coalesce(sum(c.amount), 0) FROM league_sum_charges c LEFT JOIN matches m ON m.id = c.match_id
        WHERE coalesce(m.round_label, '') = r.round_label),
      'collected', (SELECT coalesce(sum(lp.amount), 0) FROM league_sum_payments lp LEFT JOIN matches m ON m.id = lp.match_id
        WHERE coalesce(m.round_label, '') = r.round_label),
      'expenses', 0,
      'losses', (SELECT coalesce(sum(c.amount - c.paid), 0) FROM league_sum_charges c LEFT JOIN matches m ON m.id = c.match_id
        WHERE c.status = 'CONDONADO' AND coalesce(m.round_label, '') = r.round_label))
      ORDER BY r.round_number, r.round_label), '[]'::jsonb)
    INTO v_series
    FROM (SELECT round_label, min(round_number) AS round_number FROM rounds GROUP BY round_label) r;
  END IF;

  RETURN jsonb_build_object(
    'summary', v_summary,
    'byKind', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('kind', k.kind, 'generated', k.generated, 'collected', k.collected,
        'pending', k.pending) ORDER BY k.generated DESC, k.kind), '[]'::jsonb)
      FROM (
        SELECT kinds.kind,
          (SELECT coalesce(sum(amount), 0) FROM league_sum_charges WHERE kind = kinds.kind) AS generated,
          (SELECT coalesce(sum(amount), 0) FROM league_sum_payments WHERE kind = kinds.kind) AS collected,
          (SELECT coalesce(sum(amount - paid), 0) FROM league_sum_charges
            WHERE kind = kinds.kind AND status IN ('PENDIENTE', 'PARCIAL')) AS pending
        FROM (SELECT kind FROM league_sum_charges UNION SELECT kind FROM league_sum_payments) kinds
      ) k),
    'byCategory', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('category', category, 'amount', total) ORDER BY total DESC, category), '[]'::jsonb)
      FROM (SELECT category, sum(amount) AS total FROM league_sum_expenses GROUP BY category) e),
    'series', v_series,
    -- Cada registro del periodo (los más recientes primero), para verlo y marcarlo como pagado ahí mismo
    'charges', (
      SELECT coalesce(jsonb_agg(league_charge_json(c.id) ORDER BY c.charged_on DESC, c.id), '[]'::jsonb)
      FROM (SELECT id, charged_on FROM league_sum_charges ORDER BY charged_on DESC, id LIMIT 300) c),
    'debtors', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('club', jsonb_build_object('id', d.club_id, 'name', cl.name),
        'pending', d.pending, 'charges', d.n) ORDER BY d.pending DESC, cl.name), '[]'::jsonb)
      FROM (
        SELECT c.club_id, sum(c.amount - cp.paid) AS pending, count(*)::int AS n
        FROM league_charges c JOIN league_charge_paid cp ON cp.id = c.id
        WHERE c.club_id IS NOT NULL AND c.status IN ('PENDIENTE', 'PARCIAL')
        GROUP BY c.club_id
      ) d JOIN clubs cl ON cl.id = d.club_id)
  );
END
$$;
CALL api_expose('admin_finance_summary', 'USER');

-- ---------- Mutaciones (superadmin) ----------

-- Tarifa de un tipo de cobro en una temporada. Los campos que no aplican al tipo se normalizan. Al guardar se
-- registran los cobros de lo que ya pasó en esa temporada (created = cuántos).
CREATE OR REPLACE FUNCTION public.save_league_fee(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_kind text := p ->> 'kind';
  -- El uso de cancha se reparte a medias si no se dice otra cosa
  v_split text := coalesce(p ->> 'splitMode', CASE WHEN p ->> 'kind' = 'MATCH_COURT' THEN 'HALF' ELSE 'EACH' END);
  v_saved text;
  v_season text;
BEGIN
  IF NOT is_platform_admin()
     OR NOT api_required(p, ARRAY['seasonId', 'kind', 'enabled', 'amount'])
     OR NOT (v_kind = ANY (league_fee_kinds()))
     OR jsonb_typeof(p -> 'enabled') <> 'boolean'
     OR (p ? 'includesRegistration' AND jsonb_typeof(p -> 'includesRegistration') NOT IN ('boolean', 'null'))
     OR (p ->> 'amount') !~ '^[0-9]{1,8}(\.[0-9]{1,2})?$'
     OR v_split NOT IN ('EACH', 'HALF') THEN
    RETURN jsonb_build_object('fee', NULL, 'created', NULL);
  END IF;
  INSERT INTO league_fees (season_id, kind, enabled, amount, period, split_mode, includes_registration, updated_at)
  SELECT s.id, v_kind::league_fee_kind, (p ->> 'enabled')::boolean,
    -- Uso de cancha, renta y publicidad no llevan precio: sale de la cancha o del anuncio
    CASE WHEN v_kind IN ('MATCH_COURT', 'COURT_RENTAL', 'AD') THEN 0 ELSE (p ->> 'amount')::numeric END,
    'ONCE',
    CASE WHEN v_kind IN ('MATCH_REFEREE', 'MATCH_COURT') THEN v_split ELSE 'EACH' END,
    false,
    now()
  FROM seasons s WHERE s.id = p ->> 'seasonId'
  ON CONFLICT (season_id, kind) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    amount = EXCLUDED.amount,
    period = EXCLUDED.period,
    split_mode = EXCLUDED.split_mode,
    includes_registration = EXCLUDED.includes_registration,
    updated_at = now()
  RETURNING kind::text, season_id INTO v_saved, v_season;
  IF v_saved IS NULL THEN
    RETURN jsonb_build_object('fee', NULL, 'created', NULL);
  END IF;
  RETURN jsonb_build_object('fee', jsonb_build_object('kind', v_saved), 'created', league_backfill_season(v_season));
END
$$;
CALL api_expose('save_league_fee', 'USER');

-- Cargo manual («Otro cobro», kind = OTHER) a un club (clubId) o a un externo (payerName y, opcional,
-- payerContact). Los demás tipos se registran solos.
CREATE OR REPLACE FUNCTION public.create_league_charge(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_kind text := p ->> 'kind';
  v_club text := p ->> 'clubId';
  v_payer text := api_clean_text(p ->> 'payerName');
  v_contact text := api_clean_text(p ->> 'payerContact');
  v_concept text := api_clean_text(p ->> 'concept');
  v_charged date;
  v_due date;
  v_tournament text;
  v_season text;
  v_club_name text;
  v_saved text;
BEGIN
  IF NOT is_platform_admin()
     OR NOT api_required(p, ARRAY['id', 'kind', 'concept', 'amount', 'chargedOn'])
     OR char_length(p ->> 'id') > 128
     OR v_kind <> 'OTHER'
     OR char_length(v_concept) NOT BETWEEN 3 AND 30
     OR v_concept !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ][A-Za-z0-9À-ÖØ-öø-ÿ,]*( [A-Za-z0-9À-ÖØ-öø-ÿ,]+)*$'
     OR v_concept ~ ',,'
     OR (p ->> 'amount') !~ '^[0-9]{1,8}(\.[0-9]{1,2})?$'
     OR league_date(p ->> 'chargedOn') IS NULL
     OR (p ->> 'dueDate' IS NOT NULL AND league_date(p ->> 'dueDate') IS NULL)
     OR char_length(v_contact) > 100
     OR v_contact ~ '[^A-Za-z0-9@._+ -]' THEN
    RETURN jsonb_build_object('charge', NULL);
  END IF;
  IF (p ->> 'amount')::numeric <= 0 THEN
    RETURN jsonb_build_object('charge', NULL);
  END IF;
  v_charged := league_date(p ->> 'chargedOn');
  v_due := league_date(p ->> 'dueDate');
  IF v_charged NOT BETWEEN DATE '2000-01-01' AND CURRENT_DATE + 366 OR v_due < v_charged THEN
    RETURN jsonb_build_object('charge', NULL);
  END IF;
  -- Un club o un externo, nunca los dos
  IF v_club IS NOT NULL THEN
    SELECT name INTO v_club_name FROM clubs WHERE id = v_club;
    IF v_club_name IS NULL OR v_payer <> '' THEN
      RETURN jsonb_build_object('charge', NULL);
    END IF;
  ELSIF char_length(v_payer) NOT BETWEEN 3 AND 50
     OR v_payer !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ][A-Za-z0-9À-ÖØ-öø-ÿ,]*( [A-Za-z0-9À-ÖØ-öø-ÿ,]+)*$'
     OR v_payer ~ ',,' THEN
    RETURN jsonb_build_object('charge', NULL);
  END IF;
  IF p ->> 'tournamentId' IS NOT NULL THEN
    SELECT id, season_id INTO v_tournament, v_season FROM tournaments WHERE id = p ->> 'tournamentId';
    IF v_tournament IS NULL THEN RETURN jsonb_build_object('charge', NULL); END IF;
  ELSIF p ->> 'seasonId' IS NOT NULL THEN
    SELECT id INTO v_season FROM seasons WHERE id = p ->> 'seasonId';
    IF v_season IS NULL THEN RETURN jsonb_build_object('charge', NULL); END IF;
  ELSE
    v_season := league_season_on(v_charged);
  END IF;

  INSERT INTO league_charges (id, kind, club_id, payer_name, payer_contact, concept, amount, charged_on, due_date,
    season_id, tournament_id, created_by)
  VALUES (p ->> 'id', v_kind::league_fee_kind, v_club, coalesce(v_club_name, v_payer),
    CASE WHEN v_club IS NULL THEN v_contact ELSE '' END, v_concept, (p ->> 'amount')::numeric, v_charged, v_due,
    v_season, v_tournament, v_uid)
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('charge', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('create_league_charge', 'USER');

-- action: CONDONAR (pendiente o parcial; lo que falta cuenta como pérdida), CANCELAR (pendiente sin abonos:
-- fue un error) o REACTIVAR (vuelve a pendiente, parcial o pagado según lo abonado). note: motivo opcional.
CREATE OR REPLACE FUNCTION public.set_league_charge_status(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_action text := p ->> 'action';
  v_note text := api_clean_text(p ->> 'note');
  v_saved text;
BEGIN
  IF NOT is_platform_admin()
     OR NOT api_required(p, ARRAY['id', 'action'])
     OR v_action NOT IN ('CONDONAR', 'CANCELAR', 'REACTIVAR')
     OR char_length(v_note) > 30
     OR (v_note <> '' AND (v_note !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ][A-Za-z0-9À-ÖØ-öø-ÿ,]*( [A-Za-z0-9À-ÖØ-öø-ÿ,]+)*$' OR v_note ~ ',,')) THEN
    RETURN jsonb_build_object('charge', NULL);
  END IF;
  IF v_action = 'CONDONAR' THEN
    UPDATE league_charges SET status = 'CONDONADO', note = v_note, auto_cancelled = false, updated_at = now()
    WHERE id = p ->> 'id' AND status IN ('PENDIENTE', 'PARCIAL')
    RETURNING id INTO v_saved;
  ELSIF v_action = 'CANCELAR' THEN
    UPDATE league_charges c SET status = 'CANCELADO', note = v_note, auto_cancelled = false, updated_at = now()
    WHERE c.id = p ->> 'id' AND c.status = 'PENDIENTE'
      AND NOT EXISTS (SELECT 1 FROM league_payments lp WHERE lp.charge_id = c.id)
    RETURNING c.id INTO v_saved;
  ELSE
    UPDATE league_charges SET status = 'PENDIENTE', note = '', auto_cancelled = false, updated_at = now()
    WHERE id = p ->> 'id' AND status IN ('CONDONADO', 'CANCELADO')
    RETURNING id INTO v_saved;
    IF v_saved IS NOT NULL THEN
      PERFORM league_charge_refresh(v_saved);
    END IF;
  END IF;
  RETURN jsonb_build_object('charge', CASE WHEN v_saved IS NULL THEN NULL ELSE
    (SELECT jsonb_build_object('id', id, 'status', to_jsonb(status)) FROM league_charges WHERE id = v_saved) END);
END
$$;
CALL api_expose('set_league_charge_status', 'USER');

-- «Cubierto / no cubierto»: paid = true abona el saldo con fecha de hoy y deja el cargo PAGADO; paid = false
-- borra sus abonos y lo deja PENDIENTE. En una renta (con clave) cobra o quita solo el resto: lo pagado al
-- apartar (abono auto-hold:) se queda; quitar un resto que no se ha cobrado devuelve null.
CREATE OR REPLACE FUNCTION public.set_league_charge_paid(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_charge record;
  v_rental boolean;
  v_n int;
BEGIN
  IF NOT is_platform_admin() OR NOT api_required(p, ARRAY['id', 'paid']) OR jsonb_typeof(p -> 'paid') <> 'boolean' THEN
    RETURN jsonb_build_object('charge', NULL);
  END IF;
  PERFORM 1 FROM league_charges WHERE id = p ->> 'id' FOR UPDATE;
  SELECT c.id, c.kind::text AS kind, c.source_key, c.status::text AS status, c.amount, cp.paid INTO v_charge
  FROM league_charges c JOIN league_charge_paid cp ON cp.id = c.id
  WHERE c.id = p ->> 'id';
  IF NOT FOUND OR v_charge.status NOT IN ('PENDIENTE', 'PARCIAL', 'PAGADO') THEN
    RETURN jsonb_build_object('charge', NULL);
  END IF;
  v_rental := v_charge.kind = 'COURT_RENTAL' AND v_charge.source_key IS NOT NULL;
  IF (p ->> 'paid')::boolean THEN
    IF v_charge.amount > v_charge.paid THEN
      INSERT INTO league_payments (id, charge_id, amount, paid_on, method, note, created_by)
      VALUES (gen_random_uuid()::text, v_charge.id, v_charge.amount - v_charge.paid, CURRENT_DATE, 'OTRO',
        CASE WHEN v_rental THEN 'Resto de la renta' ELSE 'Marcado como pagado' END, v_uid);
    END IF;
  ELSE
    DELETE FROM league_payments WHERE charge_id = v_charge.id AND id NOT LIKE 'auto-hold:%';
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_rental AND v_n = 0 THEN
      RETURN jsonb_build_object('charge', NULL);
    END IF;
  END IF;
  PERFORM league_charge_refresh(v_charge.id);
  RETURN jsonb_build_object('charge',
    (SELECT jsonb_build_object('id', id, 'status', to_jsonb(status)) FROM league_charges WHERE id = v_charge.id));
END
$$;
CALL api_expose('set_league_charge_paid', 'USER');

-- Abono a un cargo pendiente o parcial (también el resto de una renta); no puede pasar del saldo
CREATE OR REPLACE FUNCTION public.add_league_payment(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_note text := api_clean_text(p ->> 'note');
  v_amount numeric;
  v_paid_on date;
  v_charge record;
  v_saved text;
BEGIN
  IF NOT is_platform_admin()
     OR NOT api_required(p, ARRAY['id', 'chargeId', 'amount', 'paidOn', 'method'])
     OR char_length(p ->> 'id') > 128
     OR (p ->> 'id') LIKE 'auto-hold:%'
     OR (p ->> 'method') NOT IN ('EFECTIVO', 'TRANSFERENCIA', 'OTRO')
     OR (p ->> 'amount') !~ '^[0-9]{1,8}(\.[0-9]{1,2})?$'
     OR league_date(p ->> 'paidOn') IS NULL
     OR char_length(v_note) > 30
     OR (v_note <> '' AND (v_note !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ][A-Za-z0-9À-ÖØ-öø-ÿ,]*( [A-Za-z0-9À-ÖØ-öø-ÿ,]+)*$' OR v_note ~ ',,')) THEN
    RETURN jsonb_build_object('payment', NULL, 'charge', NULL);
  END IF;
  v_amount := (p ->> 'amount')::numeric;
  v_paid_on := league_date(p ->> 'paidOn');
  PERFORM 1 FROM league_charges WHERE id = p ->> 'chargeId' FOR UPDATE;
  SELECT c.id, c.amount, c.status, cp.paid INTO v_charge
  FROM league_charges c JOIN league_charge_paid cp ON cp.id = c.id
  WHERE c.id = p ->> 'chargeId';
  IF NOT FOUND OR v_charge.status NOT IN ('PENDIENTE', 'PARCIAL')
     OR v_amount <= 0 OR v_amount > v_charge.amount - v_charge.paid
     OR v_paid_on NOT BETWEEN DATE '2000-01-01' AND CURRENT_DATE + 1 THEN
    RETURN jsonb_build_object('payment', NULL, 'charge', NULL);
  END IF;
  INSERT INTO league_payments (id, charge_id, amount, paid_on, method, note, created_by)
  VALUES (p ->> 'id', v_charge.id, v_amount, v_paid_on, (p ->> 'method')::league_payment_method, v_note, v_uid)
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO v_saved;
  IF v_saved IS NOT NULL THEN
    PERFORM league_charge_refresh(v_charge.id);
  END IF;
  RETURN jsonb_build_object(
    'payment', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END,
    'charge', CASE WHEN v_saved IS NULL THEN NULL ELSE
      (SELECT jsonb_build_object('id', id, 'status', to_jsonb(status)) FROM league_charges WHERE id = v_charge.id) END);
END
$$;
CALL api_expose('add_league_payment', 'USER');

CREATE OR REPLACE FUNCTION public.delete_league_payment(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_charge text;
BEGIN
  -- El abono automático de una renta (lo pagado al apartar) solo se va si se cancela la renta
  IF NOT is_platform_admin() OR p ->> 'id' IS NULL OR p ->> 'id' LIKE 'auto-hold:%' THEN
    RETURN jsonb_build_object('deleted', NULL);
  END IF;
  DELETE FROM league_payments WHERE id = p ->> 'id' RETURNING charge_id INTO v_charge;
  IF v_charge IS NULL THEN
    RETURN jsonb_build_object('deleted', NULL);
  END IF;
  PERFORM league_charge_refresh(v_charge);
  RETURN jsonb_build_object('deleted', 1);
END
$$;
CALL api_expose('delete_league_payment', 'USER');

-- Gasto o pérdida. tournamentId fija también la temporada; si no, seasonId o la temporada de la fecha.
-- chargeId solo en una devolución (DEVOLUCION).
CREATE OR REPLACE FUNCTION public.save_league_expense(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid text := require_uid();
  v_category text := p ->> 'category';
  v_description text := api_clean_text(p ->> 'description');
  v_spent date;
  v_tournament text;
  v_season text;
  v_charge text;
  v_saved text;
BEGIN
  IF NOT is_platform_admin()
     OR NOT api_required(p, ARRAY['id', 'category', 'description', 'amount', 'spentOn'])
     OR char_length(p ->> 'id') > 128
     OR v_category NOT IN ('ARBITROS', 'PREMIOS', 'MANTENIMIENTO', 'SERVICIOS', 'MATERIAL', 'SERVIDOR', 'PUBLICIDAD',
       'OTRO', 'DEVOLUCION', 'DANOS')
     OR char_length(v_description) NOT BETWEEN 3 AND 30
     OR v_description !~ '^[A-Za-z0-9À-ÖØ-öø-ÿ][A-Za-z0-9À-ÖØ-öø-ÿ,]*( [A-Za-z0-9À-ÖØ-öø-ÿ,]+)*$'
     OR v_description ~ ',,'
     OR (p ->> 'amount') !~ '^[0-9]{1,8}(\.[0-9]{1,2})?$'
     OR league_date(p ->> 'spentOn') IS NULL
     OR (p ->> 'chargeId' IS NOT NULL AND v_category <> 'DEVOLUCION') THEN
    RETURN jsonb_build_object('expense', NULL);
  END IF;
  v_spent := league_date(p ->> 'spentOn');
  IF (p ->> 'amount')::numeric <= 0 OR v_spent NOT BETWEEN DATE '2000-01-01' AND CURRENT_DATE + 1 THEN
    RETURN jsonb_build_object('expense', NULL);
  END IF;
  IF p ->> 'chargeId' IS NOT NULL THEN
    SELECT id INTO v_charge FROM league_charges WHERE id = p ->> 'chargeId';
    IF v_charge IS NULL THEN RETURN jsonb_build_object('expense', NULL); END IF;
  END IF;
  IF p ->> 'tournamentId' IS NOT NULL THEN
    SELECT id, season_id INTO v_tournament, v_season FROM tournaments WHERE id = p ->> 'tournamentId';
    IF v_tournament IS NULL THEN RETURN jsonb_build_object('expense', NULL); END IF;
  ELSIF p ->> 'seasonId' IS NOT NULL THEN
    SELECT id INTO v_season FROM seasons WHERE id = p ->> 'seasonId';
    IF v_season IS NULL THEN RETURN jsonb_build_object('expense', NULL); END IF;
  ELSE
    v_season := league_season_on(v_spent);
  END IF;
  INSERT INTO league_expenses (id, category, description, amount, spent_on, season_id, tournament_id, charge_id, created_by)
  VALUES (p ->> 'id', v_category, v_description, (p ->> 'amount')::numeric, v_spent, v_season, v_tournament, v_charge, v_uid)
  ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    spent_on = EXCLUDED.spent_on,
    season_id = EXCLUDED.season_id,
    tournament_id = EXCLUDED.tournament_id,
    charge_id = EXCLUDED.charge_id
  RETURNING id INTO v_saved;
  RETURN jsonb_build_object('expense', CASE WHEN v_saved IS NULL THEN NULL ELSE jsonb_build_object('id', v_saved) END);
END
$$;
CALL api_expose('save_league_expense', 'USER');

CREATE OR REPLACE FUNCTION public.delete_league_expense(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_n int;
BEGIN
  IF NOT is_platform_admin() OR p ->> 'id' IS NULL THEN
    RETURN jsonb_build_object('deleted', NULL);
  END IF;
  DELETE FROM league_expenses WHERE id = p ->> 'id';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('deleted', CASE WHEN v_n = 0 THEN NULL ELSE v_n END);
END
$$;
CALL api_expose('delete_league_expense', 'USER');

-- Los cobros de temporada y la mensualidad de la página ya no existen: todo se registra solo
DROP FUNCTION IF EXISTS public.generate_season_charges(jsonb);
DROP FUNCTION IF EXISTS public.generate_monthly_page_charges(jsonb);

-- ---------- Club: su cuenta con la liga (presidente o tesorero) ----------

CREATE OR REPLACE FUNCTION public.club_league_account(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_club text := p ->> 'clubId';
BEGIN
  PERFORM require_uid();
  IF v_club IS NULL OR NOT has_club_role(v_club, ARRAY['ADMIN', 'TESORERO']) THEN
    RETURN jsonb_build_object('account', NULL);
  END IF;
  RETURN jsonb_build_object('account', jsonb_build_object(
    'pending', (
      SELECT coalesce(sum(c.amount - cp.paid), 0) FROM league_charges c JOIN league_charge_paid cp ON cp.id = c.id
      WHERE c.club_id = v_club AND c.status IN ('PENDIENTE', 'PARCIAL')),
    'paid', (
      SELECT coalesce(sum(lp.amount), 0) FROM league_payments lp JOIN league_charges c ON c.id = lp.charge_id
      WHERE c.club_id = v_club),
    'charges', (
      SELECT coalesce(jsonb_agg(league_charge_json(c.id) - 'note' - 'automatic' - 'matchId'
        ORDER BY c.charged_on DESC, c.created_at DESC, c.id), '[]'::jsonb)
      FROM (
        SELECT id, charged_on, created_at FROM league_charges
        WHERE club_id = v_club AND status <> 'CANCELADO'
        ORDER BY charged_on DESC, created_at DESC, id
        LIMIT 300
      ) c)
  ));
END
$$;
CALL api_expose('club_league_account', 'USER');

-- Las multas por tarjeta de la primera versión usaban el id del jugador en su clave; ahora va el nombre
-- guardado en la tarjeta. Se reescriben antes del backfill para que no se dupliquen (idempotente).
UPDATE league_charges c
SET source_key = 'match:' || c.match_id || ':' || x.who || ':' || split_part(c.source_key, ':', 4), updated_at = now()
FROM (
  SELECT DISTINCT match_id, player_id, player_name AS who FROM match_cards
  WHERE player_id IS NOT NULL AND player_name <> ''
) x
WHERE c.kind IN ('CARD_YELLOW', 'CARD_RED') AND c.match_id = x.match_id
  AND split_part(c.source_key, ':', 3) = x.player_id
  AND NOT EXISTS (
    SELECT 1 FROM league_charges d
    WHERE d.kind = c.kind AND coalesce(d.club_id, '') = coalesce(c.club_id, '')
      AND d.source_key = 'match:' || c.match_id || ':' || x.who || ':' || split_part(c.source_key, ':', 4));

-- Registra lo que ya existía antes de estas reglas (rentas, uso de cancha y lo que tenga tarifa activa).
-- Es idempotente: al volver a aplicar el archivo no duplica nada.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM seasons ORDER BY start_date NULLS LAST, id LOOP
    PERFORM league_backfill_season(r.id);
  END LOOP;
END
$$;

RESET ROLE;
