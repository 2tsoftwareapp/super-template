# Deployment and operations — API and worker

- **Environments:** development, staging, production · **Last-synced:** `6c3ad242`

## Deployment

- **Pipeline:** `pnpm lint`, `pnpm typecheck`, and `pnpm build` are the repository gates. Platform pipeline: **Gap**, no target is configured.
- **Build & release:** API: `pnpm --filter api build && pnpm --filter api start`. Worker: `pnpm --filter worker build && pnpm --filter worker start`.
- **Rollback:** stop/disable the worker and confirm exit; only then restore the former API scheduler composition. No database rollback is required.
- **Config & secrets:** inject the normal validated environment, including restricted `DATABASE_URL`; never commit or log secret values.

## Ownership and cutover

| Process | Owns | Network |
|---|---|---|
| API | HTTP routes, middleware, job/notification management endpoints | `API_PORT`, default `3001` |
| Worker | all 9 scheduled callbacks and PostgreSQL-backed processing | no HTTP listener |

1. Start the worker with the release and environment.
2. Verify `WorkerBootstrap` `worker.startup` has `status=ready` and `cronJobCount=9`.
3. Confirm the old API scheduler owner is stopped before enabling the HTTP-only API release.
4. Smoke API health and worker job progress.

## Observability

- **Logs:** structured `WorkerBootstrap` startup/failure/shutdown events and application logs.
- **Metrics:** queue age, retry counts, stale-recovery counts, and completed/failed jobs are required operational signals; exact dashboard is **Gap**.
- **Alerts:** non-zero worker exit, missing startup readiness, queue age growth, and duplicate-claim/processing anomalies.

## Runbooks (incidents)

### Worker does not become ready

1. Inspect `worker.startup` failure details and environment validation output.
2. Confirm `DATABASE_URL` and provider settings without printing secret values.
3. If processing is not progressing, keep the worker disabled and use the rollback order above.

### Processing backlog grows

1. Check worker process health and database connectivity.
2. Check queue age, retry state, stale rows, and provider errors.
3. Scale workers only after confirming PostgreSQL claim behavior remains healthy.

## Backups & recovery

Database backup/restore procedure is outside this worker sync. Existing queue rows rely on retry and stale recovery; do not roll back database migrations for the host split. Source: `docs/deployment.md`, `docs/adr/0003-standalone-worker-host.md`.

## Security operations

Use the restricted database role, preserve RLS, inject secrets through the target platform, and keep the worker free of an HTTP listener. Source: `docs/environments.md`, `apps/worker/test/worker-processing.e2e.spec.ts`.

Sources: `docs/deployment.md`, `docs/environments.md`, `apps/worker/src/main.ts`, `apps/api/package.json`, `apps/worker/package.json`.
