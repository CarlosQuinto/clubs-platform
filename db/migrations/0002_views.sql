-- Vistas calculadas (antes @view en schema.gql). Posiciones y goleadores nunca se guardan.
SET ROLE postgres;

-- true si todavía no hay superadministrador (primer registro)
CREATE VIEW platform_claim_states AS
  SELECT 1 AS id, (COUNT(*) = 0) AS open
  FROM platform_admins;

-- Cifras públicas de la portada: clubes activos, jugadores (sin cuerpo técnico) y canchas
CREATE VIEW platform_stats AS
  SELECT
    1 AS id,
    (SELECT count(*)::int FROM clubs WHERE active AND deleted_at IS NULL) AS clubs,
    (
      SELECT count(*)::int
      FROM players p
      JOIN clubs c ON c.id = p.club_id
      WHERE p.active AND NOT p.is_coach AND c.active AND c.deleted_at IS NULL
    ) AS players,
    (SELECT count(*)::int FROM courts WHERE active) AS courts;

CREATE VIEW match_listings AS
  SELECT
    m.id AS match_id,
    m.match_date,
    m.start_time,
    t.category_id,
    m.tournament_id,
    m.venue,
    m.home_club_id,
    m.away_club_id,
    (to_char(m.match_date, 'YYYY-MM-DD') || 'T' || m.start_time) AS starts_at
  FROM matches m
  JOIN tournaments t ON t.id = m.tournament_id
  WHERE m.status::text = 'SCHEDULED'
    AND m.match_date IS NOT NULL
    AND m.start_time IS NOT NULL;

CREATE VIEW tournament_standings AS
  WITH played AS (
    SELECT
      m.tournament_id,
      m.home_club_id,
      m.away_club_id,
      m.home_score,
      m.away_score
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
      CASE WHEN p.home_score > p.away_score THEN 1 ELSE 0 END AS g,
      CASE WHEN p.home_score = p.away_score THEN 1 ELSE 0 END AS e,
      CASE WHEN p.home_score < p.away_score THEN 1 ELSE 0 END AS losses,
      p.home_score AS gf,
      p.away_score AS gc,
      CASE
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
      CASE WHEN p.away_score > p.home_score THEN 1 ELSE 0 END,
      CASE WHEN p.away_score = p.home_score THEN 1 ELSE 0 END,
      CASE WHEN p.away_score < p.home_score THEN 1 ELSE 0 END,
      p.away_score,
      p.home_score,
      CASE
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

CREATE VIEW tournament_scorers AS
  WITH events AS (
    SELECT
      m.tournament_id,
      g.club_id,
      g.scorer_id AS player_id,
      CASE
        WHEN g.scorer_name <> '' THEN g.scorer_name
        ELSE g.scorer_id
      END AS player_name,
      (COALESCE(m.match_date, DATE '1970-01-01')::text || 'T' || COALESCE(m.start_time, '00:00')) AS played_at,
      m.id AS match_id,
      1 AS goals,
      0 AS assists
    FROM match_goals g
    JOIN matches m ON m.id = g.match_id
    WHERE m.status::text = 'PLAYED'
      AND m.home_score IS NOT NULL
      AND m.away_score IS NOT NULL
      AND g.is_own_goal = false
      AND g.scorer_id IS NOT NULL
      AND g.scorer_id <> ''
    UNION ALL
    SELECT
      m.tournament_id,
      g.club_id,
      g.assist_id,
      CASE
        WHEN g.assist_name <> '' THEN g.assist_name
        ELSE g.assist_id
      END,
      (COALESCE(m.match_date, DATE '1970-01-01')::text || 'T' || COALESCE(m.start_time, '00:00')),
      m.id,
      0,
      1
    FROM match_goals g
    JOIN matches m ON m.id = g.match_id
    WHERE m.status::text = 'PLAYED'
      AND m.home_score IS NOT NULL
      AND m.away_score IS NOT NULL
      AND g.is_own_goal = false
      AND g.assist_id IS NOT NULL
      AND g.assist_id <> ''
  )
  SELECT
    tournament_id,
    club_id,
    player_id,
    (ARRAY_AGG(player_name ORDER BY played_at DESC, match_id DESC))[1] AS player_name,
    SUM(goals)::int AS goals,
    SUM(assists)::int AS assists
  FROM events
  GROUP BY tournament_id, club_id, player_id;

CREATE VIEW club_ledger AS
  SELECT
    t.club_id,
    t.id AS entry_id,
    t.type::text AS entry_type,
    t.description,
    t.category,
    t.amount,
    t.txn_date,
    t.source::text AS source,
    t.player_id,
    NULL::varchar(128) AS goal_id,
    t.created_at
  FROM transactions t
  UNION ALL
  SELECT
    g.club_id,
    ('goal-' || g.id || '-' || c.player_id) AS entry_id,
    'INGRESO' AS entry_type,
    ('Aportación a ' || g.title) AS description,
    'Metas' AS category,
    c.amount,
    (g.created_at AT TIME ZONE 'UTC')::date AS txn_date,
    'GOAL' AS source,
    c.player_id,
    g.id AS goal_id,
    g.created_at
  FROM goal_contributions c
  JOIN financial_goals g ON g.id = c.goal_id
  WHERE c.amount > 0;

CREATE VIEW player_contribution_totals AS
  SELECT
    p.id AS player_id,
    p.club_id,
    (COALESCE(goals.total, 0) + COALESCE(legacy.total, 0))::float8 AS total
  FROM players p
  LEFT JOIN (
    SELECT player_id, SUM(amount) AS total
    FROM goal_contributions
    GROUP BY player_id
  ) goals ON goals.player_id = p.id
  LEFT JOIN (
    SELECT player_id, SUM(amount) AS total
    FROM transactions
    WHERE source::text = 'LEGACY_AMOUNT_PAID'
    GROUP BY player_id
  ) legacy ON legacy.player_id = p.id;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

RESET ROLE;
