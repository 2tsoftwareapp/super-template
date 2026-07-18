# Web Server

## Tổng quan (80/20)

- **Vai trò**: Server-only Next.js utilities — BFF server helpers, auth cookie management, CSRF response sanitization.
- **Layer**: frontend-core

## Chi tiết

### Exports

`.`, `./server`, `./auth/cookies`, `./auth/sanitize-response`

### Dùng `server-only` marker

Ngăn client imports.

### Dependencies workspace

`@repo/api-contract`, `@repo/web-utils`

---

Nguồn: `packages/web-server/package.json`, `packages/web-server/`
Last-synced: `8411838`
