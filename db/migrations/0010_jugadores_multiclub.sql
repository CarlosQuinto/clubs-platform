-- Un jugador es una persona independiente del club y puede estar en varias plantillas. players se queda con los
-- datos de la persona (nombre, nacimiento, foto) y la pertenencia a cada club (dorsal, posición, variante, cuerpo
-- técnico, activo y baja lógica) pasa a club_players. Las plantillas actuales se copian tal cual (mismo id), así que
-- nada cambia para los clubes. Las estadísticas ya guardan su propio club_id en cada hecho (goles, tarjetas,
-- asistencias, porteros, MVP, metas y movimientos), por eso no se tocan.
SET ROLE postgres;

CREATE TABLE club_players (
  club_id varchar(128) NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
  player_id varchar(128) NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  shirt_number varchar(8) NOT NULL DEFAULT 'S/N',
  position varchar(24) NOT NULL,
  variant varchar(80) NOT NULL DEFAULT '',
  is_coach boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  -- Baja lógica en este club (0008): sale de la plantilla y los selectores pero su historial aquí se conserva
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, player_id),
  -- Un eliminado nunca vuelve a estar activo sin restaurarlo (add_existing_player lo restaura desde la búsqueda)
  CONSTRAINT club_players_deleted_inactive_chk CHECK (deleted_at IS NULL OR NOT active)
);
CREATE INDEX club_players_club_id_active_idx ON club_players (club_id, active);
CREATE INDEX club_players_player_id_idx ON club_players (player_id);

INSERT INTO club_players (club_id, player_id, shirt_number, position, variant, is_coach, active, deleted_at, created_at)
SELECT club_id, id, shirt_number, position, variant, is_coach, active, deleted_at, created_at
FROM players;

-- Estas vistas leen players.club_id: se quitan antes de la columna y se vuelven a crear sobre club_players
DROP VIEW platform_stats;
DROP VIEW player_contribution_totals;

ALTER TABLE players
  DROP COLUMN club_id,
  DROP COLUMN shirt_number,
  DROP COLUMN position,
  DROP COLUMN variant,
  DROP COLUMN is_coach,
  DROP COLUMN active,
  DROP COLUMN deleted_at;

-- Cifras de la portada: cada persona cuenta una vez aunque juegue en varios clubes
CREATE VIEW platform_stats AS
  SELECT
    1 AS id,
    (SELECT count(*)::int FROM clubs WHERE active AND deleted_at IS NULL) AS clubs,
    (
      SELECT count(DISTINCT cp.player_id)::int
      FROM club_players cp
      JOIN clubs c ON c.id = cp.club_id
      WHERE cp.active AND cp.deleted_at IS NULL AND NOT cp.is_coach AND c.active AND c.deleted_at IS NULL
    ) AS players,
    (SELECT count(*)::int FROM courts WHERE active) AS courts;

-- Total aportado por jugador y club: el club sale de la meta o del movimiento, no del jugador
CREATE VIEW player_contribution_totals AS
  SELECT player_id, club_id, SUM(amount)::float8 AS total
  FROM (
    SELECT c.player_id, g.club_id, c.amount
    FROM goal_contributions c
    JOIN financial_goals g ON g.id = c.goal_id
    UNION ALL
    SELECT t.player_id, t.club_id, t.amount
    FROM transactions t
    WHERE t.source::text = 'LEGACY_AMOUNT_PAID' AND t.player_id IS NOT NULL
  ) x
  GROUP BY player_id, club_id;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

RESET ROLE;
