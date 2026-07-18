# Super Template — Wiki

## Tổng quan (80/20)

- **Mục đích**: Monorepo template doanh nghiệp cho full-stack ứng dụng — Backend NestJS, Web Frontend Next.js/React, Mobile Flutter.
- **Kiến trúc**: Backend phân tầng `Presentation → Application → Domain → App Ports → Infrastructure`. Frontend phân tầng dọc `Route → Screen → Controller Hook → UI View`.
- **Workflow chính**: `pnpm` + Turborepo cho quản lý monorepo. Chạy `pnpm run dev:turbo` để khởi động dev.
- **Ràng buộc lớn nhất**: Không phá vỡ cấu trúc layer — Presentation không được gọi Infrastructure trực tiếp.
- **Bắt đầu từ đâu**: Đọc [Architecture](architecture.md) trước, sau đó xem workspace tương ứng.

## Bản đồ

| Trang | Nội dung |
|---|---|
| [Architecture](architecture.md) | Components, ranh giới, luồng dữ liệu |
| [workspaces/apps/admin](workspaces/apps-admin.md) | Admin dashboard (Next.js) |
| [workspaces/apps/api](workspaces/apps-api.md) | Backend composition root (NestJS) |
| [workspaces/apps/mobile](workspaces/apps-mobile.md) | Mobile client (Flutter) |
| [workspaces/apps/web](workspaces/apps-web.md) | Public website (Next.js) |
| [workspaces/packages/api-contract](workspaces/packages-api-contract.md) | OpenAPI contract types |
| [workspaces/packages/api-core](workspaces/packages-api-core.md) | Shared backend kernel |
| [workspaces/packages/api-database](workspaces/packages-api-database.md) | Drizzle schema + multi-tenant DB |
| [workspaces/packages/api-health](workspaces/packages-api-health.md) | Health check module |
| [workspaces/packages/api-identity](workspaces/packages-api-identity.md) | Identity & access (bounded context) |
| [workspaces/packages/api-platform](workspaces/packages-api-platform.md) | Platform capabilities (bounded context) |
| [workspaces/packages/api-seed](workspaces/packages-api-seed.md) | Idempotent dev/demo data seeding |
| [workspaces/packages/api-sort](workspaces/packages-api-sort.md) | Multi-column sort parsing |
| [workspaces/packages/config](workspaces/packages-config.md) | Shared non-API config |
| [workspaces/packages/env-loader](workspaces/packages-env-loader.md) | Layered .env resolution |
| [workspaces/packages/eslint-config](workspaces/packages-eslint-config.md) | Shared ESLint configs |
| [workspaces/packages/tsconfig](workspaces/packages-tsconfig.md) | Shared TSConfig presets |
| [workspaces/packages/utils](workspaces/packages-utils.md) | Pure TS utilities |
| [workspaces/packages/web-hooks](workspaces/packages-web-hooks.md) | Shared React hooks |
| [workspaces/packages/web-server](workspaces/packages-web-server.md) | Server-only Next.js utilities |
| [workspaces/packages/web-test](workspaces/packages-web-test.md) | Shared vitest test utilities |
| [workspaces/packages/web-ui](workspaces/packages-web-ui.md) | Shared UI component library |
| [workspaces/packages/web-utils](workspaces/packages-web-utils.md) | Shared frontend utilities |
| [workspaces/tools/tsc7](workspaces/tools-tsc7.md) | TypeScript 7 alias isolator |

## Tổng quan Workspaces

| Path | Loại | Stack | Trang |
|---|---|---|---|
| `apps/admin` | app | Next.js 16 / React 19 | [chi tiết](workspaces/apps-admin.md) |
| `apps/api` | app | NestJS 11 | [chi tiết](workspaces/apps-api.md) |
| `apps/mobile` | app | Flutter / Dart | [chi tiết](workspaces/apps-mobile.md) |
| `apps/web` | app | Next.js 16 / React 19 | [chi tiết](workspaces/apps-web.md) |
| `packages/api-contract` | package | Node/TS | [chi tiết](workspaces/packages-api-contract.md) |
| `packages/api-core` | package | NestJS | [chi tiết](workspaces/packages-api-core.md) |
| `packages/api-database` | package | NestJS / Drizzle | [chi tiết](workspaces/packages-api-database.md) |
| `packages/api-health` | package | NestJS | [chi tiết](workspaces/packages-api-health.md) |
| `packages/api-identity` | package | NestJS | [chi tiết](workspaces/packages-api-identity.md) |
| `packages/api-platform` | package | NestJS | [chi tiết](workspaces/packages-api-platform.md) |
| `packages/api-seed` | package | NestJS | [chi tiết](workspaces/packages-api-seed.md) |
| `packages/api-sort` | package | Node/TS | [chi tiết](workspaces/packages-api-sort.md) |
| `packages/config` | package | Node/TS | [chi tiết](workspaces/packages-config.md) |
| `packages/env-loader` | package | Node/TS | [chi tiết](workspaces/packages-env-loader.md) |
| `packages/eslint-config` | package | Node/TS (Config) | [chi tiết](workspaces/packages-eslint-config.md) |
| `packages/tsconfig` | package | Node/TS (Config) | [chi tiết](workspaces/packages-tsconfig.md) |
| `packages/utils` | package | Node/TS | [chi tiết](workspaces/packages-utils.md) |
| `packages/web-hooks` | package | React | [chi tiết](workspaces/packages-web-hooks.md) |
| `packages/web-server` | package | Next.js | [chi tiết](workspaces/packages-web-server.md) |
| `packages/web-test` | package | React (Test) | [chi tiết](workspaces/packages-web-test.md) |
| `packages/web-ui` | package | React (UI) | [chi tiết](workspaces/packages-web-ui.md) |
| `packages/web-utils` | package | Next.js | [chi tiết](workspaces/packages-web-utils.md) |
| `tools/tsc7` | tool | Node/TS | [chi tiết](workspaces/tools-tsc7.md) |

---

Nguồn: `package.json` (root), `DESIGN.md`, `pnpm-workspace.yaml`
Last-synced: `8411838`
