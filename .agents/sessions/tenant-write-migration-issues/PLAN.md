# Plan

## Goal
Implement architectural changes for Feature 05 to completely decouple application logic from PostgreSQL-specific RLS/lock details, guarantee transaction atomicity between mutation and audit logs, and enforce explicit `bypassRls` context for platform writes.

## Approach
1. **PlatformTransactionPort**: Create `PlatformTransactionPort` in `api-core` and implement it in `api-database` to execute platform-scoped logic with `tenantId=""` and `bypassRls=true`.
2. **Atomicity**: Update `UploadFileUseCase`, `CreateFileVersionUseCase`, `AttachFileUseCase`, `CreateImportUseCase`, `ConfirmImportUseCase` to wrap business mutation and audit creation within a single transaction using `TransactionPort`.
3. **Decouple Infrastructure**:
   - Create `AdvisoryLockPort` in `api-core` and implement it in `api-database` to handle try/delete/unlock inside the same pool client.
   - Refactor `PurgeExpiredAuditLogsUseCase` to depend on `AdvisoryLockPort`.
   - Update `ListAuditLogsUseCase` to correctly apply `organizationId` filter consistency.
   - Update `TenantContextInterceptor` to create context with `bypassRls: true` for SUPER_ADMIN when no organization is active.
   - Update `ListFilesUseCase` to filter out `AUDIT_EXPORT` (or only include if `audit.read`).
   - Fix E2E tests and ensure database tokens are imported correctly.

## DoD
- All platform audit events successfully insert under RLS without exceptions.
- Global operations correctly use bypass transaction context.
- Advisory lock does not use `any` or `PoolClient` in the application layer.
- Mutation + audit are fully atomic.
- Tests verify these capabilities without using Superuser.

## Rollback
`git reset --hard HEAD`
