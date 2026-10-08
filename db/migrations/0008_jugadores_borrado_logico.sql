-- Borrado lógico de jugadores: delete_player ya no borra la fila (sus goles, tarjetas, asistencias, estadísticas
-- de portero y aportaciones a metas caían en cascada o quedaban sin dueño). Marca players.deleted_at y deja
-- al jugador inactivo; la restricción garantiza que un eliminado nunca vuelva a estar activo sin restaurarlo
-- (UPDATE players SET deleted_at = NULL, active = true WHERE id = '<id>').
SET ROLE postgres;

ALTER TABLE players ADD COLUMN deleted_at timestamptz;
ALTER TABLE players ADD CONSTRAINT players_deleted_inactive_chk CHECK (deleted_at IS NULL OR NOT active);

-- Cifras de la portada: los eliminados no cuentan (0002 no se vuelve a aplicar)
CREATE OR REPLACE VIEW platform_stats AS
  SELECT
    1 AS id,
    (SELECT count(*)::int FROM clubs WHERE active AND deleted_at IS NULL) AS clubs,
    (
      SELECT count(*)::int
      FROM players p
      JOIN clubs c ON c.id = p.club_id
      WHERE p.active AND p.deleted_at IS NULL AND NOT p.is_coach AND c.active AND c.deleted_at IS NULL
    ) AS players,
    (SELECT count(*)::int FROM courts WHERE active) AS courts;

RESET ROLE;
