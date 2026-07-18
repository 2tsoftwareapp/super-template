# Tenant Write Migration & Audit Leak

## Context
Fixed a multi-tenant data leak where audit logs could be written to the wrong tenant if `organizationId` was omitted, fixed Export ACL bypasses, and addressed an advisory lock leak in the DB.

## Non-obvious Decisions & Why
1. **Discriminated Unions for Scope**: We refactored `AuditLogInput` into a discriminated union based on `scope: 'platform' | 'organization'`.
   * **Why**: To push the burden of checking for `organizationId` onto the TypeScript compiler instead of runtime validation. If a developer uses `scope: 'organization'`, TS forces them to pass an `organizationId`.
2. **Export File ACL**: Audit CSV/Excel exports are saved in the generic `files` table. We added `kind: SYSTEM_SCOPE.AUDIT_EXPORT` and `visibility: FILE_VISIBILITY.RESTRICTED`.
   * **Why**: Generic file download endpoints (`/api/v1/files/:id`) could previously be abused by users who guessed the file ID, bypassing audit permissions. `FileAccessService` now specifically traps `AUDIT_EXPORT` and applies audit-specific RBAC.
3. **Try/Finally for Advisory Locks**: The `pg_try_advisory_lock` in `purge-expired-audit-logs.use-case.ts` was leaking when exceptions occurred.
   * **Why**: We must check out a raw connection from the pool, call `pg_try_advisory_lock(conn, id)`, run the queries, and then ALWAYS call `pg_advisory_unlock(conn, id)` inside a `finally` block before releasing the connection. Failing to do this exhausts the pool.

## Reusable Conventions
* **No Magic Strings**: Never hardcode scopes (`'platform'`, `'organization'`) or internal file kinds (`'AUDIT_EXPORT'`). Always import from `api-core` (`SYSTEM_SCOPE`, `FILE_KIND`, `FILE_VISIBILITY`, `ROLE_NAMES`).
* **RLS/Audit Types**: When building multi-tenant interfaces, use discriminated unions on the discriminator field (like `scope`) to ensure the compiler enforces required fields.

## Pointers
* **File Security**: `FileAccessService` (`packages/api-platform/src/modules/files/application/services/file-access.service.ts`)
* **Constants**: `packages/api-core/src/common/constants/`
