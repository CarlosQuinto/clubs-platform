-- Índices por jugador para la ficha pública (player_profile) y para fusionar duplicados (admin_merge_players):
-- ambas filtran los hechos por jugador y el DELETE de la persona fusionada verifica estas claves foráneas.
SET ROLE postgres;

CREATE INDEX match_goals_assist_id_idx ON match_goals (assist_id);
CREATE INDEX match_cards_player_id_idx ON match_cards (player_id);
CREATE INDEX match_attendees_player_id_idx ON match_attendees (player_id);
CREATE INDEX match_club_reports_mvp_id_idx ON match_club_reports (mvp_id);

RESET ROLE;
