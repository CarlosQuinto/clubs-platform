#!/bin/sh
# Aplica las migraciones y la semilla contra la BD (lo ejecuta el servicio «migrate» del compose).
#
# - db/migrations/0*.sql: esquema; se aplican una sola vez (tabla public.schema_migrations).
# - db/migrations/1*.sql: funciones (CREATE OR REPLACE); se vuelven a aplicar en cada ejecución,
#   así basta editar el archivo y correr `npm run db:migrate`.
# - Semilla (DB_SEED=true): db/seed/0*.sql, después scripts/demo/demo-seed.sql si existe
#   (npm run demo:sql), y por último db/seed/[1-9]*.sql.
set -eu
cd /db

export PGOPTIONS="-c client_min_messages=warning"
PSQL="psql -v ON_ERROR_STOP=1 -q -v api_password=${API_DB_PASSWORD:-$PGPASSWORD}"

until pg_isready -q; do
  echo "Esperando a Postgres..."
  sleep 1
done

$PSQL -c "CREATE TABLE IF NOT EXISTS public.schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());"
# La crea supabase_admin, cuyos permisos por defecto la abrirían a anon/authenticated: se cierra y pasa a postgres
$PSQL -c "ALTER TABLE public.schema_migrations OWNER TO postgres; REVOKE ALL ON public.schema_migrations FROM anon, authenticated;"

for f in $(ls migrations/*.sql | sort); do
  name=$(basename "$f")
  case "$name" in
    0*)
      if [ "$($PSQL -tA -c "SELECT 1 FROM public.schema_migrations WHERE name = '$name'")" = "1" ]; then
        continue
      fi
      echo ">> migración $name"
      $PSQL --single-transaction -f "$f"
      $PSQL -c "INSERT INTO public.schema_migrations (name) VALUES ('$name') ON CONFLICT DO NOTHING"
      ;;
    *)
      echo ">> funciones $name"
      $PSQL --single-transaction -f "$f"
      ;;
  esac
done

if [ "${DB_SEED:-true}" = "true" ]; then
  for f in $(ls seed/0*.sql 2>/dev/null | sort); do
    echo ">> semilla $f"
    $PSQL -f "$f"
  done
  if [ -f /demo/demo-seed.sql ]; then
    echo ">> semilla demo-seed.sql"
    $PSQL -f /demo/demo-seed.sql
  else
    echo "   (sin scripts/demo/demo-seed.sql; genera los datos dummy con npm run demo:sql)"
  fi
  for f in $(ls seed/[1-9]*.sql 2>/dev/null | sort); do
    echo ">> semilla $f"
    $PSQL -f "$f"
  done
fi

echo "Base de datos lista."
