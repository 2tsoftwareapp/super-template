# Env Loader

## Tổng quan (80/20)

- **Vai trò**: Layered `.env` resolution — shared across API, Next apps, scripts, Drizzle Kit.
- **Layer**: env

## Chi tiết

### Precedence

`.env.example` → `.env.<APP_ENV>` → `.env` → `.env.local` → real env vars

### Validation

`pnpm env:doctor`

### Dependencies

`dotenv`

---

Nguồn: `packages/env-loader/package.json`, `packages/env-loader/`
Last-synced: `8411838`
