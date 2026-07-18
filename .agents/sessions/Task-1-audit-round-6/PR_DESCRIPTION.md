## Summary

Fixes and finalizes Feature 05 Audit Logs implementation by resolving integration issues with global E2E testing context, stabilizing Export job states, supporting partial transactions for data bulk imports, standardizing Domain AppErrors, and cleaning up compiled python artifacts.

## Changes

- **E2E Test Auth Bypass:** Nullifies `organizationId` in token if header `x-organization-id` is empty to support global (Platform) e2e testing.
- **Export Jobs:** Moves `listForExport` into the standard try-catch block inside `create-export.use-case.ts` to reliably mark job as FAILED on error instead of indefinitely keeping it at PROCESSING.
- **Import Savepoints:** Embeds each parsed row `importRow()` call in a raw SQL `SAVEPOINT` + `ROLLBACK TO SAVEPOINT` transaction scope using Drizzle, securing successful rows even if other rows fail.
- **Audit Domain Error:** Converts the generic `throw new Error(...)` to `throw new AppError(ERROR_CODES.AUTH_FORBIDDEN, ...)` inside `ListAuditLogsUseCase`.
- **Orphan File Handling:** Logs storage deletion errors if an explicit `catch(err)` is hit due to missing background workers (deferring the complete Outbox structure).
- **Repo Hygiene:** Adds `.gitignore` rules for python caching and removes committed `.pyc` files under `.agents/skills/`.

## Verification

- `bun run build` verifies type safety for platform API logic changes.
- `vitest` / Unit test suite successfully passed on modified files.
- Manual verification of Savepoint queries compatibility in Drizzle.

## Review Notes

- Reviewer should verify `SAVEPOINT` implementation correctly isolates failures and doesn't leak transaction blocks.
- Background worker for S3 Cleanup is currently marked as deferred. A fallback strategy with `console.error` and block catch is implemented as a placeholder.

## Risks/Follow-ups

- Potential zombie objects in S3 if the API instance gets killed midway. (Requires an Outbox/BullMQ queue later on).
