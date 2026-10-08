-- Partidos que no se jugaron porque no se presentó uno de los clubes o ninguno.
--
-- matches.no_show dice quién faltó (HOME, AWAY o BOTH). Va siempre con walkover = true y status PLAYED:
-- 3-0 a favor del que sí llegó, o 0-0 si faltaron los dos. Un walkover con no_show NULL es el W.O.
-- administrativo por ingreso tardío al torneo (TournamentEditModal), que no es una falta del club.
--
-- La tabla de posiciones salía solo del marcador, así que un 0-0 por ausencia de ambos daba un empate
-- a cada uno: con no_show = 'BOTH' los dos suman partido jugado y derrota, sin puntos.
SET ROLE postgres;

CREATE TYPE match_no_show AS ENUM ('HOME', 'AWAY', 'BOTH');
ALTER TABLE matches ADD COLUMN no_show match_no_show;

CREATE OR REPLACE VIEW tournament_standings AS
  WITH played AS (
    SELECT
      m.tournament_id,
      m.home_club_id,
      m.away_club_id,
      m.home_score,
      m.away_score,
      (m.no_show IS NOT DISTINCT FROM 'BOTH'::match_no_show) AS both_absent
    FROM matches m
    WHERE m.status::text = 'PLAYED'
      AND m.home_score IS NOT NULL
      AND m.away_score IS NOT NULL
  ),
  sides AS (
    SELECT
      p.tournament_id,
      p.home_club_id AS club_id,
      1 AS pj,
      CASE WHEN NOT p.both_absent AND p.home_score > p.away_score THEN 1 ELSE 0 END AS g,
      CASE WHEN NOT p.both_absent AND p.home_score = p.away_score THEN 1 ELSE 0 END AS e,
      CASE WHEN p.both_absent OR p.home_score < p.away_score THEN 1 ELSE 0 END AS losses,
      p.home_score AS gf,
      p.away_score AS gc,
      CASE
        WHEN p.both_absent THEN 0
        WHEN p.home_score > p.away_score THEN 3
        WHEN p.home_score = p.away_score THEN 1
        ELSE 0
      END AS pts
    FROM played p
    UNION ALL
    SELECT
      p.tournament_id,
      p.away_club_id,
      1,
      CASE WHEN NOT p.both_absent AND p.away_score > p.home_score THEN 1 ELSE 0 END,
      CASE WHEN NOT p.both_absent AND p.away_score = p.home_score THEN 1 ELSE 0 END,
      CASE WHEN p.both_absent OR p.away_score < p.home_score THEN 1 ELSE 0 END,
      p.away_score,
      p.home_score,
      CASE
        WHEN p.both_absent THEN 0
        WHEN p.away_score > p.home_score THEN 3
        WHEN p.away_score = p.home_score THEN 1
        ELSE 0
      END
    FROM played p
  ),
  summed AS (
    SELECT
      tournament_id,
      club_id,
      SUM(pj)::int AS pj,
      SUM(g)::int AS g,
      SUM(e)::int AS e,
      SUM(losses)::int AS p,
      SUM(gf)::int AS gf,
      SUM(gc)::int AS gc,
      (SUM(gf) - SUM(gc))::int AS dg,
      SUM(pts)::int AS pts
    FROM sides
    GROUP BY tournament_id, club_id
  )
  SELECT
    tc.tournament_id,
    tc.club_id,
    COALESCE(s.pj, 0) AS pj,
    COALESCE(s.g, 0) AS g,
    COALESCE(s.e, 0) AS e,
    COALESCE(s.p, 0) AS p,
    COALESCE(s.gf, 0) AS gf,
    COALESCE(s.gc, 0) AS gc,
    COALESCE(s.dg, 0) AS dg,
    COALESCE(s.pts, 0) AS pts,
    RANK() OVER (
      PARTITION BY tc.tournament_id
      ORDER BY COALESCE(s.pts, 0) DESC,
        COALESCE(s.dg, 0) DESC,
        COALESCE(s.gf, 0) DESC,
        tc.club_id ASC
    )::int AS standing_rank
  FROM tournament_clubs tc
  LEFT JOIN summed s
    ON s.tournament_id = tc.tournament_id
   AND s.club_id = tc.club_id;

RESET ROLE;
