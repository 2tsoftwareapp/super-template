# Báo cáo bàn giao source code template

> Ngày kiểm chứng: **2026-06-30**  
> Repo: `super-template`  
> Branch: `main`  
> Commit nền: `66c19c8` + working tree remediation  
> Người lập báo cáo: fullstack reviewer / handover reviewer  
> Ngôn ngữ báo cáo: Tiếng Việt

---

## 1. Kết luận điều hành

Template này đã vượt xa mức starter cơ bản. Repo có monorepo Turborepo, backend NestJS theo hướng modular monolith, OpenAPI contract-first, Next.js web/admin BFF, Flutter mobile, browser-control extension, Docker infra, env doctor, CI workflow, RLS tenancy, RBAC, MFA, SSO, audit, jobs, notifications, files/import/export và bộ test tương đối rộng.

Tại thời điểm kiểm chứng lại **2026-06-30**, các blocker P0 phát hiện ở vòng audit đầu đã được xử lý trong working tree: root lint/typecheck/build pass, API e2e pass, mobile format-check không còn ghi file ngoài ý muốn. Repo chưa nên gọi là "golden template" tuyệt đối vì vẫn còn P1/P2 về mobile monorepo integration, public API boundary và repo hygiene/artifact policy, nhưng đã đủ điều kiện bàn giao kỹ thuật ở trạng thái **conditional handover**.

| Gate | Kết quả | Nhận xét |
|---|---:|---|
| `pnpm run generate:check` | Pass | OpenAPI, TypeScript contract và Dart client đồng bộ |
| `pnpm run lint:policy` | Pass | Custom policy + `turbo boundaries` pass trên 828 files / 18 packages |
| `pnpm run lint` | Pass | 16/16 package lint pass |
| `pnpm run typecheck` | Pass | 16/16 package typecheck pass |
| `pnpm exec turbo run test --force` | Pass | API 49 files / 217 tests, admin 34 tests, web 12 tests, web-core 8 tests |
| `pnpm run build` | Pass | 16/16 package build pass, gồm Next web/admin và Nest API |
| `pnpm --filter api test:e2e` | Pass | 12 files / 52 e2e tests pass |
| `pnpm run mobile:format-check` | Pass | 454 Dart files checked, 0 changed; check-only không tạo diff |
| `pnpm run mobile:analyze` | Pass | Flutter analyze không báo lỗi |
| `pnpm run mobile:test` | Pass | 36 mobile tests pass |

**Quyết định bàn giao đề xuất:** có thể bàn giao như **technical accelerator / source template có điều kiện**, kèm danh sách P1/P2 và roadmap hoàn thiện. Chưa nên chốt là "golden template production-ready" cho nhiều dự án cho tới khi xử lý repo hygiene, public package boundary, docs package-boundary và mobile first-class integration.

---

## 2. Phạm vi và phương pháp rà soát

Phạm vi đã đọc và kiểm chứng trực tiếp:

| Nhóm | Phạm vi |
|---|---|
| Monorepo | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, package-level `turbo.json`, scripts, Makefile |
| Backend API | `apps/api`, `packages/api-core`, `api-database`, `api-identity`, `api-platform`, `api-workspace`, `api-health`, `api-bootstrap` |
| Contract | `apps/api/openapi.json`, `packages/api-contract`, `packages/api-sort`, generate scripts |
| Frontend | `apps/web`, `apps/admin`, `packages/web-core`, `packages/web-test` |
| Mobile | `apps/mobile`, `scripts/mobile.sh`, generated Dart client, Flutter tests |
| Extension | `packages/extension`, Vite build, browser-control artifacts |
| Database | Drizzle schema, 16 SQL migrations, RLS role/migration posture |
| Docs | README và các review cũ trong `docs/` |
| Verification | Lệnh thực tế chạy trong workspace hiện tại |

Toolchain tại thời điểm kiểm chứng:

| Tool | Version / trạng thái |
|---|---|
| Node | `v24.15.0` |
| pnpm | `11.7.0` |
| Docker | `29.5.3` |
| Flutter | `3.44.4` |
| Dart | `3.12.2` |
| Docker infra | `env:doctor` báo đang chạy và sẵn sàng |

---

## 3. Tóm tắt chức năng hiện có

### 3.1 Backend API

OpenAPI hiện có **89 paths** và khoảng **115 operations**.

| Nhóm endpoint | Số path |
|---|---:|
| `admin` | 25 |
| `auth` | 22 |
| `notifications` | 8 |
| `files` | 7 |
| `organizations` | 5 |
| `projects` | 4 |
| `imports` | 3 |
| `invitations` | 3 |
| `users` | 3 |
| `attachments` | 2 |
| `comments` | 2 |
| `exports` | 2 |
| `health` | 2 |
| `activities` | 1 |

Các capability đã có:

| Capability | Trạng thái |
|---|---|
| Auth cơ bản | Register, login, refresh, logout, logout-all, session list/revoke |
| Email flows | Verify email, resend verification, forgot/reset password |
| MFA | TOTP, recovery codes, MFA challenge flow |
| SSO | Google, Apple, GitHub, fake provider cho dev/test |
| RBAC | Roles, permissions, role assignment, admin role management |
| Organization tenancy | Organizations, members, switch organization, tenant context |
| RLS | PostgreSQL RLS role, app role `fullstack_starter_app`, tenant GUC |
| Audit | Audit log, export audit logs, retention purge |
| Notifications | Inbox, device tokens, jobs, FCM optional, SSE support ở backend |
| Jobs | Background jobs, attempts, dependencies, observability events |
| Files | Upload, metadata, versions, batch delete, local/S3 storage config |
| Import/export | Generic registry tồn tại, adapter hiện rõ nhất cho `projects` |
| Mail | SMTP/Mailpit, templates, admin mail |
| Settings | Application settings API |
| Health | Liveness/readiness |

### 3.2 Web app

`apps/web` là Next.js app dùng BFF pattern:

| Điểm | Đánh giá |
|---|---|
| Auth transport | HttpOnly cookies + CSRF qua BFF |
| API access | Browser gọi `/api/bff/...`, BFF forward sang NestJS API |
| Public pages | Landing, login, register, forgot/reset, verify email, invite |
| App shell | Home, projects, notifications, profile/preferences/security/session |
| Test | 5 Vitest files / 12 tests pass |
| Trạng thái build | Pass trong root `pnpm run build` |

### 3.3 Admin app

`apps/admin` cũng là Next.js app và hiện đã dùng cùng hướng BFF + HttpOnly cookie:

| Điểm | Đánh giá |
|---|---|
| Auth transport | Không còn thấy localStorage token cho auth; dùng admin-specific cookies |
| Modules UI | Dashboard, users, roles, projects, audit logs, notifications, jobs, mail, files, imports, settings |
| Shared logic | Dùng `@repo/web-core`, `@repo/api-contract`, `@repo/web-test` |
| Test | 7 files / 34 tests pass |
| Trạng thái build | Pass trong root `pnpm run build` |

### 3.4 Mobile app

`apps/mobile` là Flutter app:

| Điểm | Đánh giá |
|---|---|
| Architecture | `app`, `core`, `features`, `generated/api`, `test` khá rõ |
| State | Flutter Riverpod |
| Routing | `go_router`, shell route, admin routes, auth redirect |
| API | Generated Dart Dio client từ OpenAPI |
| Auth | Secure token storage, refresh single-flight interceptor |
| Push | FCM optional, device registration |
| Design system | Material 3 + `design-system/MASTER.md` + UI Kit gallery |
| Analyze | Pass |
| Tests | Pass 36 tests |
| Format check | Pass; `format-check` dùng `--output=none` nên không rewrite file |
| Monorepo integration | Chưa nằm trong `pnpm-workspace.yaml` / Turbo graph |

### 3.5 Browser-control extension

`packages/extension` là Vite/browser extension hỗ trợ Playwright MCP/browser control:

| Điểm | Đánh giá |
|---|---|
| Build | Vite extension build pass trong root build |
| Scope | Hữu ích cho kiểm thử/agent workflow, không nên coi là core product runtime |
| Hygiene | Có nhiều screenshots/logs/artifacts đang được Git track, cần phân loại lại |

---

## 4. Đánh giá core packages

### 4.1 Cách nên hiểu "core" trong repo này

Khách hàng chưa hài lòng về core package là hợp lý, vì repo đang có nhiều lớp "core" khác nhau:

| Lớp | Package | Vai trò đúng |
|---|---|---|
| Tooling foundation | `@repo/tsconfig`, `@repo/eslint-config`, `@repo/env-loader` | Cấu hình chung và env layering |
| Pure shared logic | `@repo/api-sort` | Logic sort dùng chung client/server |
| Backend foundation | `@repo/api-core`, `@repo/api-database`, `@repo/api-health` | Error, guards, ports, config, DB, health |
| Backend capability | `@repo/api-identity`, `@repo/api-platform`, `@repo/api-workspace` | Domain/capability modules |
| Composition | `@repo/api-bootstrap`, `apps/api` | Seed/composition root, không phải core đáy |
| Contract | `@repo/api-contract` | Generated OpenAPI types + client helper exports |
| Frontend shared | `@repo/web-core`, `@repo/web-test` | Shared BFF/client UI/test utilities |

Nhận định: backend foundation khá mạnh. Vấn đề P0 của `web-core` đã được xử lý bằng cách tách hằng số cookie client-safe ở app layer, bổ sung export chính thức cho `sanitize-response`, và chỉnh helper sanitize để dùng được với envelope không chứa token. Dù vậy, về kiến trúc dài hạn vẫn nên chuẩn hóa rõ `server`/`client` public surface của `web-core`.

### 4.2 Điểm mạnh của core backend

| Điểm mạnh | Bằng chứng |
|---|---|
| Global validation đúng chuẩn NestJS | `apps/api/src/main.ts` dùng `ValidationPipe` với `whitelist`, `forbidNonWhitelisted`, `transform` |
| Security baseline tốt | Helmet, CORS theo env, throttler, auth guard, authorize guard |
| Error model tập trung | `AppError`, `ERROR_CODES`, `AppExceptionFilter`, response envelope |
| Env schema nghiêm | Zod schema, cấm placeholder secrets ở staging/production, yêu cầu HTTPS/cookie secure |
| DB tenancy có chủ đích | Tenant-aware pool, RLS guard, app DB role không `BYPASSRLS` |
| Contract-first thật | `generate:check` regenerate OpenAPI, TS contract, Dart client và kiểm drift |
| Test core đã cải thiện | `api-core`, `api-database`, `api-health`, `api-sort` đều có unit tests |

### 4.3 Điểm yếu còn lại của core/backend packages

| Mức | Vấn đề | Tác động | Khuyến nghị |
|---|---|---|---|
| Đã xử lý | Root lint/typecheck/build từng fail | Đã pass sau remediation | Duy trì gate này trong CI |
| Đã xử lý | `web-core` thiếu export `./auth/sanitize-response` | Đã thêm subpath export | Nên bổ sung import smoke tests cho public exports |
| Đã xử lý | Server-only cookie helper từng bị kéo vào client | Đã tách `cookie-names.ts` client-safe ở web/admin | Dài hạn nên tách package surface `server`/`client` rõ hơn |
| P1 | Public surface của `api-identity`, `api-platform`, `api-workspace` còn rộng qua wildcard exports | Khó kiểm soát API nội bộ/public | Chuẩn hóa barrel exports và cấm deep import không cần thiết |
| P1 | Nhiều application use-case import trực tiếp infrastructure repository | Chưa clean architecture nghiêm; khó mock/replace | Dùng repository port/interface nhất quán hoặc document đây là modular-monolith pragmatic choice |
| P1 | Một số repository port derive type từ concrete repository | Application layer vẫn phụ thuộc ngược vào infrastructure type | Khai báo record/value types ở application/domain layer |
| P1 | `api-bootstrap` dễ bị hiểu nhầm là core | Composition/seed phụ thuộc lên feature packages | Đổi phân loại tài liệu thành composition package |
| P2 | Policy scripts chưa bắt runtime export artifacts | `lint:policy` pass dù repo có tracked generated CSV/log/screenshot artifacts | Mở rộng policy check |

---

## 5. Đánh giá monorepo và Turborepo

### 5.1 Điểm tốt

| Điểm | Nhận xét |
|---|---|
| `apps/` và `packages/` rõ | Đúng cấu trúc monorepo chuẩn |
| Root scripts delegate qua `turbo run` | `build`, `test`, `typecheck`, `format` dùng Turbo |
| Package tags/boundaries | `turbo boundaries` có rule theo `layer:*` và đang pass |
| Package-level `turbo.json` | Nhiều package no-emit đã override `build.outputs: []`, tốt hơn review cũ |
| Contract generation | Có task `generate` và `generate:check` |

### 5.2 Điểm chưa đạt

| Mức | Vấn đề | Bằng chứng |
|---|---|---|
| P1 | Mobile không thuộc pnpm workspace | `pnpm-workspace.yaml` không include `apps/mobile` |
| P1 | Turbo graph không thấy mobile | `turbo run build --dry=json` chỉ có 18 pnpm packages, không có mobile |
| P1 | Root `verify` chưa đại diện đầy đủ nếu mobile vẫn ngoài Turbo graph | Mobile chỉ được chạy qua root wrapper scripts |
| Đã xử lý | `mobile:format-check` từng có side effect | Đã dùng `dart format --output=none --set-exit-if-changed lib test` |
| P2 | Extension artifacts/logs nằm trong package source | Có nhiều `packages/extension/artifacts/*`, `packages/extension/*.png`, `*.log` được Git track |
| P2 | API export CSV artifacts được Git track | Có 42 files trong `apps/api/storage/exports/audit` được Git track |

### 5.3 Khuyến nghị monorepo

| Ưu tiên | Việc cần làm |
|---|---|
| Đã xử lý | Làm xanh `pnpm lint`, `pnpm typecheck`, `pnpm build` |
| P1 | Quyết định mobile là first-class target hay optional companion |
| P1 | Nếu first-class: thêm wrapper package hoặc Turbo custom target cho mobile verify |
| Đã xử lý | Đổi mobile format check thành `dart format --output=none --set-exit-if-changed lib test` |
| P1 | Mở rộng source policy để fail khi track `apps/api/storage/exports/**`, extension logs/test artifacts |
| P2 | Tách demo screenshots thành `docs/assets/` nếu cần giữ làm bằng chứng |

---

## 6. Đánh giá từng app triển khai

### 6.1 `apps/api`

**Đánh giá:** mạnh nhất trong repo, nhiều capability, cấu trúc module rõ, nhưng e2e và clean architecture vẫn cần siết.

Điểm tốt:

| Điểm | Nhận xét |
|---|---|
| Composition root rõ | `AppModule` import config, logging, import/export, throttling, DB, health, identity, platform, workspace |
| Guard/interceptor toàn cục | Throttler, AuthGuard, AuthorizeGuard, ResponseEnvelope, TenantContext |
| Database lifecycle | `DatabaseModule` close pool khi shutdown |
| E2E rộng | 12 e2e files / 52 tests pass |
| Migrations đầy đủ | E2E apply đủ migrations trong test database |

Điểm cần hoàn thiện:

| Mức | Vấn đề | Nhận xét |
|---|---|---|
| Đã xử lý | `preferences.e2e.spec.ts` từng fail | Đã thêm compatibility alias `Asia/Ho_Chi_Minh` -> `Asia/Saigon` khi runtime hỗ trợ canonical timezone |
| P1 | Application layer import nhiều concrete repository | Giảm khả năng thay adapter/test bằng mock |
| P1 | Import/export vẫn chủ yếu chứng minh qua `projects` | Cần có adapter sample thứ hai để chứng minh framework thật sự generic |
| P2 | E2E tạo export CSV trong workspace | Nên write vào temp dir hoặc cleanup tự động |

### 6.2 `apps/web`

**Đánh giá:** hướng BFF tốt và hiện đã build/typecheck pass. Điểm cần tiếp tục siết là public surface `web-core` để server-only helper không bị import nhầm vào client trong tương lai.

Điểm tốt:

| Điểm | Nhận xét |
|---|---|
| Không giữ auth token trong browser storage | BFF lưu token trong HttpOnly cookie |
| CSRF | BFF enforce origin + CSRF cho mutation |
| Refresh token tự động | `proxyWithRefresh` refresh khi backend trả 401 |
| Contract reuse | Dùng `@repo/api-contract` |

Blocker đã xử lý:

| Mức | Vấn đề |
|---|---|
| Đã xử lý | Import `@repo/web-core/auth/sanitize-response` đã có export chính thức |
| Đã xử lý | HTTP client dùng `cookie-names.ts` client-safe, không kéo `next/headers` vào client bundle |
| Đã xử lý | `pnpm run build` pass |

Khuyến nghị:

| Ưu tiên | Việc cần làm |
|---|---|
| Đã xử lý | Tách hằng số cookie client-safe tại app layer |
| Đã xử lý | Chỉ HTTP client import module client-safe |
| Đã xử lý | Thêm exports chính thức cho subpath dùng bởi apps |
| P1 | Thêm lint rule hoặc convention `*.server.ts` / `server-only` để chặn import sai vào client |

### 6.3 `apps/admin`

**Đánh giá:** đã cải thiện nhiều so với review cũ. Admin hiện dùng BFF/cookies giống web, test baseline đã có, và build pass trong root `pnpm run build`.

Điểm tốt:

| Điểm | Nhận xét |
|---|---|
| BFF auth | Dùng admin-specific HttpOnly cookie names |
| UI breadth | Users, roles, projects, jobs, mail, imports/exports, audit logs, settings |
| Tests | 34 tests pass |
| Shared table/sort logic | Dùng `@repo/api-contract/sort/multi-sort` |

Điểm cần hoàn thiện:

| Mức | Vấn đề |
|---|---|
| Đã xử lý | Build admin đã pass trong root `pnpm run build` |
| P1 | Test chủ yếu utility/BFF, cần thêm route smoke/render tests cho các màn admin quan trọng |
| P2 | Admin và web dùng chung `web-core`; cần đảm bảo shared core không rò server-only vào client |

### 6.4 `apps/mobile`

**Đánh giá:** mobile có cấu trúc tốt và chạy được analyze/test, nhưng chưa phải first-class monorepo target.

Điểm tốt:

| Điểm | Nhận xét |
|---|---|
| Layering | `core`, `features`, `domain`, `data`, `presentation` rõ |
| Generated API | Dùng Dart Dio client generated từ OpenAPI |
| Auth mobile | Secure storage + refresh single-flight |
| UI Kit | Có gallery và design-system docs |
| Analyze/test | Pass |

Điểm cần hoàn thiện:

| Mức | Vấn đề | Khuyến nghị |
|---|---|---|
| P1 | Không nằm trong pnpm/Turbo graph | Thêm wrapper target hoặc ghi rõ optional companion |
| Đã xử lý | `mobile:format-check` từng rewrite file | Đã dùng `--output=none`; file chưa format đã được format một lần |
| P1 | Một số tests còn nông | Test router thật thay vì pure mirror logic |
| P1 | Router invite logic và test mirror có dấu hiệu lệch | Test hiện kỳ vọng unauthenticated `/invite/:token` redirect login, nhưng router hiện cho invite route render |
| P2 | Generated client lớn và excluded analyzer | Cần drift check mạnh hơn cho Dart client |

### 6.5 `packages/extension`

**Đánh giá:** là capability phụ hữu ích cho browser automation, không nên làm trọng tâm core template.

Điểm cần làm rõ khi bàn giao:

| Điểm | Nhận xét |
|---|---|
| Vai trò | Optional developer/agent tooling |
| Build | Vite build pass trong root build |
| Artifacts | Nhiều logs/screenshots nên chuyển khỏi package source hoặc ignore |
| Runtime contract | Cần README hướng dẫn cài extension, start MCP server, reset session |

---

## 7. Đánh giá database, tenancy và bảo mật

### 7.1 Điểm tốt

| Điểm | Nhận xét |
|---|---|
| Drizzle schema rõ | Identity, platform, workspace, shared timestamps |
| RLS có chủ đích | Tenant tables enable + force RLS trong migrations |
| App DB role | Migration reconcile role `fullstack_starter_app` với `NOBYPASSRLS` |
| Tenant context | `TenantContextService` + tenant-aware Pool apply GUC |
| Startup guard | `DatabaseRlsGuard` tồn tại để chặn DB role sai |
| Secrets posture | Env schema chặn placeholder secrets ở staging/production |
| Browser auth | Web/admin dùng HttpOnly cookies + CSRF |
| Mobile auth | Secure storage thay vì plain storage |

### 7.2 Rủi ro

| Mức | Rủi ro | Tác động |
|---|---|---|
| Đã xử lý | Root build từng fail vì server/client boundary | Đã pass sau khi tách import client-safe |
| P1 | Application layer import infrastructure nhiều | Clean architecture chưa chặt |
| Đã xử lý | E2E data portability phụ thuộc Node Intl timezone list | Đã chấp nhận alias Việt Nam phổ biến khi canonical timezone được runtime hỗ trợ |
| P1 | Runtime export CSV artifacts tracked | Dễ rò test/data artifacts và làm repo bẩn |
| P2 | Import/export write vào local storage trong repo | Nên dùng temp storage trong test |

---

## 8. Repo hygiene và artifact policy

Repo hiện có **2967 tracked files**. Trong đó có **202 tracked artifact files** thuộc các nhóm:

| Nhóm | Nhận xét |
|---|---|
| `apps/api/storage/exports/audit/*.csv` | 42 CSV export audit đang tracked |
| `packages/extension/artifacts/**` | Nhiều console logs, snapshots, screenshots |
| `packages/extension/*.png`, `*.log` | Screenshots/logs ở root package |

Đây là điểm khách hàng rất dễ đánh giá là template chưa sạch. Dù một số ảnh có thể là bằng chứng UI, chúng nên được chuyển sang `docs/assets/verification/` với tên có chủ đích hoặc bỏ khỏi source.

Khuyến nghị:

| Ưu tiên | Việc cần làm |
|---|---|
| P0/P1 | Xóa runtime CSV export artifacts khỏi Git history hiện tại nếu chưa cần giữ |
| P1 | Add ignore cho `apps/api/storage/exports/**` hoặc route export test vào temp dir |
| P1 | Chuyển extension screenshots/logs sang docs artifacts hoặc ignore |
| P1 | Mở rộng `scripts/check-source-policy.sh` để bắt tracked artifacts này |

---

## 9. P0 đã xử lý trong remediation

Các blocker P0 của vòng audit đầu đã được xử lý trực tiếp trong working tree. Bảng dưới đây ghi rõ vấn đề, thay đổi và bằng chứng verification.

| ID | Vấn đề ban đầu | Thay đổi đã làm | Bằng chứng |
|---|---|---|---|
| P0.1 | `pnpm run lint` fail ở `web-core` và lộ thêm lỗi style sau khi đi tiếp | Đổi `AuthTokenFields` sang interface, ignore `packages/web-core/vitest.config.ts` trong root ESLint, sửa import/type style ở web/admin/api-identity | `pnpm run lint` pass 16/16 package |
| P0.2 | `web` không resolve được `@repo/web-core/auth/sanitize-response` | Thêm subpath export `"./auth/sanitize-response"` vào `packages/web-core/package.json` | `pnpm run typecheck` pass 16/16 package |
| P0.3 | Turbopack kéo `next/headers`/`node:crypto` vào client bundle qua `apps/*/src/lib/http.ts` | Tách `apps/web/src/lib/auth/cookie-names.ts` và `apps/admin/src/lib/auth/cookie-names.ts`; HTTP client chỉ import module client-safe | `pnpm run build` pass 16/16 package |
| P0.4 | `preferences.e2e.spec.ts` fail với timezone `Asia/Ho_Chi_Minh` | Thêm unit test hồi quy và compatibility alias `Asia/Ho_Chi_Minh` -> `Asia/Saigon` khi runtime hỗ trợ canonical timezone | `pnpm --filter api test:e2e` pass 12 files / 52 tests |
| P0.5 | `mobile:format-check` vừa check vừa ghi file | Đổi script sang `dart format --output=none --set-exit-if-changed lib test`; format một lần file Dart chưa đúng | `pnpm run mobile:format-check` pass, 454 files / 0 changed |

Ghi chú kỹ thuật:

| Điểm | Nhận xét |
|---|---|
| `web-core` server/client boundary | Fix hiện tại giải quyết lỗi build bằng module `cookie-names.ts` ở app layer. Dài hạn vẫn nên tách public surface `@repo/web-core/server/*` và `@repo/web-core/client/*`. |
| API e2e | Một lần chạy full e2e từng xuất hiện lỗi flaky `job-observability` 401/409, nhưng test isolate và full e2e chạy lại đều pass. Nên theo dõi thêm trên CI nếu lỗi tái hiện. |
| Test cache | Khi test file mới chưa track, Turbo cache có thể replay log cũ; đã chạy `pnpm exec turbo run test --force` để lấy kết quả tươi. |
| Artifacts | E2E vẫn sinh CSV audit untracked trong workspace; đã dọn sau khi chạy. Vấn đề tracked artifacts cũ vẫn là P1/P2 repo hygiene. |

---

## 10. Các vấn đề P1 cần xử lý sau P0

| ID | Vấn đề | Tác động | Khuyến nghị |
|---|---|---|---|
| P1.1 | Mobile ngoài pnpm/Turbo graph | Root verify không đại diện toàn template | Wrapper package hoặc docs nói rõ mobile optional |
| P1.2 | Application layer import infrastructure repository nhiều | Clean architecture chưa nhất quán | Dùng ports/interfaces hoặc document pragmatic exception |
| P1.3 | Repository ports derive type từ concrete repository | Application phụ thuộc ngược infrastructure type | Khai báo record/value types riêng ở application/domain |
| P1.4 | Import/export generic chưa được chứng minh đủ | Dễ bị xem là project-demo-specific | Thêm adapter thứ hai ngoài `projects`, ví dụ users/import settings |
| P1.5 | Test mobile có mirror logic lệch router thật | False confidence | Test `GoRouter` thực hoặc trích redirect function dùng chung |
| P1.6 | Generated artifacts được track | Template mất sạch sẽ | Clean repo và enforce policy |
| P1.7 | `pnpm verify` phụ thuộc nhiều scripts shell | Windows/CI portability cần kiểm thêm | Node-based preflight chung hoặc PowerShell parity |
| P1.8 | Package exports của feature packages còn rộng | Public surface không rõ | Thu hẹp exports theo module public API |

---

## 11. Roadmap hoàn thiện đề xuất

### Phase 0 - Làm xanh baseline bàn giao

Mục tiêu: khách hàng clone repo và chạy verify không gặp blocker. Trạng thái hiện tại: **đã xử lý trong working tree, cần commit/CI xác nhận lại**.

| Việc | Tiêu chí hoàn tất |
|---|---|
| Đã xử lý: fix `web-core` exports | `pnpm run typecheck` không còn lỗi missing module |
| Đã xử lý: split import client-safe cho cookies | `pnpm run build` pass |
| Đã xử lý: fix lint baseline | `pnpm run lint` pass |
| Đã xử lý: fix mobile format-check | `pnpm run mobile:format-check` pass và không tạo diff |
| Đã xử lý: fix preferences e2e timezone | `pnpm --filter api test:e2e` pass |
| Còn P1/P2: cleanup tracked artifacts | `git status` sạch sau `pnpm verify`, e2e, generate; runtime artifacts không nằm trong Git |

### Phase 1 - Làm rõ core package và public API

Mục tiêu: khách hàng hiểu rõ package nào là core, package nào là capability, package nào là composition.

| Việc | Tiêu chí hoàn tất |
|---|---|
| Viết `docs/package-boundaries.md` | Có bảng layer, allowed deps, public exports |
| Thu hẹp exports | Không còn wildcard exports không cần thiết |
| Tách server/client exports | `web-core` có `server` và `client` surface rõ |
| Add package export tests | Import smoke tests cho các public subpaths |
| Rename/document `api-bootstrap` | Ghi rõ là composition/seed package |

### Phase 2 - Chuẩn hóa app implementation

Mục tiêu: web/admin/mobile có cùng câu chuyện auth/contract/error UX rõ ràng.

| Việc | Tiêu chí hoàn tất |
|---|---|
| Web/admin BFF hardening | Không import server-only helper vào client |
| Admin smoke tests | Login, protected shell, users/roles/projects render |
| Mobile router tests thật | Không mirror logic thủ công |
| Mobile monorepo integration | Root verify báo rõ mobile pass/skip có điều kiện |
| E2E artifact isolation | Tests không ghi runtime output vào repo |

### Phase 3 - Product hóa template

Mục tiêu: template reusable cho nhiều sản phẩm, không bị demo domain chi phối.

| Việc | Tiêu chí hoàn tất |
|---|---|
| Sample domain boundary | `projects` được label là sample module |
| Generic import/export | Có registry docs và ít nhất 2 adapters |
| Onboarding script | Fresh clone bootstrap + verify xanh |
| Golden path docs | README, onboarding, architecture, deployment không mâu thuẫn |
| Release checklist | Có checklist thay secrets, setup SSO/FCM/S3, deploy |

---

## 12. Tiêu chí nghiệm thu đề xuất với khách hàng

Khách hàng nên yêu cầu các điều kiện sau trước khi chấp nhận bàn giao:

| Nhóm | Điều kiện nghiệm thu |
|---|---|
| Code quality | `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run build` pass |
| Contract | `pnpm run generate:check` pass và không tạo diff |
| Backend e2e | `pnpm --filter api test:e2e` pass trên Docker infra local/CI |
| Mobile | `pnpm run mobile:format-check`, `mobile:analyze`, `mobile:test` pass và không tạo diff |
| Repo hygiene | Không track runtime CSV/log/screenshot artifacts trừ assets tài liệu có chủ đích |
| Security | Browser token không nằm trong localStorage/sessionStorage; server/client boundary rõ |
| Docs | Có package boundary docs, app feature matrix, env/deployment guide cập nhật |
| Fresh clone | `make bootstrap` hoặc `pnpm bootstrap` + documented verify path chạy được |
| CI parity | CI chạy cùng nhóm gate chính, không chỉ subset |

---

## 13. Go / No-Go

| Use case | Quyết định |
|---|---|
| Demo nội bộ cho team kỹ thuật | **Go** |
| Bàn giao khách hàng như technical accelerator/source template | **Conditional Go** |
| Bàn giao khách hàng như golden template hoàn thiện | **No-Go cho tới khi xử lý P1/P2 về docs, package boundary, mobile integration và repo hygiene** |
| Golden template dùng lại nhiều dự án | **Conditional Go sau khi P1 chính được xử lý và CI xác nhận full gates** |
| Nền tảng production app | **Conditional Go** nếu thay secrets/env, hoàn thiện deployment, hardening CI và policy artifacts |

Kết luận cuối: source có nền tảng tốt và nhiều phần đã được đầu tư nghiêm túc, đặc biệt backend capability, contract-first và BFF auth. Các blocker P0 từng làm khách hàng chưa hài lòng đã được xử lý và verification hiện xanh. Phần còn lại là hoàn thiện tính sản phẩm của template: làm rõ core/package boundaries, đưa mobile vào câu chuyện monorepo chính thức hoặc document là companion app, dọn tracked runtime artifacts, và bổ sung docs/CI để khách hàng có thể tự xác nhận lại một cách nhất quán.
