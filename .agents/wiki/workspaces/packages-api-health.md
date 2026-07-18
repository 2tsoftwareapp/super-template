# API Health

## Tổng quan (80/20)

- **Vai trò**: Health check module — `GET /api/v1/health` với database + queue depth indicators.
- **Layer**: health
- **Consumed by**: CI, admin dashboard, orchestrators.

## Chi tiết

### Dependencies workspace

`@repo/api-core`, `@repo/api-database`

---

Nguồn: `packages/api-health/package.json`, `packages/api-health/`
Last-synced: `8411838`
