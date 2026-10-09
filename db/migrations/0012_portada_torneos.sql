-- La portada muestra «Torneos · Equipos · Jugadores»: la vista suma el total de torneos registrados (en curso, próximos
-- y terminados). courts se queda para no rehacer la vista, pero home_page ya no la entrega.
SET ROLE postgres;

CREATE OR REPLACE VIEW platform_stats AS
  SELECT
    1 AS id,
    (SELECT count(*)::int FROM clubs WHERE active AND deleted_at IS NULL) AS clubs,
    (
      SELECT count(DISTINCT cp.player_id)::int
      FROM club_players cp
      JOIN clubs c ON c.id = cp.club_id
      WHERE cp.active AND cp.deleted_at IS NULL AND NOT cp.is_coach AND c.active AND c.deleted_at IS NULL
    ) AS players,
    (SELECT count(*)::int FROM courts WHERE active) AS courts,
    (SELECT count(*)::int FROM tournaments) AS tournaments;

REVOKE ALL ON platform_stats FROM anon, authenticated;

RESET ROLE;
