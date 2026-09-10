# Super Template — Documentation

## Overview

- NestJS API and background-processing worker share a deterministic feature composition graph.
- `apps/api` owns HTTP routes; `apps/worker` owns scheduled PostgreSQL processing.
- Start locally with `make dev-api` and `make dev-worker`, or use the package commands in `05-operations/deployment.md`.
- The main operational invariant is one deployed scheduler owner: the worker.
- This wiki was initialized during the worker-host change; unrelated enterprise documents remain visible as gaps.

## Documentation coverage matrix

| Document | Standard | Status | Owner | Last-synced |
|---|---|---|---|---|
| [SRS](01-requirements/SRS.md) | ISO/IEC/IEEE 29148 | gap | Product/BA | `6c3ad242` |
| [Architecture](02-architecture/architecture.md) | arc42 + C4 + 4+1 | partial | Architecture | `6c3ad242` |
| [ADRs](02-architecture/decisions/ADR-index.md) | ADR | partial | Architecture | `6c3ad242` |
| [High-Level Design](03-design/HLD.md) | IEEE 1016 | gap | Architecture | `6c3ad242` |
| [Low-Level Design](03-design/LLD.md) | IEEE 1016 | gap | Engineering | `6c3ad242` |
| [API Reference](04-reference/api-reference.md) | OpenAPI | gap | API owner | `6c3ad242` |
| [Data Model](04-reference/data-model.md) | Schema reference | gap | Data owner | `6c3ad242` |
| [Configuration](04-reference/configuration.md) | Reference | partial | Engineering | `6c3ad242` |
| [Deployment](05-operations/deployment.md) | Operations | partial | Operations | `6c3ad242` |
| [Runbook](05-operations/runbook.md) | Operations | gap | Operations | `6c3ad242` |
| [Observability](05-operations/observability.md) | Operations | partial | Operations | `6c3ad242` |
| [Security](05-operations/security.md) | Operations | gap | Security | `6c3ad242` |
| [Guides](06-guides/onboarding.md) | Diátaxis | gap | Engineering | `6c3ad242` |

`gap` means the source document was not present when this sync started. It is not a claim that the product surface is missing.

## Workspaces at a glance

| Path | Type | Stack | Page |
|---|---|---|---|
| `apps/api` | app | NestJS HTTP host | [Architecture](02-architecture/architecture.md) |
| `apps/worker` | app | NestJS application context + `@nestjs/schedule` | [Deployment](05-operations/deployment.md) |
| `packages/app-composition` | package | shared feature registry/composition | [Architecture](02-architecture/architecture.md) |
| `packages/feature-*` | packages | feature modules and scheduled processors | [Configuration](04-reference/configuration.md) |

## Traceability

| ID | Requirement/decision | Design | Code/test evidence |
|---|---|---|---|
| FR-001 | Worker is the only scheduler owner | Architecture §6–§7; ADR-003 | `apps/worker/src/worker.module.ts`; API scheduler exclusion test |
| FR-002 | Generic and notification jobs retain PostgreSQL claim/retry behavior | Architecture §6; deployment runbook | `apps/worker/test/worker-processing.e2e.spec.ts` |
| NFR-001 | Worker has no HTTP listener and shuts down cleanly | Architecture §7; ADR-003 | worker host test, `lsof`, SIGTERM smoke |
| NFR-002 | API remains available after scheduler removal | Architecture §6 | API health smoke and API e2e suite |

Sources: `package.json`, `pnpm-workspace.yaml`, `.agents/PRJ_REFERENCE.md`, and session `Task-23-notification-worker-separation`.
Last-synced: `6c3ad242` (change-set baseline; final task commit follows this sync).
