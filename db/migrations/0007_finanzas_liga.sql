-- Finanzas de la liga: lo que la plataforma cobra a los clubes y a terceros, lo que recibe y lo que gasta.
--
-- - league_fees: qué se cobra y cuánto, por temporada (un interruptor y un precio por tipo de cobro).
-- - league_charges: cada cargo (un club o un externo debe un monto). Los automáticos llevan source_key
--   ('match:<id>', 'tournament:<id>', 'season:<id>', 'month:YYYY-MM', 'hold:<id>', 'ad:<id>') y no se repiten;
--   los manuales no llevan clave. Las funciones y triggers que los generan están en 1015_fn_finance.sql.
-- - league_payments: abonos registrados por el administrador contra un cargo.
-- - league_expenses: gastos de la liga y pérdidas (devoluciones, daños y robos).
--
-- Además: precio y anunciante en ads, y el club al que se le cobra una renta de cancha (court_holds.club_id).
SET ROLE postgres;

CREATE TYPE league_fee_kind AS ENUM (
  'CLUB_REGISTRATION', 'CLUB_PAGE', 'SEASON_ENROLLMENT', 'TOURNAMENT_ENROLLMENT', 'DEPOSIT',
  'MATCH_REFEREE', 'MATCH_COURT', 'COURT_RENTAL',
  'CARD_YELLOW', 'CARD_RED', 'WALKOVER', 'PROTEST', 'RESCHEDULE',
  'PLAYER_CARD', 'LATE_SIGNING',
  'AD', 'SPONSORSHIP',
  'OTHER'
);
CREATE TYPE league_charge_status AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADO', 'CONDONADO', 'CANCELADO');
CREATE TYPE league_payment_method AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'OTRO');

CREATE TABLE league_fees (
  season_id varchar(128) NOT NULL REFERENCES seasons (id) ON DELETE CASCADE,
  kind league_fee_kind NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  -- Solo CLUB_PAGE usa MONTH o SEASON; el resto es ONCE (una vez por partido, inscripción, etc.)
  period varchar(8) NOT NULL DEFAULT 'ONCE' CHECK (period IN ('ONCE', 'MONTH', 'SEASON')),
  -- MATCH_REFEREE / MATCH_COURT: EACH = cada club paga el monto; HALF = se reparte entre los dos
  split_mode varchar(8) NOT NULL DEFAULT 'EACH' CHECK (split_mode IN ('EACH', 'HALF')),
  -- SEASON_ENROLLMENT / TOURNAMENT_ENROLLMENT: ya incluye el registro del club en la temporada
  includes_registration boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (season_id, kind)
);

CREATE TABLE league_charges (
  id varchar(128) PRIMARY KEY,
  kind league_fee_kind NOT NULL,
  status league_charge_status NOT NULL DEFAULT 'PENDIENTE',
  -- Deudor: un club o, si es externo, un nombre y un contacto. payer_name guarda también el nombre del club.
  club_id varchar(128) REFERENCES clubs (id) ON DELETE SET NULL,
  payer_name varchar(160) NOT NULL DEFAULT '',
  payer_contact varchar(160) NOT NULL DEFAULT '',
  concept varchar(160) NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  charged_on date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  season_id varchar(128) REFERENCES seasons (id) ON DELETE SET NULL,
  tournament_id varchar(128) REFERENCES tournaments (id) ON DELETE SET NULL,
  match_id varchar(128) REFERENCES matches (id) ON DELETE SET NULL,
  source_key varchar(320),
  -- Motivo al condonar o cancelar
  note varchar(160) NOT NULL DEFAULT '',
  -- Cancelado por el sistema porque desapareció lo que lo originó (p. ej. se borró la tarjeta); puede revivir
  auto_cancelled boolean NOT NULL DEFAULT false,
  created_by varchar(128),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX league_charges_source_idx ON league_charges (kind, source_key, coalesce(club_id, ''))
  WHERE source_key IS NOT NULL;
CREATE INDEX league_charges_club_idx ON league_charges (club_id, status);
CREATE INDEX league_charges_season_idx ON league_charges (season_id);
CREATE INDEX league_charges_tournament_idx ON league_charges (tournament_id);
CREATE INDEX league_charges_match_idx ON league_charges (match_id);
CREATE INDEX league_charges_charged_on_idx ON league_charges (charged_on);

CREATE TABLE league_payments (
  id varchar(128) PRIMARY KEY,
  charge_id varchar(128) NOT NULL REFERENCES league_charges (id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  paid_on date NOT NULL,
  method league_payment_method NOT NULL,
  note varchar(160) NOT NULL DEFAULT '',
  created_by varchar(128),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX league_payments_charge_idx ON league_payments (charge_id);
CREATE INDEX league_payments_paid_on_idx ON league_payments (paid_on);

CREATE TABLE league_expenses (
  id varchar(128) PRIMARY KEY,
  -- Gastos: ARBITROS, PREMIOS, MANTENIMIENTO, SERVICIOS, MATERIAL, SERVIDOR, PUBLICIDAD, OTRO.
  -- Pérdidas: DEVOLUCION (fianza, protesta procedente, reserva pagada y cancelada) y DANOS (daños y robos).
  category varchar(16) NOT NULL CHECK (category IN (
    'ARBITROS', 'PREMIOS', 'MANTENIMIENTO', 'SERVICIOS', 'MATERIAL', 'SERVIDOR', 'PUBLICIDAD', 'OTRO',
    'DEVOLUCION', 'DANOS')),
  description varchar(160) NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  spent_on date NOT NULL,
  season_id varchar(128) REFERENCES seasons (id) ON DELETE SET NULL,
  tournament_id varchar(128) REFERENCES tournaments (id) ON DELETE SET NULL,
  charge_id varchar(128) REFERENCES league_charges (id) ON DELETE SET NULL,
  created_by varchar(128),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX league_expenses_spent_on_idx ON league_expenses (spent_on);
CREATE INDEX league_expenses_season_idx ON league_expenses (season_id);

ALTER TABLE ads
  ADD COLUMN price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  ADD COLUMN advertiser_name varchar(160) NOT NULL DEFAULT '',
  ADD COLUMN advertiser_contact varchar(160) NOT NULL DEFAULT '';

ALTER TABLE court_holds ADD COLUMN club_id varchar(128) REFERENCES clubs (id) ON DELETE SET NULL;

RESET ROLE;
