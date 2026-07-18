# API Database

## Tổng quan (80/20)

- **Vai trò**: Drizzle schema + multi-tenant DB runtime — table definitions, RLS tenant context, database provider.
- **Layer**: database
- **Quy tắc**: Chỉ repository (`*/infrastructure/`) được import từ đây. Application layers không được touch Drizzle trực tiếp.

## Chi tiết

### Cấu trúc

| Path | Nội dung |
|---|---|
| `schema/identity/` | Identity tables |
| `schema/platform/` | Platform tables |
| `schema/shared/` | Shared tables |
| `tenant-context.ts` | GUCs cho RLS |
| `database-rls.guard.ts` | RLS guard |
| `database.provider.ts` | Tenant-aware pool |
| `idempotent-insert.ts` | Idempotent insert helper |
| `postgres-errors.ts` | Postgres error mapping |
| `transaction.ts` | Transaction helpers |
| `drizzle-transaction.service.ts` | Drizzle transaction service |

### Dependencies workspace

`@repo/api-core`

---

Nguồn: `packages/api-database/package.json`, `packages/api-database/`
Last-synced: `8411838`
