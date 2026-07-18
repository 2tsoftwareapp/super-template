# Admin Dashboard

## Tổng quan (80/20)

- **Vai trò**: Internal admin SPA — quản lý users, roles, jobs, mail, notifications, audit logs, settings.
- **Stack**: Next.js 16, React 19, shadcn/ui, TanStack Query, Tailwind CSS 4.
- **Port**: 3002
- **Scripts**: `build` (next build), `dev` (next dev), `test` (vitest), `typecheck`

## Chi tiết

### Cấu trúc thư mục

```
src/app/[locale]/        # Route pages (mỏng)
src/features/<x>/        # Vertical slices
  api/                   # API functions
  model/                 # Types/schemas
  controllers/           # Controller hooks
  screens/               # Screen components
  ui/                    # View components
src/components/          # Shell + cross-resource components
src/lib/                 # Pure helpers
```

### Dependencies workspace

`@repo/api-contract`, `@repo/api-sort`, `@repo/env-loader`, `@repo/config`, `@repo/web-hooks`, `@repo/web-server`, `@repo/web-test`, `@repo/web-ui`, `@repo/web-utils`

### Quy tắc ESLint

- `app/**` (trừ `app/api/**`) không được import TanStack Query hoặc `@/lib/http`
- Features không được import từ `app/`

---

Nguồn: `apps/admin/package.json`, `apps/admin/`
Last-synced: `8411838`
