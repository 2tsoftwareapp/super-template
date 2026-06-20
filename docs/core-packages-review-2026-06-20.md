# Core Packages Review — 2026-06-20

> Reviewer: Senior Backend (Claude Opus 4.8)
> Scope: các package nền tảng của backend — `api-core`, `api-database`, `api-contract`, `api-bootstrap`, `api-health`.
> Phương pháp: đọc trực tiếp source (cấu trúc thư mục + các file đại diện cho mỗi concern), đối chiếu theo Clean Architecture, Clean Code, tổ chức code/folder, đặt tên, và code quality. Các nhận xét đều kèm tham chiếu `file:line`.

---

## 1. Tổng quan & đánh giá

| Tiêu chí | Điểm | Nhận xét ngắn |
|---|---|---|
| Clean Architecture (hướng phụ thuộc, ports/adapters) | **9/10** | Ports bằng `Symbol`, hexagonal rõ ràng, core không phụ thuộc feature |
| Clean Code (hàm nhỏ, ý đồ rõ, comment "tại sao") | **8.5/10** | Phần lớn xuất sắc; một điểm nóng `database.provider.ts` |
| Tổ chức code & folder | **8/10** | `api-core` rất tốt; ranh giới public của `api-database` bị nới lỏng |
| Đặt tên (naming) | **9.5/10** | Quy ước suffix nhất quán, mô tả tốt |
| Code quality (an toàn type, lỗi, test) | **6.5/10** | Logic an toàn nhưng **thiếu test nghiêm trọng** ở tầng hạ tầng |

**Kết luận:** Đây là một codebase nền tảng **chất lượng cao, trưởng thành**. Kiến trúc và quy ước đặt tên ở mức tham chiếu (reference-grade). Hai nhóm vấn đề đáng đầu tư: (1) **độ phủ test của tầng core gần như bằng 0** trên những thành phần rủi ro cao, và (2) một vài **rò rỉ ranh giới đóng gói** + **1 đoạn code phức tạp/khó bảo trì** cần được cô lập.

---

## 2. Điểm mạnh nổi bật

1. **Ports & Adapters đúng bài.** Mọi cổng phụ thuộc ngược đều khai báo bằng `Symbol` token + interface thuần (`ports/*.port.ts`), ví dụ `AUDIT_WRITER` (`api-core/src/ports/audit-writer.port.ts:18`), `ImportExportAdapterRegistry` (`import-export-adapter.port.ts:35`). Điều này cho phép `api-core` định nghĩa hợp đồng mà **không phụ thuộc** vào `api-identity/platform/workspace` — hướng phụ thuộc luôn trỏ vào trong.
2. **Error model thống nhất.** `AppError` (`common/errors/app-error.ts`) + `AppExceptionFilter` (`common/filters/app-exception.filter.ts`) + `ERROR_CODES` (`common/constants/error-codes.ts`) tạo thành một hợp đồng lỗi ổn định cho client, có phân tách rõ 4xx (warn) vs 5xx (error + report).
3. **Bảo mật & quan sát (observability) là công dân hạng nhất.** Redact secrets (`utils/redact.ts`), RLS guard chặn boot nếu DB role bypass RLS (`database-rls.guard.ts:53`), transport log/alert đều có timeout + nuốt lỗi để không bao giờ làm hỏng request path (`http-log-transport.service.ts:46`, `telegram-transport.service.ts:45`).
4. **Comment giải thích "tại sao", không phải "cái gì".** Ví dụ rất tốt: `database.provider.ts:14-18` giải thích lý do mọi checkout phải re-apply tenant GUCs; `seed-data.ts:36` giải thích thứ tự seed; `health.indicators.ts:28` giải thích vì sao readiness cần round-trip DB.
5. **Đặt tên mẫu mực.** Suffix nhất quán theo vai trò: `.port.ts`, `.adapter.ts`, `.guard.ts`, `.cache.ts`, `.constants.ts`, `.matrix.ts`, `.service.ts`. Đọc tên file là biết trách nhiệm.
6. **Type-safety chặt.** Zod validate env một lần lúc khởi động (`env.schema.ts:105`), `JsonValue` cho dữ liệu log, generic `SortCriterion<TField>` ràng buộc field hợp lệ ở mức type.

---

## 3. Phát hiện theo mức ưu tiên

### P1 — Nên xử lý sớm

**P1.1 — Thiếu test ở tầng hạ tầng rủi ro cao.**
Toàn bộ core chỉ có **2 file test**: `authorize.guard.spec.ts` và `multi-sort.spec.ts` (api-contract). Cụ thể:

| Package | Số file test | Thành phần rủi ro cao **chưa** có test |
|---|---|---|
| api-core | 1 | `AccessProfileCache` (Redis/fallback + TTL), `redactSensitive`, `AppExceptionFilter`, `parseSortParam` (bản core), `RedisThrottlerStorage` |
| api-database | **0** | `runIdempotentInsert`, tenant-aware `Pool` patching, `DatabaseRlsGuard`, `runInTransaction` |
| api-bootstrap | 0 | thứ tự seed atomic |
| api-health | 0 | readiness/ liveness |

Đây là những đoạn logic mà bug sẽ gây hậu quả lan rộng (cache stale → sai phân quyền; idempotent insert sai → trùng/lỗi dữ liệu; redact sai → rò rỉ secret ra log). Khuyến nghị viết unit test thuần (kiểu `new X(mockDeps)` như `login.use-case.spec.ts`) ưu tiên theo đúng thứ tự bảng trên.

**P1.2 — `multi-sort` bị trùng lặp giữa 2 package và đã DRIFT.**
`api-core/src/common/sort/multi-sort.ts` và `api-contract/src/sort/multi-sort.ts` là hai bản cài đặt khác nhau của cùng một thuật toán:
- Bản `api-core`: null-safe, tách helper `parseSortOrder` / `resolveAllowedField`, không dùng cast.
- Bản `api-contract`: dùng `as TField` và `as SortOrder` **ép kiểu không an toàn** (`api-contract/src/sort/multi-sort.ts:55-56`), bỏ qua nhánh kiểm tra mà bản core có.

Hai bản đã lệch hành vi (đây là rủi ro kinh điển của copy-paste: client và server parse sort khác nhau → bug khó lần). Cần xác định **chủ sở hữu duy nhất**: tách thuật toán sort thuần (không phụ thuộc Nest/Express) vào một nơi mà cả FE-contract lẫn BE-core đều dùng được, rồi xóa bản còn lại.

### P2 — Nên cải thiện

**P2.1 — `database.provider.ts`: điểm nóng độ phức tạp.**
`createTenantAwarePool` (`api-database/src/database.provider.ts:13-109`) monkey-patch `pool.connect` và `pool.query` để chèn tenant context. Vấn đề:
- Cùng một khối cast callback `(callback as (err, client, release) => void)(...)` bị lặp **3 lần** (`:41`, `:53`, `:64`) → khó đọc, dễ sai khi sửa.
- Dùng `client!` (non-null assertion) và nhiều `as ... => Promise<unknown>` làm mất an toàn type tại đúng chỗ rủi ro nhất.
- Patch cả hai biến thể callback-style lẫn promise-style của API `pg` → bề mặt lỗi rộng, lại **chưa có test**.

Khuyến nghị: trích một helper có type rõ cho phần "bọc callback", hoặc cân nhắc chuyển sang dùng `pool.on('connect', ...)` của `pg` (đặt tenant GUC trong event handler) để loại bỏ phần patch `query`/`connect` thủ công. Nếu vẫn giữ cách hiện tại, **bắt buộc** có test cho cả 2 đường (callback & promise).

**P2.2 — Ranh giới public của `api-database` quá rộng.**
`api-database/package.json` export `"./*": "./src/*"` — phơi bày **toàn bộ** cây file nội bộ ra ngoài như public API. Tuy thực tế hiện chưa ai deep-import (đã grep: không có call site nào bypass barrel), nhưng đây là rủi ro tiềm ẩn: bất kỳ ai cũng có thể `import '@repo/api-database/database.provider'` và khóa cứng vào chi tiết nội bộ. So sánh: `api-core` dùng barrel `index.ts` được tuyển chọn kỹ + vài subpath cụ thể. Khuyến nghị thu hẹp export của `api-database` về `"."` (barrel) và `"./schema"`, bỏ wildcard.

**P2.3 — `api-core` cũng nới ranh giới qua wildcard.**
`api-core/package.json` export `"./common/*"` và `"./config/*"`. Barrel `index.ts` đã rất đầy đủ và được tuyển chọn; hai wildcard này cho phép deep-import vòng qua barrel (ví dụ test e2e import thẳng `@repo/api-core/common/...`). Không nghiêm trọng nhưng làm "public surface" mơ hồ. Cân nhắc chỉ giữ subpath thật sự cần (`./config/environment.service`, `./config/app-config.module`) và bỏ `./common/*`.

### P3 — Nhỏ / tinh chỉnh

**P3.1 — `redactSensitive` phân biệt hoa-thường.**
`utils/redact.ts:25` so khớp key theo đúng chữ thường trong `REDACT_KEYS`. Nếu object log chứa header dạng `Authorization` (viết hoa) thì **không bị redact** → rủi ro rò rỉ. Nên `key.toLowerCase()` khi so khớp. Ngoài ra hàm đệ quy không chống vòng tham chiếu (circular) — chấp nhận được với log object phẳng nhưng nên ghi chú.

**P3.2 — Lặp nhẹ trong `AppExceptionFilter`.**
`reportContext` và `logContext` (`app-exception.filter.ts:95-123`) gần như giống hệt, chỉ khác `details` (raw vs `toLogDetails`). Có thể trích một `baseContext` chung để giảm lặp và tránh lệch khi sửa.

**P3.3 — `api-bootstrap` không thực sự là "core".**
`seed-data.ts:5-11` cho thấy `api-bootstrap` phụ thuộc **lên** `api-identity/platform/workspace`. Đây là package **composition-root / seeding**, nằm ở *đỉnh* đồ thị phụ thuộc, không phải *đáy* như các core khác. Hướng phụ thuộc của nó là đúng (seeding cần biết feature services), nhưng nên phân loại lại về mặt khái niệm để không gây hiểu nhầm "core = nền tảng dùng chung".

**P3.4 — `EnvironmentService.values` expose nguyên khối env.**
`environment.service.ts:11` trả về toàn bộ `AppEnvironment`. Tiện nhưng làm mọi consumer thấy được mọi biến (hơi ngược ISP). Các getter có ngữ nghĩa (`isProduction`, `corsOrigins`) là hướng đúng — có thể mở rộng dần thay vì đọc thẳng `.values.X` ở call site.

---

## 4. Nhận xét theo từng package

### api-core (57 files) — ⭐ chuẩn mực
Tổ chức theo concern rất rõ: `common/{cache,decorators,errors,filters,guards,interceptors,logging,middleware,observability,rbac,...}`, `config/`, `ports/`. Barrel `index.ts` tuyển chọn kỹ. RBAC tách `constants` / `matrix` / `helpers` gọn gàng (`perm()`, `hasPermission()` thuần, dễ test — `rbac/permission.helpers.ts`). Đây là khuôn mẫu nên giữ cho toàn repo.

### api-database (33 files) — vững, trừ provider & export
Schema chia theo bounded context (`schema/{identity,platform,workspace,shared}`) + barrel `schema/index.ts` có comment nhóm — rất tốt cho một schema lớn. `runIdempotentInsert` (`idempotent-insert.ts`) và `TenantContextService` dựa trên `AsyncLocalStorage` (`tenant-context.service.ts`) là thiết kế sạch. Trừ điểm ở `database.provider.ts` (P2.1) và wildcard export (P2.2). `DatabaseModule` quản lý lifecycle pool đúng (`onApplicationShutdown` → `pool.end()`).

### api-contract (4 files) — mỏng, đúng vai trò, trừ 1 file lạc
Chủ yếu re-export code generated (`index.ts` → `./generated`). Tuy nhiên `sort/multi-sort.ts` là code viết tay nằm lẫn trong package "contract" và là bản trùng lặp đã drift (P1.2). Nên làm rõ: api-contract chỉ chứa hợp đồng FE/BE; logic sort dùng chung nên về một nguồn.

### api-bootstrap (8 files) — đúng chức năng, sai phân loại
Seeding atomic trong một transaction + tenant context (`seed-data.ts:33-62`), thứ tự seed được giải thích rõ. Vấn đề duy nhất là nó không phải "nền tảng" (P3.3).

### api-health (4 files) — nhỏ gọn, sạch
Tách `application/health.indicators.ts` (liveness vs readiness) và `presentation/health.controller.ts` đúng kiểu Clean Architecture thu nhỏ. Không có vấn đề về code; chỉ thiếu test (P1.1).

---

## 5. Khuyến nghị hành động (ưu tiên giảm dần)

1. **[P1.2] Khử trùng lặp `multi-sort`** — chọn 1 nguồn, xóa bản còn lại, thay bản ép-kiểu-không-an-toàn của api-contract bằng bản null-safe. *(nhanh, chặn bug FE/BE lệch nhau)*
2. **[P1.1] Thêm unit test tầng core** theo thứ tự rủi ro: `runIdempotentInsert` → `AccessProfileCache` → `redactSensitive` → `AppExceptionFilter` → tenant-aware pool.
3. **[P2.1] Cô lập & test `database.provider.ts`** — trích helper có type cho phần callback (hoặc chuyển sang `pool.on('connect')`), bỏ `client!`/cast nếu được.
4. **[P2.2 / P2.3] Thu hẹp `exports`** của `api-database` (bỏ `"./*"`) và `api-core` (bỏ `"./common/*"`) về public surface tối thiểu.
5. **[P3.1] Sửa `redactSensitive`** so khớp key không phân biệt hoa-thường.
6. **[P3.2 / P3.3 / P3.4]** Gom `baseContext` trong exception filter; phân loại lại `api-bootstrap`; thu hẹp dần việc đọc `.values` trực tiếp.

---

## 6. Phụ lục — phương pháp & phạm vi

- **Đã đọc trực tiếp:** index/barrel của cả 5 package; toàn bộ `ports/*` (đại diện); error/filter/guard/interceptor; config + env schema; cache; observability transports; logging transport; middleware; rbac; sort; redact; require-organization của api-core. Provider/idempotent-insert/tenant-context/RLS guard/transaction/module/schema của api-database. seed-data của api-bootstrap. index/sort của api-contract. indicators của api-health. `package.json` của api-core & api-database.
- **Đã kiểm chứng bằng grep:** trùng lặp `multi-sort` (diff cho thấy đã drift); không có call site nào deep-import `@repo/api-database/*` vòng qua barrel ở thời điểm review.
- **Ngoài phạm vi:** các package feature (`api-identity`, `api-platform`, `api-workspace`) vừa refactor ở phiên trước; `web-core`, `web-test`, `extension`, `eslint-config`, `tsconfig`.
