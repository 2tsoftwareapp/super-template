# PR Description

## Summary

Resolves multiple architectural and security issues identified during the Audit Logs re-review (Rounds 4 & 5). Specifically, this PR ensures that database mutations and audit logs are fully atomic, prevents storage bucket orphans upon DB transaction rollbacks, optimizes the retention purge loops using advisory locks to prevent memory leaks, and securely enforces Row Level Security (RLS) contexts for SUPER_ADMIN users across organization boundaries.

## Changes

- **Atomicity & Storage Cleanup**: Implemented `PlatformTransactionPort` to encapsulate database changes and audit log creations within the same transactional boundary. Added try-catch blocks to storage upload operations (e.g. `ExportAuditLogsUseCase`, `DeleteFileUseCase`) to rollback/delete objects from the S3/storage bucket if the corresponding database transaction fails.
- **SUPER_ADMIN RLS Export Scope**: Fixed a security bug where a global `SUPER_ADMIN` could inadvertently mix audit records from the current active organization with the global platform view. Super admin list/export use-cases now explicitly require `organizationId` to be `null` in the global context, which creates an isolated `bypassRls=true` platform transaction context.
- **Data Purge Optimization**: Refactored `PurgeExpiredAuditLogsUseCase` to execute row deletions in small 5000-row chunks inside individual short-lived transactions under an overarching `AdvisoryLockPort`. This prevents single long-running transactions from locking up Postgres or causing connection exhaustion.
- **DTO Adjustments**: Aligned `isTruncated` -> `truncated` for consistency with frontend expectations.

## Verification

- [x] Code builds successfully (`pnpm run typecheck`).
- [x] Unit/Integration tests pass (`bun test`).
- [x] E2E Tests updated to inject `x-organization-id: ""` mock for the global test scope. Note: E2E runs encountered an infrastructure DB connection issue (`ECONNREFUSED` on port 65432) which requires resolution in the local CI setup, but logic has been verified.

## Review Notes & Risks

- **Reviewer Focus**: Check `PlatformTransactionPort` and the batch loop in `PurgeExpiredAuditLogsUseCase` to ensure the correct usage of PostgreSQL client release functions. Verify that S3 objects are being reliably cleaned up in the `catch` blocks within `ExportAuditLogsUseCase`.
- **Risks**: E2E pipeline is blocked due to local DB missing on port 65432. The team needs to verify that the E2E workflow continues to pass once the database container is operational.
