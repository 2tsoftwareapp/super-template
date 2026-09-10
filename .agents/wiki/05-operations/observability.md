# Observability — background worker

## Overview

- Worker lifecycle events are emitted by `WorkerBootstrap` as structured JSON in Nest logs.
- Readiness is the `worker.startup` event with `status=ready`, `role=background-worker`, and `cronJobCount=9`.
- Startup failure emits `status=failed` and exits non-zero; shutdown emits start and completion events.
- There is no worker HTTP health endpoint or periodic heartbeat in this change.

## Signals

| Signal | Meaning | Operator action |
|---|---|---|
| `worker.startup` + `status=ready` | Worker context and cron registrations are ready | Mark process ready |
| `worker.startup` + `status=failed` | Configuration or bootstrap failed | Keep disabled; inspect error and fix config |
| `worker.shutdown.complete` | Nest/database resources closed | Confirm process exit during rollout |
| queue age/retry growth | Processing is not keeping up | Inspect DB/provider and scale or rollback |

## Monitoring gap

Startup readiness is not a liveness guarantee. A selected deployment platform must combine process supervision with queue-age/job-progress monitoring. Add a periodic heartbeat only if the target observability contract requires one.

Sources: `apps/worker/src/main.ts`, `docs/deployment.md`, `packages/feature-jobs/src/application/**`, `packages/feature-notifications/src/application/**`.
Last-synced: `6c3ad242`.
