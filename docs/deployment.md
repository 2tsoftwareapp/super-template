# Deployment

## Production Guidance

- Deploy NestJS and Next.js separately or in the same trusted network
- Keep Next.js talking only to the configured backend base URL
- Use managed PostgreSQL with automated backups
- Replace all development secrets and seed credentials
- Enable HTTPS and `COOKIE_SECURE=true`
- Disable or protect Swagger in production

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
- Flutter format, analyze, and test all pass

## Out of Scope for v1

- Redis
- queues
- WebSocket notifications
- object storage
- social login
- multi-tenancy
- Kubernetes or Terraform
