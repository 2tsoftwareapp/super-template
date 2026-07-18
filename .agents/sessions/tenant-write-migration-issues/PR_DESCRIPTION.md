## Summary
This PR comprehensively resolves the cross-tenant data leak vulnerabilities in the Audit module, secures the Export file endpoint, patches a critical connection leak in the database purge cron job, and pays down significant technical debt by converting magic strings to system constants.

## What changed
- **Audit Interfaces**: Introduced discriminated unions based on `scope` to ensure `organizationId` is strictly typed and mandatory for organization-level actions, preventing multi-tenant data leaks.
- **Export ACL**: Annotated generated export files with `kind: 'AUDIT_EXPORT'` and implemented a hard block in `FileAccessService` to reject unauthorized downloads.
- **Advisory Locks**: Refactored the audit purge cron job to use `try/finally` wrapped around a raw connection and `unlockAdvisoryLock`, completely eliminating pool exhaustion issues.
- **UX Improvements**: Added a truncated warning (`toast.warning`) in the frontend UI when query results exceed limits.
- **Refactoring (T-009)**: Entirely stripped out hardcoded strings like `'platform'`, `'organization'`, `'AUDIT_EXPORT'`, and `'RESTRICTED'`, replacing them with standard enums across `api-core`, `api-platform`, and `api-identity`.

## How verified
- **TypeScript**: `pnpm typecheck` runs successfully across all packages and apps, proving the type soundness of the new discriminated unions and constants.
- **E2E Tests**: Added API tests to simulate unprivileged tenant users attempting to download audit exports directly, verifying that a `403 Forbidden` is correctly returned.
- **Unit Tests**: Passes `vitest` run for the audit module.

## Reviewer focus
Please review:
1. `FileAccessService` logic regarding `AUDIT_EXPORT` validation.
2. The manual unlock procedure using raw database connections in `PurgeExpiredAuditLogsUseCase`.

## Risks/Follow-ups
No major risks. The connection leak fix resolves an existing high-severity risk. We should continue to monitor connection pool metrics on the database after deployment to confirm resolution.
