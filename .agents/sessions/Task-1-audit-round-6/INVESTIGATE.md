# Investigate: Feature 05 — Audit Logs · Re-review Round 6

## Executive summary (80/20)

- **Status**: Root Cause Confirmed
- **Likely/Confirmed cause**: Auth middleware/guard does not read `x-organization-id`, storage cleanup has no outbox worker, export job status does not catch pre-DB errors, partial DB imports lack savepoints, list audit uses generic error.
- **Strongest evidence**: Code inspection of `auth.guard.ts`, `export-audit-logs.use-case.ts`, `confirm-import.use-case.ts`, `create-export.use-case.ts`, and `list-audit-logs.use-case.ts`.
- **Impact**: Export jobs can hang; import loops crash the transaction; storage gets orphaned; global E2E does not test actual global state; generic 500 errors on invalid list requests.
- **Next action**: Prepare for Execution phase to fix these identified issues.

## Developer overview

- **Investigation status**: Completed
- **Strongest hypothesis**: The 6 points identified by the user are directly observable in the code.
- **Evidence gap**: None. All issues are confirmed via direct source code inspection.
- **Next action**: Create a plan/tasks for Round 6 to resolve these issues.

## Question

What are the remaining blockers for Feature 05 Audit Logs to pass the final verification round (Round 6)?

## Status

Root Cause Confirmed

## Context

Audit Logs Multi-Tenant RLS & Performance, specifically edge cases around global E2E testing, job state machines, transactional partial successes, and durable storage cleanup.

## Evidence

1. **Global E2E Context**: `x-organization-id` header is passed in `audit.e2e.spec.ts` but `AuthGuard` in `apps/api/src/shell/auth.guard.ts` only reads `Authorization` header. `request.user` is populated from the JWT token which contains the default `organizationId`. Thus, `x-organization-id: ""` is ignored and the global context is never actually entered.
2. **Storage Cleanup**: `ExportAuditLogsUseCase` deletes S3 objects in a `catch` block. If the S3 delete fails (e.g. network issue), the object is orphaned. There is no `storage_cleanup_jobs` outbox or background worker to ensure eventual deletion.
3. **Export Job Processing Hang**: In `CreateExportUseCase`, the try-catch block wrapping the database transaction begins *after* `adapter.resolve`, `adapter.listForExport`, `toCsv`, and `objectStorage.upload`. If any of those operations throw, the job remains in the `PROCESSING` state permanently.
4. **Partial Import Savepoints**: `ConfirmImportUseCase` runs a loop wrapping `importRow` in a try-catch inside a transaction block. If an `importRow` throws a PostgreSQL level error (e.g. unique constraint), the entire transaction is marked `aborted`. The next query inside the same transaction will fail with `current transaction is aborted`. Savepoints (`SAVEPOINT`) are required for partial success semantics.
5. **Generic Error**: `ListAuditLogsUseCase` throws `new Error('Organization ID is required...')` which causes an unhandled HTTP 500 rather than a 400/403.
6. **Bytecode files**: `__pycache__` directories were accidentally committed inside `.agents/skills/office-common/python/office_common/`.

## Observed facts

- `AuthGuard` does not parse `x-organization-id`.
- S3 `catch` cleanup is best effort without a retry queue.
- Job state update in `CreateExportUseCase` is vulnerable to earlier step exceptions.
- `ConfirmImportUseCase` lacks savepoints inside its transaction loop.
- `ListAuditLogsUseCase` uses standard `Error` class.

## Root cause

Implementation details around error handling, transaction boundaries, test context initialization, and HTTP error domains were missed in previous rounds.

## Impact

- **Global E2E**: High (Testing gap for SUPER_ADMIN access without an organization context).
- **Storage Cleanup**: Medium (Storage bloat over time).
- **Export Job**: High (UX issue - jobs stuck in Processing).
- **Partial Import**: High (Feature completely broken on partial import errors).
- **Generic Error**: Low (HTTP 500 instead of 403).

## Recommendation

- **Global E2E**: Provide a way to test with `organizationId = null` (e.g., via a test token payload or an interceptor for test environments).
- **Storage Cleanup**: Implement an outbox table `storage_cleanup_jobs` and a background worker to ensure eventual consistency.
- **Export Job**: Move the `try` block up in `CreateExportUseCase` to cover `adapter.listForExport` and `objectStorage.upload`, and properly mark the job as `FAILED` in the catch block.
- **Partial Import**: Choose either All-or-nothing semantics (throw and rollback the whole transaction) or implement PostgreSQL savepoints using raw queries or adapter-level support.
- **Generic Error**: Change `new Error()` to `throw new AppError(ERROR_CODES.AUTH_FORBIDDEN, ...)` in `ListAuditLogsUseCase`.
- **Repo Hygiene**: Delete `.pyc` files and add `__pycache__/` and `*.py[cod]` to `.gitignore`.

## Handoff

Ready for planning and execution of Re-review Round 6.
