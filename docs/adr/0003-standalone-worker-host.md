# ADR 0003: Run scheduled background processing in a standalone worker host

- Status: Accepted
- Date: 2026-09-10
- Decision owners: repository maintainers

## Context

The API currently imports `ScheduleModule.forRoot()` in
`apps/api/src/composition/runtime.module.ts`. Because that module also imports
the composed feature graph, every scheduled provider is instantiated inside the
HTTP process started by `apps/api/src/shell/bootstrap.ts`.

The current queue boundary is PostgreSQL. Generic jobs, notification jobs, and
other background processors atomically claim work with `FOR UPDATE SKIP LOCKED`
and use existing retry/stale-recovery behavior. The extraction must preserve
those contracts and must not duplicate the feature registry or handler wiring.

## Scheduled provider inventory

| Feature | Provider | Schedule | Processing entrypoint |
|---|---|---|---|
| Audit | `AuditRetentionService` | `EVERY_DAY_AT_3AM` | `purgeExpiredAuditLogs()` |
| Outbox | `OutboxDispatcherService` | `EVERY_10_SECONDS` | `processPendingMessages()` |
| Import/export | `ExportJobsProcessor` | `EVERY_30_SECONDS` | `processPendingExports()` |
| Import/export | `ExportJobsRecoveryService` | `EVERY_5_MINUTES` | `recoverStaleExportJobs()` |
| Generic jobs | `JobsProcessor` | `EVERY_MINUTE` | `handleDueJobs()` |
| Generic jobs | `JobsProcessor` | `EVERY_5_MINUTES` | `recoverStaleJobs()` |
| Notifications | `NotificationDeliveryProcessor` | `EVERY_30_SECONDS` | `processDeliveries()` |
| Notifications | `NotificationJobsProcessor` | `EVERY_MINUTE` | `handleDueJobs()` |
| Upload | `StorageCleanupService` | `EVERY_HOUR` | `runCleanup()` |

Sources: `packages/feature-audit/src/application/audit-retention.service.ts`,
`packages/feature-outbox/src/application/outbox-dispatcher.service.ts`,
`packages/feature-import-export/src/exports/application/services/export-jobs.processor.ts`,
`packages/feature-import-export/src/exports/application/services/export-jobs-recovery.service.ts`,
`packages/feature-jobs/src/application/jobs.processor.ts`,
`packages/feature-notifications/src/application/services/notification-delivery.processor.ts`,
`packages/feature-notifications/src/application/services/notification-jobs.processor.ts`,
and `packages/feature-upload/src/storage/application/storage-cleanup.service.ts`.

## Decision

Create a separately deployable `apps/worker` Nest application that starts an
application context with the shared feature graph and `ScheduleModule.forRoot()`.
The worker owns all scheduled providers and never opens an HTTP listener.

Keep the API as an HTTP-only Nest application. It continues to import the
feature modules needed by controllers and job-management endpoints, but it no
longer imports the scheduler or owns scheduled execution.

Extract the feature registry, composed schema, module ordering, handler-import
resolution, and feature contribution catalogs into one reusable composition
boundary consumed by both hosts. The exact package location is selected during
implementation to avoid a dependency cycle through `@repo/api-runtime`.

Keep PostgreSQL tables, claim SQL, retry policy, stale recovery, handler
payloads, and notification business rules unchanged.

## Alternatives considered

### 1. Dedicated worker application — selected

- Gives deployment an explicit scheduler owner.
- Uses Nest's existing `createApplicationContext()` pattern.
- Allows independent worker scaling and failure visibility without opening an
  unnecessary HTTP surface.
- Preserves the current PostgreSQL claim boundary for multiple worker replicas.

### 2. One API binary with a role/environment switch — rejected

- Keeps API and worker composition tightly coupled.
- Makes accidental dual scheduler ownership likely during rollout.
- Requires every future scheduled provider to honor a role gate correctly.
- Does not make the process boundary visible in package/deployment commands.

### 3. Replace PostgreSQL processing with Redis/BullMQ or an external queue — rejected for this change

- Changes queue storage, retry semantics, operational dependencies, and failure
  behavior at the same time as the host extraction.
- Existing PostgreSQL `SKIP LOCKED` claims already provide the required
  multi-worker concurrency boundary.
- Queue migration can be a separate ADR if throughput or scheduling needs later
  justify it.

## Invariants and guardrails

1. Exactly one deployed role owns scheduled callbacks during steady state: the
   worker.
2. The API may expose read/manage operations for jobs and notifications, but
   HTTP request handling must not start a background processing loop.
3. API and worker consume the same ordered feature registry, composed schema,
   handler registrations, and outbox provider resolution.
4. Multiple worker instances may run concurrently; database claims must remain
   disjoint through the existing `FOR UPDATE SKIP LOCKED` paths.
5. Worker-first rollout is required: start and verify the worker, then disable
   API scheduling. Rollback stops the worker before restoring API scheduling.
6. No database migration is part of this extraction.

## Implementation and verification consequences

- Add worker package/build/start commands and workspace wiring.
- Add host-level tests that prove the API has no scheduler registration and the
  worker has no HTTP listener.
- Retain and extend database-backed tests for due work, retry, stale recovery,
  and concurrent claims.
- Document worker configuration, role identity, readiness/failure signaling,
  worker-first rollout, and rollback in deployment documentation.
- Confirm the platform-specific process/readiness mechanism before finalizing
  manifests; do not invent platform-specific configuration in this ADR.

## Rollback

Disable the worker deployment and restore the former API scheduler composition
only after confirming the worker is stopped. Since queue schemas and processing
contracts are unchanged, no database rollback is required; in-flight rows remain
covered by existing stale-recovery behavior.
