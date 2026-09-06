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
- Do **not** set `DATABASE_SKIP_RLS_CHECK` in staging/production (boot refuses it)
- Do **not** run `db:seed` / `db:reset` against staging/production unless you explicitly set `ALLOW_PROD_SEED=1` / `ALLOW_PROD_RESET=1`
- Set `STORAGE_DRIVER=s3` with `S3_BUCKET` (and credentials) — local filesystem storage is refused when deployed
- Prefer `?sslmode=require` (or stricter) on managed Postgres connection strings

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
