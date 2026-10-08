# API de correo e invitaciones

Servidor Node 20 + Fastify que sustituye a las Cloud Functions (`functions/`). Corre como servicio `api` en `docker/docker-compose.yml` y Kong lo expone en `/fn/` (`docker/volumes/api/kong.yml`). El cliente lo llama desde `src/infrastructure/functions/callables.ts`.

```bash
npm install && npm run dev   # tsx watch en http://localhost:8787 (copia .env.example a .env)
npm run build && npm start   # compila a dist/ y arranca
```

## Variables de entorno

- `PORT` (8787), `DATABASE_URL` (rol `api_service`), `SUPABASE_JWT_SECRET` (el `JWT_SECRET` de GoTrue), `APP_URL` (base de los enlaces de los correos).
- `GMAIL_USER` y `GMAIL_APP_PASSWORD`: sin ellos los endpoints responden `mailed: false` y los datos se guardan igual.
- `TRUST_PROXY` (`true` detrás de Kong/Caddy) y `CORS_ORIGINS` (coma; `*` en desarrollo).

## Endpoints

- `GET /health` -> `{ ok: true }`. `GET /templates/:name` sirve `templates/<name>.html` (plantillas de GoTrue).
- `POST /fn/<nombre>` con JSON y `Authorization: Bearer <JWT de Supabase>`; todos exigen sesión. Errores: `{ code, message }` con los códigos de `HttpsError` (`unauthenticated` 401, `permission-denied` 403, `invalid-argument` 400, `not-found` 404, `failed-precondition` 412, `resource-exhausted` 429, `internal` 500).
  - `sendClubInvite` `{ clubId, email, role, token, hold? }` -> `{ kind, mailed, url, held? }` (presidente del club o superadmin).
  - `reviewTeamApplication` `{ applicationId, action, token?, emailKey? }` -> `{ ok, action, mailed, clubId?, slug?, kind?, url? }` (superadmin).
  - `sendPlatformAdminInvite` `{ email }` -> `{ kind, mailed, url }` (superadmin; máx. 20 por admin y 3 por correo cada 15 min).
  - `sendCourtBookingNotice` `{ to, kind, dateLabel, note, slots[], paymentLabel? }` -> `{ mailed }` (`paymentLabel`: lo pagado y lo que resta de la renta, en el alta y el cambio).
  - `sendMatchScheduleNotice` `{ matchId }` -> `{ mailed }` (superadmin; no repite el aviso si no cambió fecha, hora ni cancha).
  - `sendTournamentEnrollmentNotice` `{ tournamentId, clubIds[] }` -> `{ notified }` (superadmin; avisa una sola vez por club).
