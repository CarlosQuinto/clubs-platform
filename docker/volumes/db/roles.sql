-- Contraseñas de los roles internos de Supabase (se ejecuta solo al crear el volumen de la BD).
-- Sin supabase_functions_admin: ese rol lo crea webhooks.sql, que este stack no usa.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
