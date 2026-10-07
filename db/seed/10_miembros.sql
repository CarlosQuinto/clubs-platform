-- Roles de club de los usuarios de prueba (00_usuarios.sql) en los clubes dummy (scripts/demo).
-- Solo inserta si el club existe; si no se generó la semilla dummy no hace nada.
INSERT INTO public.club_members (club_id, user_id, email, display_name, role, joined_at)
SELECT m.club_id, m.user_id, m.email, m.display_name, m.role::member_role, now()
FROM (
  VALUES
    ('dummy-club-halcones', '11111111-1111-4111-8111-111111111102', 'presidente@demo.local', 'Presidente Halcones', 'ADMIN'),
    ('dummy-club-halcones', '11111111-1111-4111-8111-111111111103', 'dt@demo.local', 'DT Halcones', 'DT'),
    ('dummy-club-halcones', '11111111-1111-4111-8111-111111111104', 'tesorero@demo.local', 'Tesorero Halcones', 'TESORERO'),
    ('dummy-club-halcones', '11111111-1111-4111-8111-111111111105', 'prensa@demo.local', 'Prensa Halcones', 'PRENSA'),
    ('dummy-club-bahia', '11111111-1111-4111-8111-111111111106', 'presidente2@demo.local', 'Presidente Bahía', 'ADMIN')
) AS m (club_id, user_id, email, display_name, role)
WHERE EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = m.club_id)
ON CONFLICT (club_id, user_id) DO UPDATE SET role = EXCLUDED.role;

-- Nombre de la plataforma si está vacío
UPDATE public.platform_settings
SET name = 'Clubs Platform', headline = 'Liga amateur de futbol', updated_at = now()
WHERE id = 'config' AND name = '';
