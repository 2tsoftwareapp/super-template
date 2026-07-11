# Roadmap tái kiến trúc toàn dự án — Clean Architecture, incremental trên main

Trạng thái: HOÀN THÀNH 2026-07-12 — cả 9 phases (P0–P8) đã triển khai và verify
Phạm vi: toàn bộ monorepo (web, admin, web-core, API packages, apps/api, mobile, tooling)
Chiến lược: **incremental trên main** — mỗi phase là một chu trình spec → plan → implement → verify độc lập, app luôn chạy được sau mỗi phase. Không rewrite, không branch dài hạn.

---

## 1. Đánh giá hiện trạng (đo thực tế 2026-07-11)

### Điểm mạnh — giữ nguyên, không đụng

| Hạng mục | Bằng chứng |
|---|---|
| Bounded contexts backend | `api-identity` (7 modules), `api-platform` (12 modules), layering `presentation → application → infrastructure` |
| Contract-driven | OpenAPI là nguồn chân lý, sinh client TS + Dart qua `pnpm generate` |
| Multi-tenant tại DB | RLS + `tenant-context.ts` (GUC `app.tenant_id`), worker dispatch context riêng |
| Policy enforcement | `check-source-policy.sh`, `check-package-cycles.sh`, `turbo boundaries` |
| Admin features/ split | Hoàn tất (spec 2026-07-10), 50 tests xanh |
| Auth gate hợp nhất | Hoàn tất (spec 2026-07-11): proxy (Next 16) + `useAdminGuard` + `AdminShell` thuần trình bày |
| Mobile đã feature-first | `lib/core/` (9 nhóm) + `lib/features/` (13 features) + `lib/generated/` tách bạch |

### Lỗ hổng — đối tượng của roadmap này

| # | Vấn đề | Bằng chứng đo được | Phase xử lý |
|---|---|---|---|
| G1 | Việc dở chưa commit, lint fail | Auth-gate consolidation nằm ở working tree; `resendVerification` unused làm `pnpm --filter admin lint` fail | P0 |
| G2 | Design system 2 nguồn chân lý | 17 component trùng tên ở cả `apps/admin/src/components/ui/` và `packages/web-core/src/components/` (button, card, table, dropdown, input, alert, avatar, badge, checkbox, empty, label, password-input, separator, skeleton, spinner, tooltip, button-variants) | P1 |
| G3 | Convention admin chưa đồng nhất | 2 kiểu truyền id vào mutation hook (hook-arg vs `.mutate()`); rule "no react-query trong app/" chỉ nằm trong spec, chưa enforce bằng máy | P2 |
| G4 | apps/web không có kiến trúc | 87 source files, không `features/`, 4 test files; không theo pattern admin | P3 |
| G5 | i18n ad-hoc x2, không router-based | `apps/web/src/lib/i18n/` và `apps/admin/src/lib/i18n.tsx` là 2 bản cài tay khác nhau; không có `[locale]` URL segment | P4 |
| G6 | Tenant có ở backend, vô hình ở frontend | `AuthenticatedRequestUser.organizationId` + `POST /auth/switch-organization` đã tồn tại; `SessionResponse` (web-core) không khai báo `organizationId`, UI không hiển thị | P5 |
| G7 | `api-platform` thiếu domain layer | 0/12 modules có `domain/` (identity: 5/7 có); application gọi thẳng infrastructure | P6 |
| G8 | Test lệch nghiêm trọng | `apps/api`: 0 test; `web-core`: 1/46; web: 4/87; mobile: 8 test/80 file tay | P0, P1, P3, P6, P7 |
| G9 | Thiếu e2e smoke + contract check trong CI | `pnpm verify` tồn tại nhưng không có pipeline bắt buộc trước merge | P8 |

---

## 2. Nguyên tắc chỉ đạo (áp dụng mọi phase)

1. **Không rewrite** — hội tụ về pattern tốt đã có trong repo, không phát minh cấu trúc mới.
2. **Mỗi phase độc lập ship được** — kết thúc phase: typecheck + test + lint xanh, app chạy, commit sạch.
3. **Pattern chuẩn là thứ đã thắng**: bounded context (backend), `features/<resource>/` + view thuần trình bày (frontend), pure decision function + hook mỏng (đã dùng ở `admin-guard-state.ts`).
4. **Quy tắc kiến trúc phải enforce bằng máy** (ESLint rule, policy script, CI) — không dựa vào trí nhớ reviewer.
5. **Mỗi lần di chuyển code là cơ hội trả nợ test** — module nào được refactor phải ra khỏi phase với test tốt hơn lúc vào.
6. **Contract là nguồn chân lý** — mọi thay đổi controller/DTO đi kèm `pnpm generate` + commit client sinh ra.
7. **Frontend trước, backend sau** trong thứ tự phase — backend đang chạy ổn, frontend đang là nơi lộn xộn nhất.

---

## 3. Kiến trúc đích

### 3.1 Frontend (web + admin)

```
packages/web-core/            ← design system + hạ tầng web DUY NHẤT
  components/                 ← toàn bộ UI primitives (nguồn chân lý duy nhất)
  auth/  server/  http/  session/  search-params/  i18n/ (P4)

apps/{web,admin}/src/
  app/[locale]/(group)/       ← CHỈ route entry (page/layout/metadata) — sau P4
  app/api/                    ← BFF routes (proxy, cookie, CSRF)
  features/<resource>/
    <resource>-service.ts     ← network layer (webFetch + buildPath)
    use-<resource>-queries.ts ← react-query reads (+ QUERY_KEY constants)
    use-<resource>-mutations.ts ← react-query writes (invalidation, toast)
    <resource>-schemas.ts     ← zod + types
    components/               ← view + atoms của feature
  components/                 ← shell/layout dùng chung trong app (không phải UI primitives)
  lib/                        ← helpers thuần app-specific
  proxy.ts                    ← server pre-filter (Next 16)
```

Ranh giới enforce bằng máy:
- `app/**` không import `@tanstack/react-query`, `@/lib/http` (ESLint `no-restricted-imports` theo path).
- `features/**` không import từ `app/**`.
- UI primitives chỉ import từ `@repo/web-core/components` — cấm tạo bản sao trong app.

### 3.2 Backend (API packages)

```
packages/api-<context>/src/modules/<module>/
  presentation/   ← controllers, DTOs (nguồn OpenAPI)
  application/    ← use-cases (mỗi use-case 1 file), services điều phối
  domain/         ← entities, value objects, domain rules THUẦN (không NestJS, không Drizzle)
  infrastructure/ ← repositories (Drizzle), adapters, ports implementation
```

- `domain/` không import framework. `application/` phụ thuộc `domain/` + ports; `infrastructure/` implement ports.
- Use-case pattern thống nhất: `execute(input, context)` — như identity đang làm.

### 3.3 Mobile

Giữ nguyên cấu trúc `core/ + features/ + generated/` — chỉ nâng test và đồng bộ convention đặt tên.

---

## 4. Roadmap chi tiết

> Ước lượng theo đơn vị "phiên làm việc" (S = 1 phiên, M = 2–3, L = 4+). Mỗi phase bắt đầu bằng spec riêng nếu có quyết định thiết kế, hoặc đi thẳng plan nếu thuần cơ học.

### P0 — Ổn định nền móng `S` (làm ngay, không cần spec)

**Mục tiêu:** main sạch, mọi gate xanh, việc dở được chốt.

1. Commit auth-gate consolidation (đang ở working tree) — 1 commit riêng.
2. Fix lint fail: xử lý `resendVerification` unused trong `users-view.tsx` (wire vào UI nếu là feature dở, xoá nếu thừa — đã có background task).
3. Cập nhật spec auth-gate: `middleware.ts` → `proxy.ts` (thực tế Next 16).
4. Rà `git status` toàn repo: các file dở ngoài phạm vi (env-loader, scripts, web backend.ts...) — commit theo nhóm logic hoặc stash có chủ đích.
5. Thêm root script `pnpm check` = typecheck + lint + test toàn workspace.

**DoD:** `git status` sạch; `pnpm check` xanh toàn repo.

### P1 — Hợp nhất Design System vào web-core `M`

**Mục tiêu:** xoá G2 — một nguồn chân lý UI duy nhất.

1. Kiểm kê 17 cặp component trùng: diff từng cặp admin vs web-core, chọn bản tốt hơn (thường là bản admin — mới sửa gần đây), hợp nhất API differences.
2. Di chuyển các component chỉ admin có (calendar, confirm-dialog, date-picker, input-otp, loading, pagination, permission-multi-select*, popover, textarea) vào web-core — trừ `permission-multi-select` (domain-specific, giữ lại admin).
3. Xoá `apps/admin/src/components/ui/`, đổi toàn bộ import sang `@repo/web-core/components/*` (codemod bằng sed/grep có kiểm soát).
4. apps/web dùng chung bộ này (web đang có `components/ui` riêng — hợp nhất luôn).
5. Kiểm tra Tailwind `@source` cho web-core trong cả 2 app (hazard đã ghi trong CLAUDE.md).
6. Trả nợ test web-core: tối thiểu smoke test render cho mỗi component export (hiện 1/46).

**DoD:** không còn file trùng tên giữa app `components/ui` và web-core; cả 3 app build + style đúng (kiểm tra bằng browser); web-core có test cho mọi component.
**Rủi ro:** CSS class biến mất do thiếu `@source` — kiểm tra visual từng app sau merge.

### P2 — Khoá convention admin bằng máy `S`

**Mục tiêu:** xoá G3 — những gì spec 2026-07-10 nói phải được enforce.

1. Thống nhất id-passing: mọi mutation hook nhận id qua `.mutate(payload)`, options qua tham số hook (chuẩn theo `use-files-mutations.ts` đã sửa). Sửa `useSaveRoleMutation`, `useUpdateProfileMutation`, `useUpdateStatusMutation`, `useReplaceRolesMutation`.
2. Mọi query key là constant export (`XXX_QUERY_KEY`) — quét nốt chuỗi trần còn sót.
3. ESLint boundary rules (`no-restricted-imports` per-directory hoặc `eslint-plugin-boundaries`): 3 quy tắc ở mục 3.1.
4. Ghi convention vào `apps/admin/AGENTS.md` (network/data/state/mapping/atom layers — đồng bộ với CLAUDE.md hiện có).

**DoD:** ESLint fail nếu vi phạm ranh giới; 4 hook đã thống nhất chữ ký; grep chuỗi query-key trần = 0.

### P3 — Tái cấu trúc apps/web theo pattern admin `L`

**Mục tiêu:** xoá G4 — web có cùng kiến trúc với admin.

1. Kiểm kê 87 files: phân loại route entry / view / business logic / lib.
2. Tạo `features/` cho từng nhóm (auth, settings, profile, sessions, preferences, verify-email, landing...) — service + queries/mutations + schemas như admin.
3. View components về `features/<x>/components/`, `app/**` chỉ còn route entries.
4. Áp dụng cùng ESLint boundary rules của P2.
5. Nâng test: mỗi feature có test cho service/schemas (mục tiêu tối thiểu: pure logic được cover — search-params, schemas, error mapping).
6. Cân nhắc trích `AuthGate`-tương-đương của web (nếu có gating trùng lặp như admin từng có) về cùng pattern `use-guard` + pure decision.

**DoD:** `app/**` của web không còn business logic (grep react-query/http = 0); cấu trúc `features/` đối xứng với admin; test web tăng từ 4 lên ≥ 1 test/feature.
**Rủi ro:** web có SSR/landing khác admin (console thuần client) — không ép mọi thứ thành client component; route công khai (landing, verify-email) giữ server-first.

### P4 — i18n router-based hợp nhất (next-intl) `L`

**Mục tiêu:** xoá G5 — một hệ i18n duy nhất, locale nằm trong URL, đúng lựa chọn ban đầu của user.

1. Package hoá: `@repo/web-core/i18n` (hoặc package `@repo/i18n` riêng) chứa messages en/vi, typing, helpers — gộp nội dung từ 2 bản ad-hoc rồi xoá chúng.
2. next-intl cho cả web + admin: `app/[locale]/` segment, `proxy.ts` mở rộng làm locale negotiation + redirect (admin đã có proxy — thêm nhánh logic, giữ pure function `resolveAdminProxy` mở rộng testable).
3. Admin: di chuyển `(app)` + `(public)` vào `[locale]/`; mọi `router.replace("/login")` → helper `localePath()`; `LanguageSwitcher` chuyển từ set-cookie sang đổi URL segment.
4. Web: tương tự.
5. Chuyển UI strings hardcode sang messages **dần dần**: phase này chỉ bắt buộc translate shell (nav, auth, toasts chung); từng feature translate ở phase riêng sau (tránh phình phạm vi).
6. Test: locale negotiation trong proxy (pure function), `localePath` helpers.

**DoD:** `/en/users`, `/vi/users` hoạt động ở admin; `/en`, `/vi` ở web; switcher đổi URL; deep-link có locale giữ nguyên qua login redirect; SSO callback không vỡ.
**Rủi ro:** đụng mọi route + mọi redirect string — cần checklist redirect toàn app (login flow, guard, SSO, logout); làm SAU P3 để chỉ di chuyển route entries mỏng, không di chuyển business logic.

### P5 — Tenant surfacing `S`

**Mục tiêu:** xoá G6.

1. `SessionResponse` (web-core `api-types.ts`): thêm `organizationId: string | null` (backend `getMe` đã trả sẵn — chỉ thiếu type + hiển thị).
2. `useAdminSession()` (đã có từ auth-gate phase) expose thêm organization.
3. UI: badge tổ chức trong `TopHeader`/sidebar; nếu user thuộc nhiều org → dropdown switch gọi `POST /auth/switch-organization` (endpoint có sẵn) + invalidate session.
4. Web: tương tự ở account menu nếu áp dụng.

**DoD:** admin hiển thị org hiện tại; switch-org hoạt động (hoặc ẩn khi chỉ 1 org); test cho mapping session.

### P6 — Backend: domain layer cho api-platform + test apps/api `L`

**Mục tiêu:** xoá G7, G8-backend.

1. **Không làm ồ ạt 12 modules** — chọn 2 module điển hình làm mẫu trước: `jobs` (phức tạp nhất: state machine PENDING/RUNNING/..., dependencies, attempts) và `files` (versioning rules). Trích domain rules từ application/infrastructure vào `domain/` thuần (không NestJS/Drizzle import).
2. Đánh giá sau 2 module: module nào của platform thực sự có domain logic thì tiếp tục (audit, imports, notifications, mail); module CRUD mỏng (settings, activities, storage...) **không ép** thêm domain layer rỗng — ghi rõ tiêu chí trong ADR.
3. Policy script mới: cấm `domain/` import từ framework (grep-based như source-policy hiện có).
4. `apps/api`: test cho shell (`auth.guard`, `tenant-context.interceptor` — 0 test hiện tại, đây là code an ninh quan trọng nhất app).
5. Mỗi use-case được đụng tới trong quá trình trích domain phải có unit test đi kèm.

**DoD:** jobs + files có `domain/` với test thuần; policy script chặn import bẩn; `apps/api` shell có test; ADR ghi tiêu chí khi nào module cần domain layer.
**Rủi ro:** hazard circular DI api-platform đã ghi trong CLAUDE.md — chạy e2e sau mỗi module; đổi hành vi = bug, mọi trích xuất là move thuần.

### P7 — Mobile alignment `S`

**Mục tiêu:** G8-mobile. Cấu trúc đã tốt — chỉ trả nợ chất lượng.

1. Nâng test: 8 → tối thiểu mỗi feature có test cho logic thuần (parsers, state notifiers); không ép widget test toàn bộ.
2. Rà convention: đặt tên file/thư mục đồng nhất giữa 13 features; xoá `generated/.api-tmp` khỏi tree nếu là rác build (thêm vào .gitignore).
3. Xác nhận `flutter analyze` + `mobile:test` vào `pnpm check` (P0) nếu chưa.

**DoD:** `pnpm mobile:test` + `mobile:analyze` xanh trong pipeline chung; mỗi feature có ≥1 test logic.

### P8 — Hạ tầng chất lượng & tài liệu `M`

**Mục tiêu:** xoá G9, khoá thành quả.

1. CI pipeline (GitHub Actions): `pnpm check` + `pnpm verify` + `generate:check` (contract drift) bắt buộc trước merge.
2. E2E smoke (Playwright — repo đã có `@playwright/test` trong lockfile): 5 luồng vàng — login admin, CRUD user, login web, verify-email, switch locale.
3. Cập nhật docs: `docs/architecture.md` phản ánh kiến trúc đích mục 3; ADR ngắn cho các quyết định lớn (proxy Next 16, tiêu chí domain layer, i18n package).
4. Dọn spec cũ trong `docs/superpowers/specs/` — đánh dấu done/superseded.

**DoD:** PR không merge được khi gate đỏ; e2e smoke chạy < 5 phút; docs khớp thực tế.

---

## 5. Thứ tự & phụ thuộc

```
P0 ──► P1 ──► P2 ──► P3 ──► P4 ──► P5
                │                    
                └──► P6 (song song từ sau P2 — backend độc lập frontend)
P7 độc lập (sau P0, bất kỳ lúc nào)
P8 cuối cùng (khoá mọi thứ)
```

- **P1 trước P3**: web tái cấu trúc phải import UI từ web-core ngay từ đầu, tránh move 2 lần.
- **P3 trước P4**: i18n di chuyển route entries — làm khi entries đã mỏng.
- **P4 trước P5 (nhẹ)**: badge tenant nằm trong shell đã i18n-hoá; nhưng có thể đảo nếu cần tenant gấp.
- **P6 song song** được với P3–P5 vì không đụng frontend.

## 6. Quality gates xuyên suốt

Sau MỖI phase, không có ngoại lệ:

```bash
pnpm check          # typecheck + lint + test toàn workspace (tạo ở P0)
pnpm verify         # db + contract
pnpm generate:check # không drift contract (khi đụng backend)
```

+ verify thủ công trên browser cho phase có UI (đã chứng minh cần thiết — lỗi RSC function-child chỉ lộ khi chạy thật).

## 7. Ngoài phạm vi (ghi rõ để không trôi)

- Viết feature mới, đổi UX/visual design.
- Đổi công nghệ nền (NestJS, Next, Drizzle, Turborepo giữ nguyên).
- Micro-services hoá / tách deploy — monorepo modular monolith là đích đúng cho template này.
- Translate 100% chuỗi UI (chỉ shell ở P4, phần còn lại là backlog sau roadmap).
