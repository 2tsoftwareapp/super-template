# API Contract

## Tổng quan (80/20)

- **Vai trò**: Generated OpenAPI contract types — single source of truth cho HTTP DTOs/shapes.
- **Không edit tay**: File được sinh từ OpenAPI spec qua `openapi-typescript`.
- **Export**: `.` → `src/index.ts`, re-export `@repo/api-sort` như `sort/multi-sort`

## Chi tiết

### Luồng generate

```
NestJS → OpenAPI JSON → openapi-typescript → src/generated/index.ts
```

Chạy `pnpm generate` ở root.

### Consumers

Tất cả frontend apps (web, admin) import từ package này. Mobile có codegen riêng từ cùng OpenAPI spec.

---

Nguồn: `packages/api-contract/package.json`, `packages/api-contract/`
Last-synced: `8411838`
