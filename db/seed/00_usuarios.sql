-- Usuarios de prueba (solo desarrollo). Contraseña de todos: demo1234
--
--   admin@demo.local        superadministrador
--   presidente@demo.local   Presidente (ADMIN) de Halcones FC (dummy-club-halcones)
--   dt@demo.local           D. Técnico de Halcones FC
--   tesorero@demo.local     Tesorero de Halcones FC
--   prensa@demo.local       Prensa de Halcones FC
--   presidente2@demo.local  Presidente de Deportivo Bahía (dummy-club-bahia)
--
-- Los roles de club se asignan en 10_miembros.sql, después de cargar los clubes dummy.
-- Se desactivan los triggers de auth.users para que no exijan invitación ni rehagan el bootstrap.
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_before_insert;
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_after_insert;

WITH demo (id, email, display_name) AS (
  VALUES
    ('11111111-1111-4111-8111-111111111101'::uuid, 'admin@demo.local', 'Admin Demo'),
    ('11111111-1111-4111-8111-111111111102'::uuid, 'presidente@demo.local', 'Presidente Halcones'),
    ('11111111-1111-4111-8111-111111111103'::uuid, 'dt@demo.local', 'DT Halcones'),
    ('11111111-1111-4111-8111-111111111104'::uuid, 'tesorero@demo.local', 'Tesorero Halcones'),
    ('11111111-1111-4111-8111-111111111105'::uuid, 'prensa@demo.local', 'Prensa Halcones'),
    ('11111111-1111-4111-8111-111111111106'::uuid, 'presidente2@demo.local', 'Presidente Bahía')
),
ins_users AS (
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, reauthentication_token, is_sso_user
  )
  SELECT
    '00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated', d.email,
    extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', d.display_name), now(), now(),
    '', '', '', '', '', '', false
  FROM demo d
  ON CONFLICT (id) DO NOTHING
  RETURNING id
),
ins_identities AS (
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), d.id, d.id::text, 'email',
    jsonb_build_object('sub', d.id::text, 'email', d.email, 'email_verified', true),
    now(), now(), now()
  FROM demo d
  ON CONFLICT (provider_id, provider) DO NOTHING
  RETURNING user_id
)
INSERT INTO public.users (id, email, display_name, updated_at)
SELECT d.id::text, d.email, d.display_name, now()
FROM demo d
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name;

INSERT INTO public.platform_admins (user_id, email)
VALUES ('11111111-1111-4111-8111-111111111101', 'admin@demo.local')
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_before_insert;
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_after_insert;
