# ADR-003: Run scheduled background processing in a standalone worker host

- **Status:** accepted
- **Date:** `2026-09-10` · **Deciders:** repository maintainers · **Last-synced:** `6c3ad242`

## Context and problem statement

The API previously initialized `ScheduleModule.forRoot()` with the feature graph, so scheduled processors ran inside the HTTP process. The queue contract is PostgreSQL row claims with existing retry and stale recovery. Source: `docs/adr/0003-standalone-worker-host.md`.

## Decision drivers

- Make scheduler ownership explicit and independently deployable.
- Preserve PostgreSQL claim/retry semantics.
- Keep one feature registry and schema for API and worker.
- Avoid adding an HTTP surface to the worker.

## Considered options

1. Dedicated worker application context — selected.
2. API binary with a role/environment scheduler switch — rejected.
3. Redis/BullMQ or external queue migration — rejected for this change.

## Decision outcome

**Chosen:** `apps/worker` as a Nest application-context host, because it gives operations one visible scheduler owner while preserving the current queue contract.

### Consequences

- **Positive:** API and worker have independent commands; worker can scale separately; no worker HTTP listener is required.
- **Negative / trade-offs:** deployment needs a second process target; platform-specific readiness is still target-dependent.
- **Follow-ups:** select the deployment supervisor and run the worker-first cutover/rollback drill.

## Pros and cons of the options

| Option | Pros | Cons |
|---|---|---|
| Dedicated worker | Explicit ownership; independent scale; no HTTP surface | Second deployment target |
| API role switch | Fewer packages | Easy dual-owner rollout; hidden role gate |
| Queue migration | Potential future throughput options | Changes storage, retry, operations, and failure semantics |

## Links

- Source ADR: `docs/adr/0003-standalone-worker-host.md`
- Worker host: `apps/worker/src/main.ts`, `apps/worker/src/worker.module.ts`
- API host: `apps/api/src/composition/runtime.module.ts`
- Verification: `apps/worker/test/worker-processing.e2e.spec.ts`, `apps/api/test/unit/scheduler-ownership.spec.ts`
