# API Seed

## Tổng quan (80/20)

- **Vai trò**: Idempotent development/demo data seeding.
- **Layer**: bootstrap
- **Entry**: `seedDatabase()` — invoked by `pnpm db:seed`.

## Chi tiết

### Seeders

`seeds/` với per-area seeders: `users/`, `access-control/`, `settings/`, `notifications/`.

### Quy tắc

Mọi insert phải idempotent (upsert hoặc existence-check).

### Dependencies workspace

`@repo/api-core`, `@repo/api-database`, `@repo/api-identity`, `@repo/api-platform`

---

Nguồn: `packages/api-seed/package.json`, `packages/api-seed/`
Last-synced: `8411838`
