# ESLint Config

## Tổng quan (80/20)

- **Vai trò**: Shared flat ESLint configurations.
- **Layer**: eslint

## Chi tiết

### Configs

| File | Dùng cho |
|---|---|
| `base.mjs` | TS + perfectionist import sorting |
| `nest.mjs` | API packages |
| `next.mjs` | Web apps |

App-specific boundary rules được thêm trong `eslint.config.mjs` của từng app.

### Peer dependencies

ESLint 9, `@eslint/js`, `@next/eslint-plugin-next`, `typescript-eslint`, `eslint-plugin-perfectionist`, `eslint-plugin-import`, `eslint-plugin-react`, `eslint-plugin-react-hooks`

---

Nguồn: `packages/eslint-config/package.json`, `packages/eslint-config/`
Last-synced: `8411838`
