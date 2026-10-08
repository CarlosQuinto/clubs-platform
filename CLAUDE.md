# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Clubs Platform: a React 18 + Vite SPA (PWA) for an amateur football league, **self-hosted with Docker**. Data lives in PostgreSQL behind PostgREST, identity in GoTrue (Supabase Auth), images in Supabase Storage, and emails go out from a small Node API (`api/`). All of that runs from `docker/docker-compose.yml`; no Google/Firebase services remain. UI text, code comments, commit messages and the README are in **Spanish** — keep it that way. `README.md` is detailed and authoritative; read it for routes, tables, roles and the API.

## Commands

```bash
npm run docker:env      # first time only: writes docker/.env with fresh secrets and prints the VITE_* lines for .env
npm run docker:up       # Postgres + Auth + PostgREST + Storage + Studio + api; the one-shot «migrate» service applies db/ and the seed
npm run dev             # Vite on http://localhost:5173 against http://localhost:8000 (Kong) — .env holds VITE_SUPABASE_*
npm run db:migrate      # re-apply db/migrations (0* once, 1* always: CREATE OR REPLACE) and the seed
npm run db:reset        # drop the volumes, regenerate scripts/demo/demo-seed.sql and start again
npm run docker:smoke    # end-to-end check of the running stack through Kong (37 checks, leaves no data)
npm run db:check        # NO Docker needed: embedded Postgres (PGlite) runs migrations + seed + scripts/db/pruebas/*.mjs
npm run build           # vite build only — does NOT type-check
npx tsc --noEmit        # type-check the frontend
npm run api:build       # compile api/src (Fastify) — run `cd api && npm install` once (not `npm --prefix`: npm adds a bogus dep)
npm run check:firebase  # CI guard: fails if Firebase reappears (imports, deps, config files)
npm run docker:web      # build + serve the production frontend image on http://localhost:8080
```

There are no unit tests for the frontend, no ESLint and no Prettier. Before finishing a change run `npx tsc --noEmit`, `npm run build`, `npm run db:check`, `npm run api:build` and `npm run check:firebase`. With the stack up, `npm run docker:smoke` checks it end to end through the gateway (RPC, auth, permissions, storage, API); after editing SQL run `npm run db:migrate` first.

CI (`.github/workflows/ci.yml`) runs those checks and builds the two Docker images; it does not deploy. Deployment is `docker compose` on a VPS (README → Despliegue).

## Architecture

### `src/` layers

`app` → `features` → `domains` → `infrastructure` → `shared`. Each layer imports only from layers to its right. **Only `src/infrastructure/` may import `@supabase/supabase-js`**; everything else imports operations from `src/infrastructure/dataconnect.ts`, auth from `src/infrastructure/auth.ts`, uploads from `src/infrastructure/storage/uploadImage.ts` and API calls from `src/infrastructure/functions/callables.ts`.

- `features/<screen>/`: `use<Screen>.ts` runs the query, `<screen>Mapper.ts` shapes only what is rendered, `<screen>ViewState.ts` types the view, `<Screen>View.tsx` renders it. Detail data (goals, cards, lineups) is fetched when the detail modal opens, not in lists.
- `domains/<domain>/`: business rules and `*Commands.ts` that call mutations. After a mutation, check the returned row with `savedRow()` (`src/shared/saved.ts`): **a `null` result means the SQL function rejected the write** (no permission or validation failed).
- Hooks guard against stale responses with a request-ticket ref and against double submits with a `sending` ref (see `features/contact/useContact.ts`).

### Data access: one Postgres function per operation

- `src/infrastructure/dataconnect.ts` keeps the old Data Connect SDK signature — `op(dataConnect, vars, { fetchPolicy })` → `{ data }` — but each export calls `supabase.rpc("<snake_case_op>", { p: vars })`. `dataConnect` is an inert token and `QueryFetchPolicy` a stub (RPCs always hit the server). Result types live in `src/infrastructure/api/types.ts` (`<Op>Data`, `<Op>Variables`, enums).
- The functions live in `db/migrations/1010_fn_public.sql` (public screens + session), `1011_fn_club.sql` (club members), `1012_fn_league.sql` (competition, live score), `1013_fn_admin.sql` (`/admin`) and `1015_fn_finance.sql` (league finances: fees, charges, payments, expenses; automatic charges come from triggers on `matches`, `match_cards`, `tournament_clubs`, `court_holds` and `ads`). Schema: `0001_schema.sql` (48 tables, 17 enums), `0002_views.sql` (7 computed views: standings/scorers are never stored), `0003_auth.sql` (helpers + `auth.users` triggers), `0004_storage.sql` (bucket `media`).
- To add or change an operation: write/alter the SQL function, add a test in `scripts/db/pruebas/*.mjs`, run `npm run db:check`, then add the export to `dataconnect.ts` and its types to `api/types.ts`. `1*.sql` files are re-applied on every `db:migrate`; `0*.sql` run once (add a new `0005_*.sql` for schema changes).

Rules for SQL functions (see the header of `1010_fn_public.sql`):

- Signature `public.<snake>(p jsonb DEFAULT '{}'::jsonb) RETURNS jsonb`, `SECURITY DEFINER SET search_path = public, pg_temp`; `LANGUAGE sql STABLE` for reads, `plpgsql` for writes (one function = one transaction). End with `CALL api_expose('<snake>', 'PUBLIC'|'USER')`. Tables grant nothing to `anon`/`authenticated`: only functions are callable.
- Output must match `<Op>Data` exactly: camelCase keys, `*_on_*` relation lists, `coalesce(jsonb_agg(... ORDER BY ...), '[]')` for lists, `CASE WHEN x IS NULL THEN NULL ELSE jsonb_build_object(...) END` for optional relations, `jsonb_build_array(jsonb_build_object('_count', n))` for counts, `to_jsonb(enum/date)`, `api_ts(timestamptz)` for timestamps.
- Mutations return one key per step alias; `null` = denied/invalid. Never trust a `userId` from the client: use `require_uid()` (raises 42501 without session), `is_platform_admin()`, `has_club_role(club_id, ARRAY['ADMIN','DT'])` (includes superadmin), `session_email()`, `require_platform_admin()`. Admin reads raise `42501 'No autorizado.'` (the client maps 42501 → `unauthenticated`, `P0001` → `permission-denied`). Steps the client checks with `savedRow()` on a `_execute` alias (`deleted`, `swapped`, `cleared`) return the affected row count or `null`.
- The view `tournament_standings` has a column named `p`: qualify the parameter as `<function_name>.p` in queries over it.
- PostgREST connects with the `safeupdate` extension loaded: every `DELETE`/`UPDATE` needs a `WHERE` (use `WHERE true` to touch the whole table) or the call fails with `21000` only in Docker, not in `db:check` (PGlite).
- Enums need casts (`'PLAYED'::match_status`); relations are `<field>_id` columns.

### Input validation is duplicated client + SQL

User-entered text is filtered as typed and validated in the form using `src/shared/textLimits.ts` (pairs like `clubName()` / `isClubName()`), and the **same rule is enforced in the SQL function** (`char_length(btrim(...)) BETWEEN ...` and `~ '<regex>'`). When changing a limit or allowed charset, update both places so they stay identical.

### API (`api/`)

Fastify + `pg` + `nodemailer`, Node 20, reachable at `${VITE_SUPABASE_URL}/fn/<name>` through Kong (or `localhost:8787`). `POST /fn/sendClubInvite|reviewTeamApplication|sendPlatformAdminInvite|sendCourtBookingNotice|sendMatchScheduleNotice|sendTournamentEnrollmentNotice`, all requiring the Supabase JWT (`Authorization: Bearer`, verified with `SUPABASE_JWT_SECRET`). Errors are `{ code, message }` with the old `HttpsError` codes; the client rethrows them as `functions/<code>`. Without `GMAIL_USER`/`GMAIL_APP_PASSWORD` they return `mailed: false` while data is still saved. Password reset is GoTrue's own flow (template `api/templates/recovery.html`, served by the API).

### Auth & roles

- GoTrue email/password, autoconfirm on. `BEFORE INSERT ON auth.users` trigger refuses signups without an invite (`signup_invites`, `club_invites`, `platform_admin_invites`) unless `platform_admins` is empty; `AFTER INSERT` creates `public.users` and makes the first user superadmin. `users.id` is the auth uuid as text.
- Superadmin = a row in `platform_admins`; no other source. Club roles (`admin` = Presidente, `dt`, `tesorero`, `prensa`) come from `club_members`; UI permissions via `buildPerms` in `domains/auth/roles.ts`. Real enforcement is in the SQL functions.
- `src/infrastructure/auth.ts` maps GoTrue errors to the `auth/*` codes that `authErrorMessage` (AuthContext) translates. `/restablecer` reads the recovery session from the URL hash (implicit flow), so the link works in any browser.
- Storage: bucket `media`, public read, authenticated write under `platform/*` and `clubs/*`, 5 MB, jpeg/png/webp. `isStoredImageUrl()` tells our files from external URLs.

## Do not

- Reintroduce Firebase or Firestore in any form — `check:firebase` fails CI.
- Import `@supabase/supabase-js` outside `src/infrastructure/`.
- Grant `anon`/`authenticated` direct table access, or trust a client-supplied user id in SQL.
