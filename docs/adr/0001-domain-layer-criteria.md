# ADR 0001 — When a backend module gets a `domain/` layer

Date: 2026-07-12 · Status: accepted

## Context

`api-identity` modules mostly have a `domain/` layer; `api-platform` modules
historically had none — business rules sat inline in `application/` use-cases.
Forcing an empty `domain/` folder onto every CRUD module adds ceremony without
value; leaving real rules buried in use-cases makes them untestable in
isolation and easy to duplicate.

## Decision

A module gets a `domain/` directory **iff** it owns at least one rule that is
meaningful without the framework:

- a state machine / lifecycle (e.g. jobs: which statuses are terminal, when a
  failed attempt retries vs. fails permanently → `jobs/domain/job-lifecycle.ts`),
- a validation or safety policy (e.g. files: upload allowlist + magic-byte
  sniffing → `files/domain/upload-policy.ts`; sso: redirect allowlist),
- an authorization rule beyond simple permission lookup (e.g. organizations:
  who may manage which member role).

Thin CRUD modules (settings, activities, storage, …) do **not** get an empty
`domain/` folder. The rule lives where it is used until it is worth naming.

## Rules for `domain/` code

1. **Framework-free**: no value imports from `@nestjs/*`, `drizzle-orm`,
   `express`, or `@repo/database-runtime`. Enforced by
   `scripts/check-source-policy.sh` (“domain imports a framework”).
   Type-only imports are allowed — they carry no runtime coupling.
2. HTTP status codes are written as literals (`403`), not `HttpStatus.*` —
   `AppError` accepts a number. (`@repo/api-runtime` is the shared kernel and is
   allowed.)
3. Every `domain/` file has a colocated `*.spec.ts` exercising the rules as
   pure functions.
4. `application/` calls `domain/`; never the other way around.

## Consequences

- Extracting the jobs retry/cancel rules surfaced a single source of truth
  (`RETRY_DELAY_MS`, `resolveFailureOutcome`) that use-cases now share.
- The policy check retroactively caught 5 pre-existing framework imports in
  `api-identity` domain files; they were cleaned up in the same change.
- Candidates for the same extraction later: audit (retention rules), imports
  (row-validation rules), notifications (fan-out rules) — do them when those
  modules are next touched, not speculatively.
