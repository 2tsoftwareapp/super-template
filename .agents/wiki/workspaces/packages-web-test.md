# Web Test

## Tổng quan (80/20)

- **Vai trò**: Shared vitest test utilities — re-exported `@testing-library/react` render helper + setup.ts.
- **Layer**: frontend-test

## Chi tiết

### Exports

`.`, `./setup`, `./render`

### Nội dung

- `render` — testing-library render helper
- `setup.ts` — jsdom polyfills (matchMedia, etc.)

Chống stub duplication giữa các apps.

---

Nguồn: `packages/web-test/package.json`, `packages/web-test/`
Last-synced: `8411838`
