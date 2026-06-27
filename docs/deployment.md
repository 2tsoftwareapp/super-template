# Deployment

## Production Guidance

- Deploy NestJS and Next.js separately or in the same trusted network
- Keep Next.js talking only to the configured backend base URL
- Use managed PostgreSQL with automated backups
- Replace all development secrets and seed credentials
- Enable HTTPS and `COOKIE_SECURE=true`
- Disable or protect Swagger in production
- Point `DATABASE_URL` at a **non-superuser** application role so Postgres RLS is enforced; run migrations with a separate privileged `DATABASE_MIGRATE_URL` (see `docs/database.md`)

## Security

- Restrict `WEB_ORIGIN` to known origins
- Rotate JWT secrets through secret management
- Monitor audit logs for privileged actions
- Ensure request logs keep token and cookie redaction enabled

## Build Outputs

- API: `pnpm --filter api build`
- Web: `pnpm --filter web build`
- Mobile: build per platform from `apps/mobile`

## CI Expectations

- contracts regenerate cleanly
- generated files are not stale
- lint, typecheck, test, and build all pass
- Flutter format-check, analyze, and test all pass

## Out of Scope for v1

- Redis-backed **job queues** (PostgreSQL jobs are used instead)
- WebSocket notifications
- **Pre-built social login UI** on web/mobile (OIDC backend + fake provider for tests exist — configure `GOOGLE_*` / `APPLE_*` / `GITHUB_*` and add UI)
- multi-tenancy
- Kubernetes or Terraform

Object storage is supported via local filesystem (development) or S3-compatible storage (production).
