# Deployment

## Production Guidance

- Deploy NestJS and Next.js separately or in the same trusted network
- Keep Next.js talking only to the configured backend base URL (browsers should not call the API origin directly; CORS allowlists `WEB_ORIGIN`)
- Use managed PostgreSQL with automated backups and a tested restore path
- Replace all development secrets and seed credentials
- Enable HTTPS and `COOKIE_SECURE=true`
- Disable or protect Swagger in production (`API_DOCS_ENABLED=false`)
- Point `DATABASE_URL` at a **non-superuser** application role so Postgres RLS is enforced; run migrations with a separate privileged `DATABASE_MIGRATE_URL` (see `docs/database.md`)
- Do **not** set `DATABASE_SKIP_RLS_CHECK` in staging/production (boot refuses it)
- Do **not** run `db:seed` / `db:reset` against staging/production unless you explicitly set `ALLOW_PROD_SEED=1` / `ALLOW_PROD_RESET=1`

## Security

- Restrict `WEB_ORIGIN` (and `ADMIN_ORIGIN` for SSO redirects) to known HTTPS origins
- Rotate JWT secrets through secret management
- Monitor audit logs for privileged actions
- Prefer not dumping Authorization / Cookie headers in request logs

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
