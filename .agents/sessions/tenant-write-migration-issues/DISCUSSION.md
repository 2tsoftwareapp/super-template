# Discussion

> Seeded by brainstorming step-01. Fill via steps 02–04. Do **not** invent PLAN/TASKS/design detail here.
> Separate **facts** vs **assumptions** vs **unknowns**. End with one clear **recommendation** + **handoff**.

## Step ledger (mandatory — update every step)

| Step | Name | Status | Evidence |
|---|---|---|---|
| 01 | Init template | `done` | `.agents/sessions/tenant-write-migration-issues/DISCUSSION.md` |
| 02 | Frame + Spec quality | `done` | Đã nhận đủ thông tin từ PR review feedback |
| 03 | Scope + options | `done` | Đã điền Scope in/out + options matrix |
| 04 | Recommend + handoff | `done` | Chọn giải pháp và next skill |
| 05 | Self-check | `done` | Đã rà soát theo contract |

## Executive summary (80/20)

- **Hướng xử lý**: Sửa toàn bộ các call site của Audit để tuân thủ kiến trúc nhiều tenant, chặn lọt dữ liệu qua generic Files, và sửa lock lifecycle bị lỗi.
- **Điểm mấu chốt**: RLS hiện tại từ chối các audit row có `organizationId` = NULL (do optional field), gây ra các hiệu ứng phụ (side-effect) như xóa nhầm object storage.
- **Khuyến nghị**: Áp dụng Discriminated union cho `AuditLogInput`, thêm Security Classification để chặn `filesRepository` chung, và dùng Dedicated Connection thay vì transaction lock.
- **Rủi ro hàng đầu**: Sửa discriminated union ở cấp core interface sẽ ảnh hưởng đến mọi file đang gọi Audit service, dẫn tới khối lượng refactor lớn (files, attachments, imports, exports, v.v.).
- **Hành động tiếp theo**: Chuyển giao sang bước `planning` (Kỹ năng planning) để phân tích chi tiết công việc refactor.

## Developer overview

| Field | Value |
|---|---|
| Status | `recommended` |
| Open Critical/blocking | `0` |
| Visual decisions pending | `0` |
| Next action | Lập file PLAN.md và TASKS.md |

## Charts (when useful)

N/A - Không cần biểu đồ vì các quyết định xoay quanh refactoring code API và Schema, thay vì thiết kế kiến trúc hệ thống mới.

## Context (5W1H, when useful)

N/A - Thông tin ngữ cảnh đã quá rõ ràng từ mã nguồn và bản PR review (Feature 05 — Audit Logs).

## Goal

Đề xuất các giải pháp kỹ thuật cụ thể để khắc phục 3 lỗi nghiêm trọng: Audit contract type (ISS-001), Export ACL bị bypass (ISS-002), Advisory lock leak (ISS-003) và bổ sung E2E/UI.

## Desired outcome

PR Feature 05 pass toàn bộ requirement an toàn: RLS chạy đúng, không lọt Export file, Lock giải phóng sạch sẽ và có E2E/UI tests hoàn chỉnh để sẵn sàng merge.

## Confirmed facts

- Quá trình chuyển đổi (migration) Audit Log bị lỗi do field `organizationId` là optional, nhiều tính năng khi gọi API truyền thiếu dẫn đến `organization_id = NULL`.
- RLS `WITH CHECK` từ chối các hàng có NULL (trừ SUPER_ADMIN), làm hỏng luồng write và trigger lỗi side-effects ở File Upload.
- Export Audit lưu qua `filesRepository.create()`, cho phép admin tenant gọi API Files đọc file mặc dù không có quyền `audit.read`.
- Global export lưu vào active tenant thay vì platform context.
- Lock `pg_try_advisory_lock` được acquire bằng default connection pool executor mà không có block `unlock`, gây rò rỉ khóa vĩnh viễn trên session đó.
- Cờ `truncated` được backend trả về nhưng frontend UI bỏ qua.
- CI verification báo UNAVAILABLE.

## Constraints

| Constraint | Source |
|------------|--------|
| Không được sửa (bỏ qua) Tenant RLS, phải xử lý đúng logic | Repo/Security Review |
| Ưu tiên P0 và P1, P2 có thể lùi sau | User request |

## Assumptions

| Assumption | Risk | Confirmed |
|------------|------|-----------|
| Giao diện Frontend có hỗ trợ thành phần hiển thị Toast/Alert khi trả về warning | Low | Yes |

## Unknowns

| Unknown | Blocking? | Owner |
|---------|-----------|-------|
| (Tất cả unknowns đã được làm rõ thông qua review report) | No | N/A |

## Issue triage

| ID | Issue / decision | Severity | Clarity | Blocking? | Owner | Status |
|---|---|---|---|---|---|---|
| ISS-001 | Bắt buộc truyền `organizationId` vào Audit call sites | Critical | Clear | No | Agent | Answered |
| ISS-002 | Tách biệt Audit Export ACL và Global Export namespace | Critical | Clear | No | Agent | Answered |
| ISS-003 | Fix Advisory Lock connection leak | High | Clear | No | Agent | Answered |

## Clarification checkpoint

| Issue ID | Focused question | Why it blocks | User answer / evidence | Resolved? |
|---|---|---|---|---|
| N/A | (Đã có đủ dữ kiện kỹ thuật chi tiết từ PR review của user) | N/A | N/A | Yes |

## Spec quality review

### 1. Feasibility (tính khả thi)

| Question | Finding | Evidence | Verdict |
|---|---|---|---|
| Can this be built with current stack, data, auth, ops, and timeline? | Các sửa đổi nằm hoàn toàn ở TypeScript interface, service logic, và kết nối DB. | Repo dùng TS, Drizzle ORM | Pass |

- Blockers if not feasible: _(none)_

### 2. Correctness (tính đúng đắn)

| Question | Finding | Evidence | Verdict |
|---|---|---|---|
| Do specs match real system behavior / domain rules / existing APIs / UI? | Domain rules yêu cầu cách ly tenant 100%. Code cũ chưa đảm bảo, các giải pháp mới sẽ đáp ứng hoàn toàn. | Báo cáo lỗi RLS | Pass |

- Spec vs system mismatches: _(none)_

### 3. Capability recommendations (khả năng feature / gaps)

| Gap ID | Missing / weak capability | Why it matters | Suggested question / default | Blocking? |
|---|---|---|---|---|
| CAP-001 | Xử lý file/object storage rác do lỗi RLS trước đó | Việc insert RLS lỗi có thể đã tạo zombie data ở S3. Cần job dọn dẹp. | Không nằm trong PR này, đề xuất mở task mới sau khi merge. | No |

## Visual triage

| Issue ID | Visual need | Recommended format | Why this format helps | User confirmed? | Artifact/status |
|---|---|---|---|---|---|
| ISS-001 | none | text | Vấn đề logic về type/DB | N/A | none |

## Scope in

- Cập nhật interface `AuditLogInput` để bắt buộc truyền scope `organizationId`. 
- Fix toàn bộ audit call sites (files, attachments, imports, exports, v.v.).
- Thêm Security classification (ví dụ: `kind = AUDIT_EXPORT`, `visibility = RESTRICTED`) cho Files module; block endpoint API Files generic đối với các file export này.
- Đảm bảo SUPER_ADMIN global export có `organizationId = null` và truy cập owner-only.
- Sửa retention purge lock: Lấy dedicated connection từ Drizzle và bọc try/finally có explicit unlock.
- Thêm cảnh báo Toast ở Frontend UI khi trả về `truncated`.
- Thêm E2E Security & Cross-tenant tests cho các case trên.

## Scope out

- Hiển thị Actor name/email (P2, deferred).
- Refactor hoàn toàn generic Files schema/model thành một bảng riêng biệt (tốn effort, không bắt buộc).

## Non-goals

- Khôi phục (rollback) migration RLS.

## Options considered

### ISS-001: Bắt buộc truyền `organizationId`
| Option | Pros | Cons | Effort | Risk | Reversible? | How to verify |
|--------|------|------|--------|------|-------------|---------------|
| A — `organizationId: string | null` (Bắt buộc trường) | Đơn giản, force developer phải điền giá trị. | Dev vẫn có thể gõ `null` bừa bãi khi lười nghĩ. | Low | Low | Dễ | Đợi TS compiler báo lỗi ở các hàm thiếu field. |
| B — Discriminated union (`scope`) | Bắt buộc khai báo mục đích (platform vs org), type-safe nhất. | Code dài hơn một chút khi tạo log. | Medium | Low | Dễ | Đợi TS compiler báo lỗi và review kỹ logic scope. |

### ISS-002: Tách biệt Export ACL
| Option | Pros | Cons | Effort | Risk | Reversible? | How to verify |
|--------|------|------|--------|------|-------------|---------------|
| A — Dedicated audit export table (`audit_exports`) | Tách biệt vật lý hoàn toàn, an toàn nhất. | Tốn migration DB, sinh thêm nhiều class/logic tương đồng. | High | Low | Khó | Test endpoint `/files/:id` trả 404 cho export. |
| B — Security classification cho Files | Nhanh, tận dụng code lưu file, dễ xử lý. | Rủi ro human error ở các query generic nếu quên cờ chặn. | Medium | Medium | Dễ | Test endpoint `/files/:id` chặn quyền. |

### ISS-003: Advisory Lock retention
| Option | Pros | Cons | Effort | Risk | Reversible? | How to verify |
|--------|------|------|--------|------|-------------|---------------|
| A — Dedicated checked-out connection (try/finally) | Phù hợp với batch delete purge, không sinh long-tx. | Phải đảm bảo DB driver hỗ trợ checkout và luôn unlock. | Medium | Low | Dễ | Mock pool, check identity connection. |
| B — Transaction-scoped lock (`xact_lock`) | An toàn không lo quên unlock. | Chạy toàn bộ lệnh xóa trong 1 transaction dài gây chậm/khóa DB. | Low | High | Dễ | Kiểm tra pg_locks. |

## Recommendation

- **Choose:**
  - ISS-001: **Option B (Discriminated union)** - An toàn tuyệt đối về mặt type và scope logic.
  - ISS-002: **Option B (Security classification)** - Giải pháp đủ tốt, tiết kiệm effort refactor bảng mới.
  - ISS-003: **Option A (Dedicated checked-out connection)** - Đảm bảo database performance khi purge data theo batch.
- **Reason:** Đạt được tính an toàn như ý định của người thiết kế với rủi ro side-effect (hư DB hoặc chậm hệ thống) thấp nhất.
- **Not choosing:** (Được nêu trong cột Cons ở bảng Options).
- **Confidence:** High

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Codebase TypeScript hỏng đồng loạt (Broken compilation) do sửa interface AuditLogInput. | High | Sửa từ từ theo từng Domain layer và test compile liên tục; đảm bảo IDE server update. |

## Handoff

- **Next skill:** planning
- **Why:** Toàn bộ các vấn đề kỹ thuật đã được phân tích và chốt option giải quyết; đã sẵn sàng tạo task list (`TASKS.md`) để code thực tế.
- **Blockers before next skill:** Không có. (Không còn unknowns).
