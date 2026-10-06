# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Clubs Platform: a React 18 + Vite SPA (PWA) for an amateur football league. All data lives in **Firebase Data Connect** (PostgreSQL), images in Cloud Storage, identity in Firebase Auth, and emails go out from Cloud Functions v2. UI text, code comments, commit messages and the README are in **Spanish** — keep it that way. `README.md` is detailed and authoritative; read it for routes, tables, roles and the Functions API.

## Commands

```bash
npm run dev                        # Vite on http://localhost:5173 (talks to the real Firebase project in .env; no emulators configured)
npm run build                      # vite build only — does NOT type-check
npx tsc --noEmit                   # type-check the frontend
npm --prefix functions run build   # compile functions/src → functions/lib
npm run check:firestore            # CI guard: fails if Firestore reappears anywhere
firebase dataconnect:sdk:generate  # regenerate dataconnect/generated after changing the app connector
firebase emulators:start --only dataconnect   # local Data Connect + Postgres on 127.0.0.1:9399; debugDetails shows real SQL
```

There are no tests, no ESLint and no Prettier. Before finishing a change run `npx tsc --noEmit`, `npm run build`, `npm --prefix functions run build` and `npm run check:firestore`.

CI (`.github/workflows`) deploys **only Hosting**. Data Connect, Functions and Storage are deployed by hand (`firebase deploy --only dataconnect|functions|storage`); deploy Data Connect before a client that uses new operations.

## Architecture

### `src/` layers

`app` → `features` → `domains` → `infrastructure` → `shared`. Each layer imports only from layers to its right. **Only `src/infrastructure/` may import `firebase/*` or `dataconnect/generated`**; everything else imports operations re-exported from `src/infrastructure/dataconnect.ts` and callables from `src/infrastructure/functions/callables.ts`.

- `features/<screen>/`: `use<Screen>.ts` runs the query, `<screen>Mapper.ts` shapes only what is rendered, `<screen>ViewState.ts` types the view, `<Screen>View.tsx` renders it. The query should request only the columns the mapper needs; detail data (goals, cards, lineups) is fetched when the detail modal opens, not in lists.
- `domains/<domain>/`: business rules and `*Commands.ts` that call mutations. After a mutation, check the returned row with `savedRow()` (`src/shared/saved.ts`): **a `null` result means the server-side `@check`/`EXISTS` rejected the write**.
- Every read uses `{ fetchPolicy: QueryFetchPolicy.SERVER_ONLY }`, otherwise the SDK returns cached data and lists don't refresh after saving.
- Hooks guard against stale responses with a request-ticket ref and against double submits with a `sending` ref (see `features/contact/useContact.ts`).

### Data Connect (`dataconnect/`)

- Schema: `schema/schema.gql` (tables, enums, and SQL `@view`s such as `TournamentStanding`, `TournamentScorer`, `MatchListing`, `ClubLedger`, `PlatformClaimState` — standings/scorers are computed, never stored).
- Connector `app` (`connector/*.gql`): used by the browser, `@auth(level: PUBLIC|USER)`. Its SDK in `dataconnect/generated` is committed — regenerate and commit it whenever connector operations change.
- Connector `functions` (`functions/functions.gql`): all `@auth(level: NO_ACCESS)`, executed only by the Admin SDK from `functions/src/sql.ts`. Functions read email data and permissions (`FunctionsAdminGate`) from SQL rather than trusting client input.
- `schemaValidation: COMPATIBLE`: removing a field, a required variable or an operation breaks published clients. Use `@retired`, a default value, or `--force` only if nothing calls it. Don't send variables an operation doesn't declare.

Writing connector operations (hard-won rules from `.cursor/rules/dataconnect-migration.mdc`):

- Superadmin writes: `platformAdmin(key: { userId: $userId }) @check(...)`, then native SQL `INSERT ... VALUES` / `UPDATE` / `DELETE`. `INSERT ... SELECT ... WHERE EXISTS` does not persist.
- Club writes: validate role in SQL with `EXISTS (SELECT 1 FROM club_members ... role IN (...))` using `{ _expr: "auth.uid" }`.
- Enums need casts (`'PLAYED'::match_status`); pass booleans as parameters, not literals; use `CURRENT_TIMESTAMP` for required `created_at`; placeholders only `$1`–`$9` (`$10` is misparsed).
- Schema relations are `<field>_id` columns in SQL (`invitedBy` → `invited_by_id`). Wrong column → "Invalid SQL statement".
- `_executeReturningFirst` wraps SQL in `WITH "cte_0" AS (...)`, so no data-modifying `WITH` inside it ("SQL execution failed"). Read-only CTEs are fine.
- Multi-step mutations = several fields, **without `@transaction`** (it merges fields into one statement and breaks `_execute`). Earlier fields use `_execute`, the last `_executeReturningFirst`. They run in order; a failing `@check` stops the rest. Order steps so retrying is safe (no real transactions).
- Checking the session email: `query @redact { x(...) @check(expr: "this == null || this.email == auth.token.email", ...) { email } }` — the check goes on the object.

### Input validation is duplicated client + SQL

User-entered text is filtered as typed and validated in the form using `src/shared/textLimits.ts` (pairs like `clubName()` / `isClubName()`), and the **same rule is enforced in the mutation's SQL** (`char_length(btrim($n)) BETWEEN ...` and `~ '<regex>'`). When changing a limit or allowed charset, update both places so they stay identical. Field errors render as floating tooltips and save buttons enable only when there are valid changes.

### Cloud Functions (`functions/src`)

Seven `onCall` callables (us-central1), no triggers: `index.ts` (invites, team applications, court booking notices, password reset), `notices.ts` (match scheduled, tournament enrollment — deduped via `matches.schedule_notice_key` and `tournament_notices`), `sql.ts` (functions-connector client + permission gate), `mail.ts` (HTML/text templates, Gmail SMTP via nodemailer). Without `GMAIL_USER`/`GMAIL_APP_PASSWORD` they return `mailed: false` while data is still saved. Errors are `HttpsError` with Spanish messages. The client fires notices without awaiting — the data write is what matters.

### Auth & roles

- Superadmin = a row in `platform_admins` (`PlatformAdminById` in `domains/auth/AuthContext.tsx`); no other source. The first user can claim the platform while `platform_admins` is empty.
- Club roles (`admin` = Presidente, `dt`, `tesorero`, `prensa`) come from `club_members`; UI permissions via `buildPerms` in `domains/auth/roles.ts`. Real enforcement is server-side in the SQL.
- Signup requires an invite in `signup_invites`. Club/superadmin invites live only in SQL (`club_invites`, `platform_admin_invites`); tokens are `crypto.randomUUID()` without dashes, generated in the browser.

## Do not

- Reintroduce Firestore in any form (`firebase/firestore`, `getFirestore`, `onDocument*`, etc.) — `check:firestore` fails CI.
- Import Firebase or the generated SDK outside `src/infrastructure/`.
