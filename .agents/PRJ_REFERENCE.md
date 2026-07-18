# Tham chiếu Dự án (Project Reference)

## Executive summary (80/20)

- **Mục đích (Purpose)**: Một monorepo cấp doanh nghiệp (enterprise template) chứa Backend (NestJS), Web Frontend (Next.js/React) và Mobile (Flutter).
- **Kiến trúc (Architecture)**: Backend tuân theo luồng phụ thuộc nghiêm ngặt: `Presentation → Application → Domain → Application Ports → Infrastructure`. Frontend phân tầng dọc: `Route → Screen → Controller Hook → UI`.
- **Ràng buộc cốt lõi (Critical constraint)**: Không được phép tạo các Service facades (lớp chuyển tiếp) nếu không có logic thực sự; mọi module backend phải theo đúng layer. Dữ liệu multi-tenant cô lập hoàn toàn qua RLS.
- **Workflow (Primary workflow)**: Quản lý monorepo bằng `pnpm` và `turbo`, yêu cầu Node >=24.14.0.
- **Rủi ro lớn nhất (Biggest unknown/risk)**: Mất tính nguyên vẹn kiến trúc (spaghetti code) nếu Agent (AI) hoặc lập trình viên phá vỡ cấu trúc layer, gọi trực tiếp các lớp không được phép.

## Project identity

- **Purpose**: Template chuẩn hóa phát triển ứng dụng full-stack quy mô lớn.
- **Users/stakeholders**: Đội ngũ phát triển (Developers), Quản trị viên (Admin) và Người dùng cuối.
- **Domain**: Kiến trúc Multi-tenant, quản lý danh tính (Identity), tích hợp Platform chung.
- **Lifecycle/status**: Đang phát triển tích cực (Active development).

## Workspaces / apps (monorepo)

| Path | Type | Stack | Entry point | Key commands | Source |
|---|---|---|---|---|---|
| `(root)` | workspace | Node/JS-TS | N/A | `bootstrap`, `dev:turbo`, `lint`, `check` | `package.json` |
| `apps/admin` | app | Next.js (Node/TS) | Next.js App/Pages | `build`, `dev`, `start`, `test` | `apps/admin/package.json` |
| `apps/api` | app | NestJS (Node/TS) | `main.ts` / Composition Root | `build`, `dev`, `start`, `db:push` | `apps/api/package.json` |
| `apps/mobile` | app | Flutter/Dart | `lib/main.dart` | `flutter run`, `flutter build` | `apps/mobile/pubspec.yaml` |
| `apps/web` | app | Next.js (Node/TS) | Next.js App/Pages | `build`, `dev`, `start`, `test` | `apps/web/package.json` |
| `packages/api-contract` | package | Node/JS-TS | `src/generated/index.ts` | `build`, `lint`, `typecheck` | `.../api-contract/package.json` |
| `packages/api-core` | package | NestJS (Node/TS) | N/A (Library) | `build`, `lint`, `test` | `.../api-core/package.json` |
| `packages/api-database` | package | NestJS (Node/TS) | N/A (Library) | `build`, `lint`, `typecheck` | `.../api-database/package.json` |
| `packages/api-health` | package | NestJS (Node/TS) | N/A (Library) | `build`, `lint`, `typecheck` | `.../api-health/package.json` |
| `packages/api-identity` | package | NestJS (Node/TS) | N/A (Library) | `build`, `lint`, `typecheck` | `.../api-identity/package.json` |
| `packages/api-platform` | package | NestJS (Node/TS) | N/A (Library) | `build`, `lint`, `typecheck` | `.../api-platform/package.json` |
| `packages/api-seed` | package | NestJS (Node/TS) | N/A (Library) | `build`, `lint`, `typecheck` | `.../api-seed/package.json` |
| `packages/api-sort` | package | Node/JS-TS | N/A (Library) | `build`, `lint`, `typecheck` | `.../api-sort/package.json` |
| `packages/config` | package | Node/JS-TS | N/A (Library) | `build`, `generate`, `lint` | `.../config/package.json` |
| `packages/env-loader` | package | Node/JS-TS | N/A (Library) | `build`, `lint`, `typecheck` | `.../env-loader/package.json` |
| `packages/eslint-config` | package | Node/JS-TS | N/A (Config) | None | `.../eslint-config/package.json` |
| `packages/tsconfig` | package | Node/JS-TS | N/A (Config) | None | `.../tsconfig/package.json` |
| `packages/utils` | package | Node/JS-TS | N/A (Library) | `build`, `lint`, `typecheck` | `.../utils/package.json` |
| `packages/web-hooks` | package | React (Node/TS) | N/A (Library) | `build`, `lint`, `typecheck` | `.../web-hooks/package.json` |
| `packages/web-server` | package | Next.js (Node/TS) | N/A (Library) | `build`, `lint`, `typecheck` | `.../web-server/package.json` |
| `packages/web-test` | package | React (Node/TS) | N/A (Library) | `build`, `lint`, `typecheck` | `.../web-test/package.json` |
| `packages/web-ui` | package | React (Node/TS) | N/A (Library) | `build`, `lint`, `test` | `.../web-ui/package.json` |
| `packages/web-utils` | package | Next.js (Node/TS) | N/A (Library) | `build`, `lint`, `typecheck` | `.../web-utils/package.json` |
| `tools/tsc7` | package | Node/JS-TS | N/A (Tool) | None | `tools/tsc7/package.json` |

## Technology stack

| Technology | Role | Version | Workspace(s) | Source | Confidence |
|---|---|---|---|---|---|
| Node.js | Runtime | `>=24.14.0` | root, apps, packages | `package.json` | High |
| pnpm | Package Manager | `>=11.7.0` | root | `package.json` | High |
| Turborepo | Build System | `2.9.18` | root | `package.json` | High |
| NestJS | Backend Framework | N/A | `apps/api`, `packages/api-*` | `DESIGN.md` | High |
| Next.js | Frontend Web | N/A | `apps/admin`, `apps/web` | `DESIGN.md` | High |
| Flutter | Mobile Framework | `1.0.0+1` | `apps/mobile` | `pubspec.yaml` | High |
| Drizzle | Database ORM | N/A | `apps/api`, `api-*` hạ tầng | `DESIGN.md` | High |

## Architecture and key flows

| Component / flow | Responsibility | Entry point / boundary | Dependencies | Source |
|---|---|---|---|---|
| **Backend: Presentation** | Xử lý HTTP (route, auth, parse request) | Controller (`*.controller.ts`) | Gọi thẳng Application Use Cases | `DESIGN.md` |
| **Backend: Application** | Orchestration, tx boundary, side effects | Use Case (`*.use-case.ts`) | Domain policies, Application Ports | `DESIGN.md` |
| **Backend: Domain** | Luật nghiệp vụ, validation | `*.policy.ts`, `*.entity.ts` | Không phụ thuộc framework/hạ tầng | `DESIGN.md` |
| **Backend: App Ports** | Interface giao tiếp Database/External | `*.repository.port.ts` | Phục vụ Application | `DESIGN.md` |
| **Backend: Infrastructure**| Chi tiết Database, S3, Email | `drizzle-*.repository.ts` | Hiện thực hóa App Ports | `DESIGN.md` |
| **Frontend: Route** | URL routing | `page.tsx` | Screen | `DESIGN.md` |
| **Frontend: Screen** | Trạm kết nối giữa Controller và UI | `*-screen.tsx` | Controller Hook, UI View | `DESIGN.md` |
| **Frontend: Controller** | Quản lý state, gọi React Query, mutations | `use-*` hooks | API services, Global state | `DESIGN.md` |
| **Frontend: UI View** | Render JSX, Table, Dialog thuần túy | `*-view.tsx`, `*-table.tsx` | Nhận data/callback từ Screen | `DESIGN.md` |

## Business rules

| ID | Rule | Affected area | Source | Confidence |
|---|---|---|---|---|
| BR-001 | Mỗi thư mục layer có một câu hỏi/trách nhiệm duy nhất (SRP) | All modules | `DESIGN.md` | High |
| BR-002 | Không tạo facade Service vô giá trị (chỉ mang tính chuyển tiếp pass-through) | Backend | `DESIGN.md` | High |
| BR-003 | Module domain độc lập: Bounded Context (`api-identity`, v.v) không nằm chung với `apps/api` | Backend | `DESIGN.md` | High |
| BR-004 | Application logic không được nhận/truyền trực tiếp Express Request hay HTTP DTO | Backend | `DESIGN.md` | High |

## Key constraints

| Constraint | Type | Reason/source | Impact |
|---|---|---|---|
| Cấm phá vỡ Layer Dependency | Technical | `DESIGN.md` | Presentation tuyệt đối không được gọi Infrastructure. |
| UI Component không quản lý data | Technical | `DESIGN.md` | Components view không tự gửi fetch API, mọi logic đẩy lên Controller Hook. |

## Verified commands

| Purpose | Command | Source | Confidence |
|---|---|---|---|
| Cài đặt phụ thuộc (Setup) | `pnpm install` | Inferred | High |
| Chạy dev (web/api) | `pnpm run dev` hoặc `pnpm run dev:turbo` | `package.json` (root) | High |
| Chạy test tổng | `pnpm run test` (hoặc `vitest run` trong apps) | `package.json` | High |
| Lint & Checks | `pnpm run lint:policy` và `pnpm run lint` | `package.json` | High |
| Khởi tạo DB/Migrate | `pnpm run db:push`, `pnpm run db:migrate` (trong `apps/api`) | `apps/api/package.json` | High |

## Project conventions

### Code

- Structure/naming: Tên class kết thúc bằng tên layer (`...UseCase`, `...Controller`, `...Port`). Tên file dạng `kebab-case.loại-layer.ts` (VD: `create-user.use-case.ts`).
- Error handling: Application errors phải được ném ở tầng Application (Use Case), không ném từ Hạ tầng (Infrastructure).
- Flow/rationale comments: Comment phải giải thích lý do (why) và context, tránh giải thích các dòng code hiển nhiên (what).

### Git

- Base branch: `main` (inferred)
- Branch naming: Chưa có quy ước cứng (N/A)
- Commit convention: Bắt buộc tuân thủ chuẩn semantic commit (`fix:`, `feat:`, `chore:`).

### Pull requests

- Title: Không quy định cụ thể, tuân theo conventional commits.
- Required description sections: N/A
- Required checks: Chạy qua `pnpm run check` (gồm lint, typecheck, test).

### Reports

- Executive-summary style: Tối đa 5 gạch đầu dòng, tập trung vào kết quả quyết định. Sử dụng 5W1H linh hoạt chỉ cho tình huống phức tạp/chưa rõ.
- Developer overview panel: Bắt buộc (required).
- Charts/diagrams (Mermaid): Dùng mermaid diagram để diễn tả flow/architecture khi hữu ích.
- Session OVERVIEW.md policy: Bắt buộc phải có file này ở mọi session agent.
- Custom sections: Không quy định (N/A).

### Decision and visual gates

- Critical/blocking question policy: Stop-and-ask. Dừng và hỏi khi có blocking issue, không được tự động điền bừa assumptions.
- Preferred diagram format: Diagram cho flows.
- HTML decision-aid policy: Ask-before-create (Chỉ sinh HTML khi người dùng cho phép).

## Security notes

- API truy xuất tài nguyên của Tenant luôn phải truyền `organizationId` để cơ chế RLS kiểm tra chặt chẽ.
- Audit logs, File storage phải áp dụng triệt để cách ly theo Tenant và ACL rights. Mọi tính năng xuất dữ liệu (export) cũng phải nằm trong scope của Tenant.

## Authoritative references

| Source | Purpose | Authority |
|---|---|---|
| `DESIGN.md` | Định nghĩa kiến trúc hệ thống, cấu trúc thư mục, trách nhiệm tầng backend/frontend | primary |
| `AGENTS.md` | Định nghĩa hành vi và quy tắc viết artifact của AI Agent | primary |
| `package.json` | Cấu hình scripts và workspace package management | supporting |
| `.agents/skills/init/scripts/scan_workspaces.sh` | Chịu trách nhiệm khám phá (discovery) toàn bộ workspace thực tế | primary |

## Unknowns and conflicts

| Question / conflict | Impact | Owner | Blocking |
|---|---|---|---|
| Không có | N/A | N/A | no |

## Freshness

- Mode: force
- Generated or updated: Hiện tại (sau lần re-run bằng `force`).
- Source commit: Current workspace state.
- Scope inspected: Toàn bộ thư mục code (24 workspaces) đọc thông qua `scan_workspaces.sh`, nội dung từng manifest (`package.json`, `pubspec.yaml`), và `DESIGN.md`.
