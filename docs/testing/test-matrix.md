# Test matrix

`test-matrix.json` at the repository root is the source of truth for what this project
verifies end to end. This document explains how to read that file, how to run it, what each
layer covers, and which rows are deliberately not automated.

Generated report: `.verify-stack/test-matrix-report.html` (see
[Generating the report](#generating-the-report)).

## How to read a row

Every row has the same nine fields:

| Field          | Meaning                                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | Stable identifier. It is the key the harness, the results file and the report all use. Never rename an id without updating `scripts/verify-stack.mjs`.                                          |
| `layer`        | `infra`, `api`, `web`, `admin`, `app` or `cross`. Selects which part of the stack the row needs.                                                                                                |
| `name`         | One-line description of the behaviour under test.                                                                                                                                               |
| `precondition` | What must already be true (running service, session, seeded data, toolchain).                                                                                                                   |
| `action`       | The concrete command or HTTP request. Paste-ready: this is what the row actually does.                                                                                                          |
| `expect`       | The pass condition, phrased so a machine can check it.                                                                                                                                          |
| `evidence`     | The file that will hold the raw output of the row.                                                                                                                                              |
| `automation`   | `harness` (implemented in `scripts/verify-stack.mjs`), `suite` (a child process such as Playwright, Turbo or Flutter), or `out-of-scope` (documented gap, reported as `SKIP`, never as `PASS`). |
| `severity`     | `P0` (release blocker), `P1` (must fix before shipping a feature), `P2` (valuable, lower blast radius).                                                                                         |

`scripts/verify-stack.mjs` checks the matrix against its own row registry in both
directions at startup: a matrix row whose `automation` is `harness` or `suite` must have an
implementation, and an implementation must have a matrix row. A mismatch aborts the run with
exit code 3 instead of silently skipping work.

## Running

```bash
# whole stack: infra, migrations, seed, builds, api + worker + web + admin, every layer
node scripts/verify-stack.mjs          # or: pnpm run verify:stack

# narrower selections
node scripts/verify-stack.mjs --layers=infra,api
node scripts/verify-stack.mjs --only=api-export-create-and-download
node scripts/verify-stack.mjs --skip-build          # reuse existing build output
node scripts/verify-stack.mjs --keep-running        # leave the apps up afterwards
node scripts/verify-stack.mjs --json | head         # results document on stdout
node scripts/verify-stack.mjs --help
```

Exit codes: `0` when every executed row passed (skipped rows are allowed), `1` when at
least one row failed or was blocked, `3` when setup itself failed (build error, occupied
port, matrix/registry mismatch).

### Artifacts

| Path                                    | Contents                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `.verify-stack/results.json`            | One entry per row: `id`, `layer`, `status`, `durationMs`, `actual`, `evidencePath`, `logExcerpt` (failing rows), plus per-layer totals. |
| `.verify-stack/logs/<row-id>.log`       | The raw transcript of that row: the matrix contract, every request/response or command, and the failure detail.                         |
| `.verify-stack/logs/setup-*.log`        | Infra, migration, seed and build output.                                                                                                |
| `.verify-stack/logs/<app>.log`          | Stdout/stderr of the api, worker, web and admin processes the harness started.                                                          |
| `.verify-stack/test-matrix-report.html` | The rendered report.                                                                                                                    |

`.verify-stack/` is gitignored.

### What the harness does, in order

1. `docker compose -f infra/docker-compose.yml up -d`, then `scripts/wait-for-postgres.sh`.
2. Clear the rate-limit counters (`throttle:*` keys in Redis), then
   `pnpm --filter api db:migrate` and `pnpm --filter api db:seed` against the dev database.

   The reset exists because throttling is Redis-backed and therefore survives API restarts:
   `POST /api/v1/auth/verify-email` allows 10 calls per hour, so several harness runs inside
   one hour would hit that ceiling and report a false failure for rows that only need to
   activate an account. Only rate-limit counters are removed; if Redis is unreachable the
   step is skipped and the storage falls back to per-process counters.

3. Build `api`, `worker` (and `web`, `admin` when those layers are selected) unless `--skip-build`.
4. Start each app with its `.env` port, logging to `.verify-stack/logs/<app>.log`, then wait
   for a readiness probe (API `/api/v1/health`, web `/en`, admin `/en/login`).
5. Run the selected rows in matrix order, each with its own timeout.
6. Stop only the processes it spawned; compose infrastructure is left running.
7. Print the per-layer summary and write `results.json`.

The **worker** is started alongside the API on purpose. Mail, jobs, notifications and
exports are all queue-driven, so `api-mail-templated-delivery`,
`api-jobs-enqueue-and-complete` and `api-export-create-and-download` cannot reach a terminal
state without it.

`api-throttling-429` deliberately exhausts the login limit, which also blocks the route for
the remainder of the window. The row therefore clears the counters (or waits the block out)
before finishing and proves the window is usable again with one probe request; without that
cleanup the following Playwright suite would fail to sign in through the UI for a reason
that has nothing to do with the product.

### Safety

- The harness only ever signals processes it started itself (tracked by pid, whole process
  group).
- If one of the app ports is already in use, the run stops before building anything and
  prints the owning pid and command. It never runs a blanket `lsof | xargs kill`.
- Compose services are started, never removed, and no volume is touched.
- The only shared state this harness clears is the Redis rate-limit namespace
  (`throttle:*`), which holds ephemeral counters rather than data.
- Databases are mutated on purpose: the dev database gets this run's fixture rows
  (`matrix-*` users, files, notification rows) and the harness deletes the accounts it
  creates where the API allows it. The test database used by `cross-api-e2e-suite` is reset
  by that suite, not by this harness.

## Coverage by layer

| Layer   | Rows | What it establishes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `infra` | 7    | Compose services healthy; Postgres reachable with every migration applied (applied count equals the number of `apps/api/migrations/*.sql` files); Redis answers `PING`; the MinIO uploads bucket exists; Mailpit's HTTP API is live; the optional replication pair reports `pg_is_in_recovery()`.                                                                                                                                                                                                                                                                                                                       |
| `api`   | 25   | HTTP behaviour of the real API on its real port: health and readiness, OpenAPI documents, the full auth lifecycle (register, email verification via Mailpit, login, `me`, refresh, logout, revoked-session rejection), invalid credentials, anonymous rejection, RBAC (a USER-only account is refused on admin routes), cross-organization isolation, MFA enrolment and challenge, both settings kill-switches, the file lifecycle including the signed URL, templated mail delivery, job execution, notifications, export/import, activity and audit trails, the 400/404/409 error contract, and the login rate limit. |
| `web`   | 5    | The public Next app: locale redirect and landing content, the Vietnamese locale, the deliberate absence of a local login route, and the Playwright suite run against the harness-started servers.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `admin` | 5    | The console: login route serves the app shell, anonymous access to a protected page redirects to login, a real refresh-token cookie opens the shell, the main pages render, and the seeded super admin can read every admin API surface.                                                                                                                                                                                                                                                                                                                                                                                |
| `app`   | 3    | `pnpm run mobile:check` (dart format check, `flutter analyze`, `flutter test`) and `pnpm run mobile:build` (release APK, asserted to exist and be non-empty). Device E2E is out of scope.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `cross` | 7    | Repository-wide gates: `lint:policy`, `turbo run typecheck`, `turbo run test`, `schema:check`, `generate:check`, the API e2e suite, and `format:check`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

`app` rows need Flutter on `PATH`. The harness prepends a locally installed SDK from
`FLUTTER_BIN`, `~/develop/flutter/bin`, `~/flutter/bin`, `/opt/homebrew/bin` or
`/usr/local/bin` when `flutter` is not already resolvable, and fails the row with a clear
message when none of them exists.

## Rows that are not automated, and why

| Row                            | Automation     | Reason                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app-mobile-device-e2e`        | `out-of-scope` | Driving `integration_test` needs a booted emulator or an attached device with `adb`; neither exists in this environment (`flutter devices` finds none). The automated proxy is `app-mobile-check` plus `app-mobile-build-apk`: compile, lint, widget tests and an installable release artifact. Real device E2E stays a release-pipeline step. |
| `web-protected-route-redirect` | `out-of-scope` | The public web app serves only `/`, `/{locale}`, `/{locale}/verify-email` and four `/api/auth/*` route handlers. It has no authenticated area, so there is nothing to redirect away from. The equivalent guarantee is covered by `admin-protected-route-redirects`; the row is kept so the gap is explicit rather than silently dropped.       |

## Documented deviations from the brief this matrix was written against

These are intentional properties of the platform, asserted as they really are. None of them
is a weakened expectation: each has a row that pins the actual behaviour.

1. **Invalid payloads answer 400, not 422.** Nest's global `ValidationPipe` maps
   class-validator failures to `400 VALIDATION_FAILED` with a `details` array of field
   messages, and no route in the OpenAPI document declares 422. `api-errors-validation`
   asserts the 400 contract _and_ asserts that the response is not 422, so a future switch
   to 422 is a deliberate, visible decision.
2. **A file download token never replaces the session.** `GET /api/v1/files/:id/url`
   returns a signed URL whose `token` is an additional factor on top of authentication, not
   a substitute for it: fetching that URL without a session returns 401, with a session it
   returns the bytes. `api-files-lifecycle` asserts all three facts (token present, 200 with
   the session, 401 without). Making the route public would hand file bytes to anyone
   holding a leaked link, so the auth model is left alone and the behaviour is pinned here.
3. **The admin console renders its pages client-side.** `GET /en/login` returns the app
   shell (title `Super Admin`) plus a "Checking your session" state; the login form and the
   dashboard markup appear only after hydration. The `admin-*` rows therefore assert
   routing, the cookie gate, HTTP status and HTML, while the rendered content is asserted by
   the Playwright specs inside `web-e2e-playwright-suite`, which drives a real browser
   against the harness-started servers.
4. **The public web app has no login page.** `/login` redirects to `/en/login`, which is a
   404 by design; the admin app is the only sign-in surface and the landing page links to
   it. `web-login-route-not-hosted` pins that behaviour.

## Generating the report

```bash
node scripts/report-test-matrix.mjs      # or: pnpm run report:matrix
```

The report joins `test-matrix.json` with `.verify-stack/results.json`, so rows that were not
part of the last run appear as `NOT RUN` instead of disappearing. It writes a single
self-contained HTML file with no external assets. Run `node scripts/verify-stack.mjs` first;
without a results file the report script exits 1 with instructions.

## Adding a row

1. Append the row to `test-matrix.json` with all nine fields.
2. Implement it in `scripts/verify-stack.mjs` as `registerRow("<id>", ...)` for a `harness`
   row, or add it to the `suiteRow(...)` list for a `suite` row.
3. If the row belongs to a new category of checks, give it a layer from the existing set —
   the harness selects work by layer, and an unknown layer aborts the run.
4. Use rows that already exist as the pattern for logging: write the request/response pairs
   you observed into the row log, and make every failure message state what was expected and
   what actually happened.

Run `node scripts/verify-stack.mjs --only=<id>` to exercise a single row while iterating.
