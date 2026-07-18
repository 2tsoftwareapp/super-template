# API Sort

## Tổng quan (80/20)

- **Vai trò**: Multi-column sort parsing — format `sort=field:asc,other:desc` với allow-list validation.
- **Layer**: sort

## Chi tiết

### Import rules

- Backend → `@repo/api-core` (re-export)
- Frontend → `@repo/api-contract/sort/multi-sort` (re-export)

Không import trực tiếp.

---

Nguồn: `packages/api-sort/package.json`, `packages/api-sort/`
Last-synced: `8411838`
