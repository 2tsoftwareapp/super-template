# Review nghiêm ngặt core packages — đánh giá & đề xuất tái cấu trúc

Trạng thái: ĐÃ TRIỂN KHAI TOÀN BỘ R1–R6 (2026-07-12, commits bbeceba..ad75892)
Phạm vi: 11 core packages (`api-core`, `api-database`, `api-bootstrap`, `api-contract`, `api-health`, `api-sort`, `env-loader`, `web-core`, `web-test`, `eslint-config`, `tsconfig`) — không gồm 2 bounded-context packages (identity/platform) trừ khi cần đối chứng.
Chuẩn so sánh: template chuyên nghiệp cỡ lớn (Turborepo official examples, NestJS enterprise starters, T3): mỗi package có mục đích rõ + README, API surface chủ đích, server/client tách bạch, test cho code an ninh, versioning/packaging hygiene.

---

## 1. Điểm đã ĐẠT chuẩn chuyên nghiệp (giữ nguyên — đừng "sửa" thứ không hỏng)

| Hạng mục | Bằng chứng |
|---|---|
| TypeScript strictness hàng đầu | `tsconfig/base.json`: `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride` — nghiêm hơn đa số template lớn |
| Layer enforcement bằng máy | `turbo.json` boundaries tags (`layer:core/env/database/contract/...`) + 3 policy scripts + ESLint boundaries FE |
| RLS an toàn từ khởi động | `database-rls.guard.ts` verify role không superuser/bypass RLS ngay `onModuleInit` |
| CSRF double-submit có ký | `web-core/auth/cookies.ts`: HMAC-signed nonce, `timingSafeEqual`, bắt buộc signed ở staging/prod |
| Refresh rotation + reuse detection | `session-token.service.ts` CAS `updateSessionIfMatches`; reuse → revoke session |
| Redact log an toàn | `redact.ts`: đệ quy + WeakSet chống circular |
| Opaque token đúng chuẩn OWASP | `randomBytes(32)` + SHA-256 (token entropy cao — không cần salt) |
| Ports & adapters rõ ràng | 11 port tokens trong `api-core/ports/`, bounded contexts giao tiếp qua port |
| Zero TODO/FIXME/HACK | Toàn bộ core packages sạch |
| Single-flight CSRF bootstrap phía client | `web-core/http.ts` |

**Kết luận tổng quan:** nền tảng ở mức tốt-đến-rất-tốt. Khoảng cách còn lại với "template lớn" nằm ở: 1 bug race có thật, tách server/client entry, nợ test ở code an ninh, và packaging/docs hygiene.

---

## 2. FINDINGS — xếp hạng, có bằng chứng

### 🔴 HIGH

**H1 — Race "thundering herd" khi refresh token: user có thể bị logout oan.**
- BFF `proxyWithRefresh` (`web-core/src/server/backend.ts:281-297`) **không có single-flight**: N request song song cùng nhận 401 → N lần gọi `auth/refresh` với **cùng một** refresh token.
- API rotation là CAS: `updateSessionIfMatches` (`session-token.service.ts:75`) — request thắng sẽ đổi hash; request thua bị coi là **"Refresh token reuse detected" → revoke toàn session** (`session-token.service.ts:92-99`).
- Kịch bản thực tế: admin dashboard bắn 4 query song song (`useDashboardOverviewQueries`) đúng lúc access token hết hạn → 4 refresh đua → 1 thắng, 3 thua → session bị revoke → user văng ra login dù không làm gì sai.
- **Fix đề xuất (cả 2 lớp):** (a) BFF: single-flight theo refresh-token (map promise module-scope, các request 401 cùng đợi 1 refresh); (b) API: grace window ~60s — giữ `previousRefreshTokenHash + rotatedAt`, token cũ trong grace trả về cặp token hiện hành thay vì revoke. Đây là cách các hệ auth lớn (Auth0, Clerk) xử lý.

**H2 — web-core trộn server code vào root barrel, không có `server-only` guard.**
- `web-core/src/index.ts` có `export * from "./server"`; `server/backend.ts` import `next/server`; `auth/cookies.ts` import `next/headers` + `node:crypto`.
- Client components đang import root barrel (`admin-shell.tsx:3 "use client"` → `@repo/web-core`). Hiện chưa vỡ vì bundler tree-shake + cookies không nằm trong barrel, nhưng đây là ranh giới **chỉ đang đúng nhờ may mắn**, không được enforce.
- **Fix:** bỏ `./server` khỏi root barrel; thêm `import "server-only"` vào đầu `server/backend.ts` và `auth/cookies.ts` (chuẩn Next.js chính thống — sai là build fail ngay); root barrel chỉ còn client-safe modules.

**H3 — Code an ninh trung tâm không có test.**
- `api-core`: `AuthorizeGuard` (RBAC của MỌI route — logic SUPER_ADMIN bypass, roles `some` vs permissions `every`) — **0 test**. `app-exception.filter` (contract lỗi toàn API) — 0 test. `response-envelope.interceptor` — 0 test. `RedisThrottlerStorage` (2 path Redis/local) — 0 test.
- `web-core`: `backend.test.ts` chỉ 4 case cho mutation guards; `proxyWithRefresh` (retry-sau-refresh, set/clear cookie, 401 passthrough) và `refreshSession` — **0 test**, trong khi đây là code phức tạp nhất và là nơi có H1.

### 🟡 MEDIUM

**M1 — `api-bootstrap` sai tên, docs mô tả sai.**
Package chỉ chứa seed (`index.ts` export duy nhất `seedDatabase`; toàn bộ src là `seeds/*`). CLAUDE.md mô tả *"app composition / boot"* — không đúng. Boot composition thật nằm ở `apps/api/src/main.ts`. → Đổi tên `@repo/api-seed` (đúng bản chất) hoặc chuyển open-api setup/app-module factory vào cho xứng tên. Khuyến nghị: **đổi tên** (ít rủi ro).

**M2 — Dead branch trong `enforceMutationGuard`** (`backend.ts:246-250`): `if (accessToken || refreshToken) return null; return null;` — đọc cookie chỉ để không dùng. Dấu hiệu logic bị cắt dở; dọn để khỏi gây hiểu lầm "pre-session được xử lý khác".

**M3 — `RedisThrottlerStorage` local fallback rò bộ nhớ chậm:** `localBuckets` Map không bao giờ evict key hết hạn (chỉ ghi đè khi key quay lại). Thiếu Redis + traffic nhiều IP → Map lớn vô hạn. Fix nhỏ: sweep expired mỗi lần increment hoặc theo interval.

**M4 — Packaging hygiene dưới chuẩn template lớn:** 0/15 package có README; không package nào khai `sideEffects: false` (ảnh hưởng tree-shaking web-core trong client bundle). → README ngắn theo khung thống nhất (purpose / exports / usage / conventions) + `sideEffects` cho package FE.

**M5 — Không có coverage gate:** vitest không cấu hình coverage, CI không threshold. Template lớn tối thiểu đo và chặn tụt lùi ở core packages (đề xuất: v8 provider, threshold theo package, bắt đầu 60% cho api-core/web-core rồi nâng).

**M6 — Rác cấu trúc:** `packages/api-workspace/` và `packages/extension/` chỉ còn artifact `.turbo` của package đã xoá (0 file tracked). `pnpm-workspace` glob `packages/*` vẫn quét chúng. → xoá 2 thư mục.

**M7 — API surface không chủ đích:** `web-core/index.ts` `export *` từ 9 module (kể cả toàn bộ `api-types` khổng lồ). Template lớn export **named & chủ đích** để đổi internal không gãy consumer. → chuyển root barrel sang named exports cho nhóm ổn định; consumer chi tiết dùng subpath (đã có sẵn exports map tốt).

**M8 — Test setup trùng lặp:** `@repo/web-test` (matchMedia stub, render helper) tồn tại đúng cho việc share test utils, nhưng `web-core/src/test/setup.ts` tự viết stub riêng (ResizeObserver) và admin/web cũng tự setup. → hợp nhất stubs vào `@repo/web-test/setup`, mọi vitest FE dùng chung.

### 🟢 LOW

- **L1** `multi-sort` re-export 2 đường (`api-core` cho backend, `api-contract` cho frontend) — đúng chiều dependency, nhưng cần 1 câu README ở `api-sort` giải thích, tránh reviewer sau tưởng duplication.
- **L2** `env-loader` 369 LOC ma trận layered env nhưng chỉ 6 test — thiếu case: APP_ENV override thứ tự file, .env.local wins, missing file.
- **L3** `api-health` indicator có test nhưng controller chưa — chấp nhận được (controller mỏng).

---

## 3. Đề xuất tái cấu trúc — thứ tự thực thi

| # | Việc | Giải quyết | Cỡ | Ghi chú |
|---|---|---|---|---|
| R1 | Grace window rotation (API) + single-flight refresh (BFF) + test race 2 chiều | H1 | M | Ưu tiên #1 — bug thật ảnh hưởng UX auth |
| R2 | `server-only` guards + bỏ `./server` khỏi root barrel web-core | H2 | S | Breaking nhẹ: sửa import ở 2 app nếu có |
| R3 | Trả nợ test an ninh: AuthorizeGuard, exception filter, envelope interceptor, throttler (cả 2 path + evict M3), proxyWithRefresh/refreshSession | H3, M3 | M–L | Viết cùng R1 cho phần refresh |
| R4 | Dọn: xoá ghost dirs, dead branch M2, rename `api-bootstrap`→`api-seed` + cập nhật CLAUDE/AGENTS/docs | M1, M2, M6 | S | |
| R5 | Packaging: README 11 packages theo khung chung, `sideEffects`, root barrel named exports | M4, M7 | M | |
| R6 | Coverage gates vitest + CI; hợp nhất test setup vào `@repo/web-test`; bù test env-loader | M5, M8, L2 | M | |

R1–R2 nên đi trước mọi feature mới. R4 làm được ngay trong 1 phiên. R5–R6 có thể song song.

## 4. Kết luận

Core packages **đã vượt mức trung bình** của template mã nguồn mở (strictness, RLS, CSRF, boundaries enforcement thuộc nhóm tốt nhất). Để đạt chuẩn "framework template lớn" cần đóng 3 khoảng cách: (1) sửa race refresh — bug thật duy nhất tìm thấy; (2) kỷ luật ranh giới server/client bằng `server-only` thay vì quy ước ngầm; (3) nợ test đúng chỗ hiểm + hygiene tài liệu/packaging. Không cần đập cấu trúc nào — mọi đề xuất đều là incremental trên nền hiện có.
