# Web Utils

## Tổng quan (80/20)

- **Vai trò**: Shared frontend utilities — HTTP client, API type helpers, search params, session, storage.
- **Layer**: frontend-core

## Chi tiết

### Exports

`.`, `./api-types`, `./http`, `./http-config`, `./json`, `./search-params`, `./session`, `./storage`, `./utils`, `./theme/tweakcn-fonts`

### Quy tắc

Chỉ `features/*/api/*.api.ts` và shared HTTP infrastructure được import `webFetch`.

### Dependencies workspace

`@repo/api-contract`, `@repo/utils`

---

Nguồn: `packages/web-utils/package.json`, `packages/web-utils/`
Last-synced: `8411838`
