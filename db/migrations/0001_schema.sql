-- Esquema de Clubs Platform en Postgres (traducido de dataconnect/schema/schema.gql).
-- Reglas: relación `campo: Tipo` -> columna `campo_id`; FK obligatoria -> ON DELETE CASCADE; opcional -> SET NULL
-- (salvo court_holds.match_id, que cae con el partido). Los ids String son varchar(128) y conservan
-- el uid de la sesión como texto; las horas HH:mm son varchar(5).
--
-- Los objetos se crean como `postgres` (dueño habitual en Supabase). anon y authenticated no tocan tablas:
-- solo ejecutan las funciones RPC (db/migrations/1*.sql).
SET ROLE postgres;

-- ---------- Enums ----------
CREATE TYPE member_role AS ENUM ('ADMIN', 'DT', 'PRENSA', 'TESORERO');
CREATE TYPE tournament_status AS ENUM ('UPCOMING', 'ACTIVE', 'FINISHED');
CREATE TYPE football_type AS ENUM ('FUT_7', 'FUT_9', 'FUT_11');
CREATE TYPE match_status AS ENUM ('UNSCHEDULED', 'SCHEDULED', 'PLAYED');
CREATE TYPE court_hold_source AS ENUM ('MATCH', 'MANUAL');
CREATE TYPE event_type AS ENUM ('PARTIDO', 'ENTRENAMIENTO');
CREATE TYPE friendly_match_type AS ENUM ('AMISTOSO');
CREATE TYPE card_color AS ENUM ('YELLOW', 'RED');
CREATE TYPE transaction_type AS ENUM ('INGRESO', 'GASTO');
CREATE TYPE transaction_source AS ENUM ('MANUAL', 'LEGACY_AMOUNT_PAID');
CREATE TYPE goal_status AS ENUM ('ACTIVE', 'COMPLETED');
CREATE TYPE inventory_condition AS ENUM ('BUENO', 'MALO', 'PERDIDO');
CREATE TYPE inquiry_status AS ENUM ('NEW', 'DONE');
CREATE TYPE team_application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE invite_kind AS ENUM ('SIGNUP', 'ACCEPT');
CREATE TYPE ad_placement_kind AS ENUM ('HOME', 'TOURNAMENT', 'CLUB', 'TEAMS');
CREATE TYPE ad_status AS ENUM ('PROGRAMADO', 'EN_CURSO', 'PAUSADO', 'EXPIRADO');

-- ---------- Plataforma ----------
CREATE TABLE localities (
  id varchar(128) PRIMARY KEY,
  name varchar(120) NOT NULL,
  created_at timestamptz
);

-- Perfil de cada cuenta; id = uid de auth.users como texto. Lo rellena el trigger de 0003_auth.sql.
CREATE TABLE users (
  id varchar(128) PRIMARY KEY,
  email varchar(320) NOT NULL UNIQUE,
  display_name varchar(160) NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform_settings (
  id varchar(16) PRIMARY KEY DEFAULT 'config',
  name varchar(160) NOT NULL DEFAULT '',
  motto varchar(240) NOT NULL DEFAULT '',
  headline varchar(240) NOT NULL DEFAULT '',
  tagline varchar(400) NOT NULL DEFAULT '',
  logo_url text,
  instagram text,
  facebook text,
  x text,
  youtube text,
  whatsapp text,
  courts_enabled boolean NOT NULL DEFAULT false,
  court_slot_minutes integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Fila única de configuración
INSERT INTO platform_settings (id) VALUES ('config');

CREATE TABLE platform_admins (
  user_id varchar(128) PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  email varchar(320) NOT NULL
);

CREATE TABLE platform_hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position integer NOT NULL UNIQUE,
  url text NOT NULL
);

CREATE TABLE court_open_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday integer NOT NULL,
  start_time varchar(5) NOT NULL,
  end_time varchar(5) NOT NULL
);

-- email_key = correo en minúsculas con «.» -> «,» (ver email_key() en 0003_auth.sql)
CREATE TABLE platform_admin_invites (
  email_key varchar(320) PRIMARY KEY,
  email varchar(320) NOT NULL UNIQUE,
  invited_by_id varchar(128) REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id varchar(128) PRIMARY KEY,
  name varchar(120) NOT NULL,
  sort_order integer NOT NULL
);
CREATE INDEX categories_sort_order_idx ON categories (sort_order);

CREATE TABLE seasons (
  id varchar(128) PRIMARY KEY,
  name varchar(160) NOT NULL,
  start_date date,
  end_date date,
  active boolean NOT NULL DEFAULT false
);
CREATE INDEX seasons_active_idx ON seasons (active);

-- ---------- Clubes ----------
CREATE TABLE clubs (
  id varchar(128) PRIMARY KEY,
  slug varchar(40) NOT NULL UNIQUE,
  name varchar(160) NOT NULL,
  description text NOT NULL DEFAULT '',
  locality_id varchar(128) REFERENCES localities (id) ON DELETE SET NULL,
  location varchar(160) NOT NULL DEFAULT '',
  president_phone varchar(40) NOT NULL DEFAULT '',
  logo_url text,
  active boolean NOT NULL DEFAULT true,
  -- Motivo visible en la página del club mientras está desactivado
  disabled_reason text,
  created_by_id varchar(128) REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Borrado lógico: el club se oculta, conserva su historial y su slug queda reservado
  deleted_at timestamptz
);
CREATE INDEX clubs_locality_id_idx ON clubs (locality_id);
CREATE INDEX clubs_active_idx ON clubs (active);
CREATE INDEX clubs_deleted_at_idx ON clubs (deleted_at);

CREATE TABLE club_hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  position integer NOT NULL,
  url text NOT NULL,
  UNIQUE (club_id, position)
);

CREATE TABLE club_availability_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  weekday integer NOT NULL,
  start_time varchar(5) NOT NULL,
  end_time varchar(5) NOT NULL,
  updated_at timestamptz,
  updated_by_id varchar(128) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX club_availability_windows_club_id_idx ON club_availability_windows (club_id);

CREATE TABLE club_default_lineups (
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  mode varchar(16) NOT NULL,
  formation varchar(16) NOT NULL,
  positions jsonb,
  PRIMARY KEY (club_id, mode)
);

CREATE TABLE club_members (
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  user_id varchar(128) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  email varchar(320) NOT NULL,
  display_name varchar(160) NOT NULL DEFAULT '',
  role member_role NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);
CREATE INDEX club_members_user_id_idx ON club_members (user_id);
CREATE INDEX club_members_email_idx ON club_members (email);

CREATE TABLE club_invites (
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  email_key varchar(320) NOT NULL,
  email varchar(320) NOT NULL,
  role member_role NOT NULL,
  token varchar(64) UNIQUE,
  kind invite_kind NOT NULL,
  invited_by_id varchar(128) REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, email_key)
);
CREATE INDEX club_invites_email_idx ON club_invites (email);

CREATE TABLE players (
  id varchar(128) PRIMARY KEY,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  shirt_number varchar(8) NOT NULL DEFAULT 'S/N',
  position varchar(24) NOT NULL,
  variant varchar(80) NOT NULL DEFAULT '',
  birth_date date,
  image_url text NOT NULL DEFAULT '',
  is_coach boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX players_club_id_active_idx ON players (club_id, active);
CREATE INDEX players_club_id_birth_date_idx ON players (club_id, birth_date);

-- ---------- Competición ----------
CREATE TABLE tournament_groups (
  id varchar(128) PRIMARY KEY,
  label varchar(128) NOT NULL
);

CREATE TABLE tournaments (
  id varchar(128) PRIMARY KEY,
  name varchar(160) NOT NULL,
  season_id varchar(128) NOT NULL REFERENCES seasons (id) ON DELETE CASCADE,
  category_id varchar(128) NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
  group_id varchar(128) REFERENCES tournament_groups (id) ON DELETE SET NULL,
  status tournament_status NOT NULL DEFAULT 'UPCOMING',
  legs integer NOT NULL DEFAULT 2,
  football_type football_type NOT NULL DEFAULT 'FUT_11',
  duration_minutes integer NOT NULL DEFAULT 90,
  start_date date,
  -- Premio al campeón en texto libre; vacío = sin premio
  prize varchar(60) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tournaments_season_id_category_id_idx ON tournaments (season_id, category_id);
CREATE INDEX tournaments_status_idx ON tournaments (status);
CREATE INDEX tournaments_group_id_idx ON tournaments (group_id);

CREATE TABLE tournament_clubs (
  tournament_id varchar(128) NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, club_id)
);
CREATE INDEX tournament_clubs_club_id_idx ON tournament_clubs (club_id);

CREATE TABLE tournament_podium (
  tournament_id varchar(128) NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
  place integer NOT NULL,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  PRIMARY KEY (tournament_id, place),
  UNIQUE (tournament_id, club_id)
);

CREATE TABLE tournament_notices (
  tournament_id varchar(128) NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL,
  PRIMARY KEY (tournament_id, club_id)
);

-- ---------- Canchas ----------
CREATE TABLE courts (
  id varchar(128) PRIMARY KEY,
  name varchar(15) NOT NULL,
  description varchar(15) NOT NULL DEFAULT '',
  -- Dirección o referencia del campo; opcional («Col. Centro · Futbol 1»)
  location varchar(60) NOT NULL DEFAULT '',
  hourly_rate numeric(12,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  image_url text,
  football boolean NOT NULL DEFAULT true
);
CREATE INDEX courts_active_sort_order_idx ON courts (active, sort_order);

-- ---------- Partidos ----------
CREATE TABLE matches (
  id varchar(128) PRIMARY KEY,
  tournament_id varchar(128) NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
  round_label varchar(16) NOT NULL,
  round_number integer,
  home_club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  away_club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  match_date date,
  start_time varchar(5),
  venue varchar(200) NOT NULL DEFAULT '',
  court_id varchar(128) REFERENCES courts (id) ON DELETE SET NULL,
  status match_status NOT NULL,
  home_score smallint,
  away_score smallint,
  penalties_home smallint,
  penalties_away smallint,
  walkover boolean NOT NULL DEFAULT false,
  -- Clave fecha|hora|cancha del último aviso enviado a los presidentes (evita avisos repetidos)
  schedule_notice_key varchar(80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
CREATE INDEX matches_tournament_id_idx ON matches (tournament_id);
CREATE INDEX matches_home_club_id_idx ON matches (home_club_id);
CREATE INDEX matches_away_club_id_idx ON matches (away_club_id);
CREATE INDEX matches_status_match_date_start_time_idx ON matches (status, match_date, start_time);
CREATE INDEX matches_match_date_idx ON matches (match_date);
CREATE INDEX matches_court_id_match_date_idx ON matches (court_id, match_date);

CREATE TABLE match_club_reports (
  match_id varchar(128) NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  mvp_id varchar(128) REFERENCES players (id) ON DELETE SET NULL,
  lineup jsonb,
  PRIMARY KEY (match_id, club_id)
);

CREATE TABLE match_attendees (
  match_id varchar(128) NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  player_id varchar(128) NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, club_id, player_id)
);

CREATE TABLE match_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id varchar(128) NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  sort_order integer NOT NULL,
  scorer_id varchar(128) REFERENCES players (id) ON DELETE SET NULL,
  scorer_name varchar(160) NOT NULL DEFAULT '',
  assist_id varchar(128) REFERENCES players (id) ON DELETE SET NULL,
  assist_name varchar(160) NOT NULL DEFAULT '',
  is_penalty boolean NOT NULL DEFAULT false,
  is_own_goal boolean NOT NULL DEFAULT false,
  -- Minuto del partido; null en goles anteriores al registro en vivo
  minute smallint,
  UNIQUE (match_id, club_id, sort_order)
);
CREATE INDEX match_goals_scorer_id_idx ON match_goals (scorer_id);
CREATE INDEX match_goals_match_id_club_id_idx ON match_goals (match_id, club_id);

CREATE TABLE match_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id varchar(128) NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  player_id varchar(128) REFERENCES players (id) ON DELETE SET NULL,
  player_name varchar(160) NOT NULL DEFAULT '',
  color card_color NOT NULL,
  minute smallint
);
CREATE INDEX match_cards_match_id_club_id_idx ON match_cards (match_id, club_id);

CREATE TABLE match_goalkeepers (
  match_id varchar(128) NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  player_id varchar(128) NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  conceded smallint NOT NULL DEFAULT 0,
  saves smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (match_id, club_id, player_id)
);

CREATE TABLE court_holds (
  id varchar(128) PRIMARY KEY,
  court_id varchar(128) NOT NULL REFERENCES courts (id) ON DELETE CASCADE,
  hold_date date NOT NULL,
  start_time varchar(5) NOT NULL,
  end_time varchar(5) NOT NULL,
  source court_hold_source NOT NULL,
  match_id varchar(128) REFERENCES matches (id) ON DELETE CASCADE,
  note varchar(240) NOT NULL DEFAULT '',
  guest_email varchar(320) NOT NULL DEFAULT ''
);
CREATE INDEX court_holds_match_id_idx ON court_holds (match_id);
CREATE INDEX court_holds_court_id_hold_date_idx ON court_holds (court_id, hold_date);

-- ---------- Agenda del club ----------
CREATE TABLE club_events (
  id varchar(128) PRIMARY KEY,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  match_type friendly_match_type,
  title varchar(200) NOT NULL,
  event_date date NOT NULL,
  event_time varchar(5) NOT NULL,
  location varchar(200) NOT NULL DEFAULT 'Por definir',
  routine jsonb,
  lineup jsonb,
  score_ours smallint,
  score_theirs smallint,
  penalties_ours smallint,
  penalties_theirs smallint,
  mvp_id varchar(128) REFERENCES players (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX club_events_club_id_event_date_event_time_idx ON club_events (club_id, event_date, event_time);

CREATE TABLE club_event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id varchar(128) NOT NULL REFERENCES club_events (id) ON DELETE CASCADE,
  player_id varchar(128) REFERENCES players (id) ON DELETE SET NULL,
  raw_label varchar(160) NOT NULL DEFAULT '',
  UNIQUE (event_id, player_id)
);
CREATE INDEX club_event_attendees_event_id_idx ON club_event_attendees (event_id);

CREATE TABLE club_event_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id varchar(128) NOT NULL REFERENCES club_events (id) ON DELETE CASCADE,
  sort_order integer NOT NULL,
  scorer_id varchar(128) REFERENCES players (id) ON DELETE SET NULL,
  assist_id varchar(128) REFERENCES players (id) ON DELETE SET NULL,
  is_penalty boolean NOT NULL DEFAULT false,
  is_own_goal boolean NOT NULL DEFAULT false,
  UNIQUE (event_id, sort_order)
);

CREATE TABLE club_event_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id varchar(128) NOT NULL REFERENCES club_events (id) ON DELETE CASCADE,
  player_id varchar(128) REFERENCES players (id) ON DELETE SET NULL,
  color card_color NOT NULL
);
CREATE INDEX club_event_cards_event_id_idx ON club_event_cards (event_id);

CREATE TABLE club_event_goalkeepers (
  event_id varchar(128) NOT NULL REFERENCES club_events (id) ON DELETE CASCADE,
  player_id varchar(128) NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  conceded smallint NOT NULL DEFAULT 0,
  saves smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, player_id)
);

CREATE TABLE club_event_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id varchar(128) NOT NULL REFERENCES club_events (id) ON DELETE CASCADE,
  position integer NOT NULL,
  url text NOT NULL,
  UNIQUE (event_id, position)
);

-- ---------- Finanzas e inventario ----------
CREATE TABLE transactions (
  id varchar(128) PRIMARY KEY,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  description varchar(240) NOT NULL,
  category varchar(40) NOT NULL,
  amount numeric(12,2) NOT NULL,
  txn_date date NOT NULL,
  source transaction_source NOT NULL DEFAULT 'MANUAL',
  player_id varchar(128) REFERENCES players (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_club_id_txn_date_idx ON transactions (club_id, txn_date);
CREATE INDEX transactions_player_id_idx ON transactions (player_id);

CREATE TABLE financial_goals (
  id varchar(128) PRIMARY KEY,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  amount numeric(12,2) NOT NULL,
  quota_per_player numeric(12,2),
  status goal_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX financial_goals_club_id_status_idx ON financial_goals (club_id, status);

CREATE TABLE goal_contributions (
  goal_id varchar(128) NOT NULL REFERENCES financial_goals (id) ON DELETE CASCADE,
  player_id varchar(128) NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  PRIMARY KEY (goal_id, player_id)
);
CREATE INDEX goal_contributions_player_id_idx ON goal_contributions (player_id);

CREATE TABLE inventory_items (
  id varchar(128) PRIMARY KEY,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  quantity integer NOT NULL,
  condition inventory_condition NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, name, condition)
);

-- ---------- Galería ----------
CREATE TABLE albums (
  id varchar(128) PRIMARY KEY,
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  UNIQUE (club_id, name)
);

CREATE TABLE gallery_photos (
  id varchar(128) PRIMARY KEY,
  album_id varchar(128) NOT NULL REFERENCES albums (id) ON DELETE CASCADE,
  url text NOT NULL,
  caption varchar(240) NOT NULL DEFAULT '',
  sort_order integer NOT NULL,
  taken_at timestamptz NOT NULL,
  UNIQUE (album_id, sort_order)
);
CREATE INDEX gallery_photos_album_id_taken_at_idx ON gallery_photos (album_id, taken_at);

-- ---------- Publicidad y bandeja ----------
CREATE TABLE ads (
  id varchar(128) PRIMARY KEY,
  brand varchar(160) NOT NULL,
  image_url text NOT NULL,
  href text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  status ad_status NOT NULL DEFAULT 'EN_CURSO',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ads_status_starts_on_ends_on_idx ON ads (status, starts_on, ends_on);

CREATE TABLE ad_placements (
  ad_id varchar(128) NOT NULL REFERENCES ads (id) ON DELETE CASCADE,
  placement ad_placement_kind NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ad_id, placement)
);
CREATE INDEX ad_placements_placement_idx ON ad_placements (placement);

CREATE TABLE inquiries (
  id varchar(128) PRIMARY KEY,
  name varchar(160) NOT NULL,
  email varchar(320) NOT NULL,
  phone varchar(40) NOT NULL,
  topic varchar(80) NOT NULL DEFAULT '',
  message text NOT NULL,
  status inquiry_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inquiries_status_created_at_idx ON inquiries (status, created_at);

CREATE TABLE team_applications (
  id varchar(128) PRIMARY KEY,
  captain_name varchar(160) NOT NULL,
  captain_email varchar(320) NOT NULL,
  captain_phone varchar(40) NOT NULL,
  team_name varchar(160) NOT NULL,
  status team_application_status NOT NULL,
  club_id varchar(128) REFERENCES clubs (id) ON DELETE SET NULL,
  slug varchar(40),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX team_applications_status_idx ON team_applications (status);

-- Correos con permiso para registrarse (el trigger de auth.users lo exige)
CREATE TABLE signup_invites (
  email_key varchar(320) PRIMARY KEY,
  email varchar(320) NOT NULL UNIQUE,
  club_id varchar(128) REFERENCES clubs (id) ON DELETE CASCADE,
  platform boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signup_invites_club_id_idx ON signup_invites (club_id);

CREATE TABLE email_outbox (
  id varchar(128) PRIMARY KEY,
  recipients text[] NOT NULL,
  subject varchar(240) NOT NULL,
  html text NOT NULL,
  kind varchar(24) NOT NULL,
  club_id varchar(128) REFERENCES clubs (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_outbox_created_at_idx ON email_outbox (created_at);

-- Intentos por ventana de tiempo de un endpoint público (p. ej. "invite-ip:1.2.3.4"). Solo lo usa la API.
CREATE TABLE request_throttles (
  id varchar(400) PRIMARY KEY,
  hits integer NOT NULL,
  window_start timestamptz NOT NULL
);

-- ---------- Permisos ----------
-- Nada de acceso directo a tablas desde el navegador: todo pasa por las funciones RPC.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
-- Las funciones se conceden una a una (PUBLIC -> anon y authenticated; USER -> authenticated)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

RESET ROLE;
