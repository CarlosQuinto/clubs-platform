-- Jugador del partido (MVP): uno solo por partido y nunca se guarda; se calcula de los goles.
-- Gana quien tenga más goles, luego más asistencias, luego el más joven (fecha de nacimiento más reciente; sin fecha
-- queda detrás) y al final el nombre. Los autogoles no cuentan ni como gol ni como asistencia, los goles sin jugador
-- (solo nombre) tampoco, y un walkover no tiene MVP. Sin goles ni asistencias no hay MVP.
-- Los amistosos siguen la misma regla con los jugadores del club. Por eso se quitan los mvp_id que elegía cada club.
SET ROLE postgres;

CREATE VIEW match_mvps AS
  WITH facts AS (
    SELECT g.match_id, g.club_id, g.scorer_id AS player_id, 1 AS goals, 0 AS assists
    FROM match_goals g
    WHERE NOT g.is_own_goal AND g.scorer_id IS NOT NULL
    UNION ALL
    SELECT g.match_id, g.club_id, g.assist_id, 0, 1
    FROM match_goals g
    WHERE NOT g.is_own_goal AND g.assist_id IS NOT NULL
  ),
  tally AS (
    SELECT match_id, player_id, min(club_id) AS club_id, sum(goals)::int AS goals, sum(assists)::int AS assists
    FROM facts
    GROUP BY match_id, player_id
  )
  SELECT DISTINCT ON (t.match_id) t.match_id, t.player_id, t.club_id, t.goals, t.assists
  FROM tally t
  JOIN matches m ON m.id = t.match_id AND NOT m.walkover
  JOIN players pl ON pl.id = t.player_id
  ORDER BY t.match_id, t.goals DESC, t.assists DESC, pl.birth_date DESC NULLS LAST, pl.name, pl.id;

CREATE VIEW club_event_mvps AS
  WITH facts AS (
    SELECT g.event_id, g.scorer_id AS player_id, 1 AS goals, 0 AS assists
    FROM club_event_goals g
    WHERE NOT g.is_own_goal AND g.scorer_id IS NOT NULL
    UNION ALL
    SELECT g.event_id, g.assist_id, 0, 1
    FROM club_event_goals g
    WHERE NOT g.is_own_goal AND g.assist_id IS NOT NULL
  ),
  tally AS (
    SELECT event_id, player_id, sum(goals)::int AS goals, sum(assists)::int AS assists
    FROM facts
    GROUP BY event_id, player_id
  )
  SELECT DISTINCT ON (t.event_id) t.event_id, t.player_id, t.goals, t.assists
  FROM tally t
  JOIN players pl ON pl.id = t.player_id
  ORDER BY t.event_id, t.goals DESC, t.assists DESC, pl.birth_date DESC NULLS LAST, pl.name, pl.id;

REVOKE ALL ON match_mvps, club_event_mvps FROM anon, authenticated;

DROP INDEX IF EXISTS match_club_reports_mvp_id_idx;
ALTER TABLE match_club_reports DROP COLUMN mvp_id;
ALTER TABLE club_events DROP COLUMN mvp_id;

RESET ROLE;
