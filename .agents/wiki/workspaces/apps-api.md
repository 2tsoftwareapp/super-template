# Backend API

## Tổng quan (80/20)

- **Vai trò**: Backend composition root — bootstraps NestJS, imports bounded contexts, configures global pipes/filters/interceptors, mounts Swagger, runs CLI commands.
- **Stack**: NestJS 11, Drizzle ORM, PostgreSQL.
- **Port**: 3001
- **Scripts**: `build` (nest build), `dev` (nest start --watch), `db:generate`, `db:migrate`, `db:push`, `db:seed`, `db:studio`, `openapi:generate`, `contract:generate`, `test`, `test:e2e`

## Chi tiết

### Cấu trúc

```
src/main.ts              # Bootstrap
src/app.module.ts        # Root module
src/cli/                 # Migrate/seed/reset scripts
src/openapi/             # Swagger setup
src/shell/               # CLI helpers
```

### Dependencies workspace

`@repo/api-core`, `@repo/api-database`, `@repo/api-health`, `@repo/api-identity`, `@repo/api-platform`, `@repo/api-seed`

### Không chứa feature logic

App API chỉ là composition root. Feature logic nằm trong các bounded context packages (`api-identity`, `api-platform`, etc.)

---

Nguồn: `apps/api/package.json`, `apps/api/`
Last-synced: `8411838`
