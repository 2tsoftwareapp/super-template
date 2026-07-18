# TSConfig

## Tổng quan (80/20)

- **Vai trò**: Shared TypeScript configuration presets.
- **Layer**: tsconfig

## Chi tiết

### Presets

| File | Dùng cho |
|---|---|
| `base.json` | Strict: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride` |
| `nest.json` | NestJS packages |
| `next.json` | Next.js apps |

### TS7 note

Type-checking dùng TypeScript 7 (native/Go `tsc`) từ `tools/tsc7`. `typescript@5.9.3` là library shim cho tools chưa compatible với TS7.

---

Nguồn: `packages/tsconfig/package.json`, `packages/tsconfig/`
Last-synced: `8411838`
