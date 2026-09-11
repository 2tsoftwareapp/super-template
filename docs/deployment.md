# Deployment

## Production Guidance

- Deploy NestJS and Next.js separately or in the same trusted network
- Keep Next.js talking only to the configured backend base URL (browsers should not call the API origin directly; CORS allowlists `WEB_ORIGIN`)
- Use managed PostgreSQL with automated backups and a tested restore path
- Replace all development secrets (`JWT_*`, `MFA_ENCRYPTION_KEY`, `CSRF_SECRET` on BFFs)
- `SEED_*` credentials are **optional** at API boot in staging/production; set them only when you intentionally run `db:seed`
- Enable HTTPS and `COOKIE_SECURE=true`
- Disable or protect Swagger in production (`API_DOCS_ENABLED=false`)
- Point `DATABASE_URL` at a **non-superuser** application role so Postgres RLS is enforced; run migrations with a separate privileged `DATABASE_MIGRATE_URL` (see `docs/database.md`)
- If the generated `feature-profile.json` selects `database-read-replica`, set `DATABASE_URL_READ_REPLICA` (and the test equivalent where tests run) to a restricted read-only replica URL; startup fails closed when it is missing
- Keep primary and replica connection strings independently provisioned. Primary port resolution can adjust `DATABASE_URL` for a local conflict, but does not rewrite `DATABASE_URL_READ_REPLICA` or `DATABASE_URL_TEST_READ_REPLICA`.
- The startup RLS capability guard checks every configured runtime pool; a superuser or `BYPASSRLS` role on either primary or replica is rejected. Keep `DATABASE_MIGRATE_URL` privileged and out of runtime pools.
- Do **not** set `DATABASE_SKIP_RLS_CHECK` in staging/production (boot refuses it)
- Do **not** run `db:seed` / `db:reset` against staging/production unless you explicitly set `ALLOW_PROD_SEED=1` / `ALLOW_PROD_RESET=1`
- Set `STORAGE_DRIVER=s3` with `S3_BUCKET` (and credentials) — local filesystem storage is refused when deployed
- Prefer `?sslmode=require` (or stricter) on managed Postgres connection strings

## API and worker deployment

The backend has two independently runnable processes with different ownership:

| Process | Command                                                    | Owns                                                                       | Network surface             |
| ------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------- |
| API     | `pnpm --filter api build && pnpm --filter api start`       | HTTP routes, job/notification management endpoints, and request middleware | `API_PORT` (default `3001`) |
| Worker  | `pnpm --filter worker build && pnpm --filter worker start` | All nine scheduled callbacks and PostgreSQL-backed processing              | No HTTP listener            |

The worker currently loads the same validated application configuration and
feature graph as the API. Provide the normal `APP_ENV` and the variables listed
in `packages/api-runtime/src/config/environment/env.schema.ts`, including the
restricted `DATABASE_URL`. Production also requires `REDIS_URL`, secure HTTPS
origins/cookies, and S3 storage according to the existing environment guards.
Provider credentials are only needed when their delivery or integration path is
enabled. Do not put secrets in images, manifests, or logs.

When `tenant-schema` is selected, API and worker use the same validated
tenant-schema `search_path` behavior. Provisioning tenant schemas and applying
feature migrations to each schema is an operator-owned release prerequisite;
the application startup does not perform that migration fan-out.

When `database-read-replica` is selected, set the replica URL in both API and
worker environments. Replica reads are eventual and tenant-aware. Mutations,
transactions, raw SQL, migrations, and advisory locks remain on the primary;
the runtime does not silently fall back to primary after a replica error.
Auth sessions, user status, organization context, access-control permissions,
and MFA security state are always read through `DATABASE_PRIMARY` on the
primary. The feature resolver rejects `readReplica=true` with
`readConsistency="strong"`; strong consumers must use this primary path.

For real topology validation, run the opt-in suite after providing migrated
restricted-role endpoints and a privileged primary admin URL:

```bash
DATABASE_TOPOLOGY_PRIMARY_URL='postgresql://app@primary/app' \
DATABASE_TOPOLOGY_REPLICA_URL='postgresql://app@replica/app' \
DATABASE_TOPOLOGY_ADMIN_URL='postgresql://admin@primary/app' \
pnpm --filter api exec vitest run test/database-topology.e2e.spec.ts
```

The suite checks tenant A/B isolation, endpoint separation, and primary auth
visibility after rotation/revocation. It skips when the three topology URLs
are missing; its optional privileged-replica test also requires
`DATABASE_TOPOLOGY_PRIVILEGED_REPLICA_URL`. `pnpm test:e2e:preflight` remains a
separate check requiring `DATABASE_URL_TEST` and a restricted test role.

### Readiness and failure signals

The worker does not expose an HTTP health endpoint by design. A process
supervisor should treat the structured `WorkerBootstrap` event below as
readiness after startup and a non-zero process exit as startup failure:

```json
{
  "event": "worker.startup",
  "status": "ready",
  "role": "background-worker",
  "cronJobCount": 9,
  "appEnv": "production",
  "pid": 1234
}
```

Shutdown emits `worker.shutdown` and `worker.shutdown.complete` after Nest and
database resources close. Missing or invalid required configuration emits
`status: "failed"` and exits non-zero. Map these generic process signals to
the target platform's readiness/liveness mechanism when a deployment platform
is selected; configure its termination grace period to at least 30 seconds so
the idempotent shutdown handler can await `app.close()`. This repository does
not prescribe Kubernetes or Terraform.

### Worker-first cutover

Use this order for a release that moves scheduling out of an existing API
version:

1. Build and start the worker with the same release and environment. Confirm
   exactly one `worker.startup` event with `status":"ready"` and
   `cronJobCount=9`.
2. Confirm the old API scheduler owner is stopped before enabling the new
   HTTP-only API deployment. The steady-state invariant is one scheduler owner:
   the worker.
3. Smoke the API health endpoints and verify due generic/notification work is
   processed or retried by the worker.
4. Scale worker replicas only as needed; PostgreSQL `FOR UPDATE SKIP LOCKED`
   claims remain the concurrency boundary. No queue-schema migration is needed.

### Rollback

If the worker is unhealthy or processing is not progressing, stop/disable the
worker deployment first and confirm its process has exited. Only then restore
the former API scheduler composition and its release. Existing processing rows
remain protected by the current retry and stale-recovery paths; do not roll
back database migrations for this host split.

## Backup restore & migrate rollback (drill)

Treat this as a short runbook you practice on a **non-production** clone before go-live.

### Backup

1. Use the managed provider’s automated backup (PITR if available).
2. Optionally take a logical dump before risky migrations:
   `pg_dump "$DATABASE_MIGRATE_URL" -Fc -f backup.dump`

### Restore (provider or dump)

1. Stop writers (API/BFF scale to zero or maintenance mode).
2. Restore from the provider snapshot **or**  
   `pg_restore --clean --if-exists -d "$DATABASE_MIGRATE_URL" backup.dump`
3. Confirm `pnpm --filter api db:migrate` is a no-op (schema matches the restored revision).
4. Smoke `GET /api/v1/health` and `GET /api/v1/health/ready`, then redeploy BFFs and verify login.

### Migrate rollback

Drizzle migrations in this template are **forward-only**. If a migration is bad:

1. Prefer restore-to-backup (above) over hand-editing production schema.
2. Ship a **new** forward migration that corrects data/schema; never rewrite already-applied migration files on shared environments.
3. Record the incident (migration version, restore point, time-to-recover) in your ops notes.

## Security

- Restrict `WEB_ORIGIN` (and `ADMIN_ORIGIN` for SSO redirects) to known HTTPS origins
- Set `CSRF_SECRET` (≥24 chars) on **web** and **admin** BFFs — required when `APP_ENV` is staging/production
- Rotate JWT secrets through secret management
- Monitor audit logs for privileged actions
- Prefer not dumping Authorization / Cookie headers in request logs
- Web/admin ship baseline security headers (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS in production builds)

## Build Outputs

- API: `pnpm --filter api build`
- Web: `pnpm --filter web build`
- Mobile: build per platform from `apps/mobile`

## CI Expectations

- contracts regenerate cleanly
- generated files are not stale
- lint, typecheck, unit test, and build all pass
- API e2e (tenant isolation, MFA, SSO, auth-adjacent) passes against Postgres
- Flutter format-check, analyze, and test all pass
- Required status checks on `main` should include the CI job names above

## Out of Scope for v1

- Redis-backed **job queues** (PostgreSQL jobs are used instead)
- WebSocket notifications
- **Pre-built social login UI** on web/mobile (OIDC backend + fake provider for tests exist — configure `GOOGLE_*` / `APPLE_*` / `GITHUB_*` and add UI)
- Kubernetes or Terraform
- Mobile store release (set real `apps/mobile/env/prod.json` API URL before shipping)

Tenant isolation via organizations + Postgres RLS **is in scope** (see `docs/database.md` and `apps/api/test/tenant-isolation.e2e.spec.ts`).

Object storage is supported via local filesystem (development) or S3-compatible storage (production).
