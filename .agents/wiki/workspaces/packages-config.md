# Shared Config

## Tổng quan (80/20)

- **Vai trò**: Shared non-API application config — pagination defaults, page sizes.
- **Layer**: core
- **Export**: JSON + Dart artifact qua `pnpm generate`.

## Chi tiết

### Scripts

`generate` (tsx → `generated/config.json` + Dart artifact).

### Exports

`.`, `./pagination`

---

Nguồn: `packages/config/package.json`, `packages/config/`
Last-synced: `8411838`
