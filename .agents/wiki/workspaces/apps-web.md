# Public Website

## Tổng quan (80/20)

- **Vai trò**: Public-facing website — App Router với `[locale]` prefix.
- **Stack**: Next.js 16, React 19, TanStack Query, shadcn/ui, Tailwind CSS 4.
- **Port**: 3000
- **Scripts**: `build`, `dev`, `test` (vitest), `test:e2e` (Playwright), `typecheck`

## Chi tiết

### Cấu trúc

Tương tự admin — vertical-slice features, controller hooks, presentational UI views.

### Dependencies workspace

`@repo/api-contract`, `@repo/env-loader`, `@repo/web-server`, `@repo/web-test`, `@repo/web-ui`, `@repo/web-utils`

### E2E Tests

Playwright tests ở `apps/web/e2e/`.

---

Nguồn: `apps/web/package.json`, `apps/web/`
Last-synced: `8411838`
