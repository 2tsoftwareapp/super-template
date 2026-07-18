# Tasks

> Session path: `.agents/sessions/Task-3-Task-2-feature-06-notifications`
> Xem `PLAN.md` để biết thêm về chiến lược, thiết kế và kiến trúc.

## Work inventory

| ID | Type | Description |
|---|---|---|
| T-001 | Migration | Thêm `sourceJobId`, index, unique constraint trên bảng `notifications`. |
| T-002 | Repository | Bắt buộc tham số `organizationId` trong mọi thao tác với inbox của `NotificationsRepository`. |
| T-003 | App Layer | Trích xuất và giới hạn bằng `organizationId` từ auth context tại các use-case/controller. |
| T-004 | DB Logic | Dùng lệnh `INSERT ... ON CONFLICT DO NOTHING` để tạo inbox an toàn (idempotent). |
| T-005 | DB Logic | Cơ chế deduplication cho push delivery (đặt unique identity `notification_id, device_token_id, channel`). |
| T-006 | DB Logic | Concurrency safety (sử dụng `FOR UPDATE SKIP LOCKED` hoặc phương án tương tự để claim worker atomicity). |
| T-007 | Infra | Giới hạn phát và subscribe SSE stream theo `userId + organizationId`. |
| T-008 | Test | Viết test strict tenant isolation và test concurrency worker. |

## Progress board

| ID | Status | Verify | Code | Tests | Title |
|---|---|---|---|---|---|
| T-001 | `in_progress` | `[ ]` | `[ ]` | `[ ]` | Database migration |
| T-002 | `todo` | `[ ]` | `[ ]` | `[ ]` | Repository tenant scope |
| T-003 | `todo` | `[ ]` | `[ ]` | `[ ]` | Controller/use-case enforcement |
| T-004 | `todo` | `[ ]` | `[ ]` | `[ ]` | Idempotent inbox creation |
| T-005 | `todo` | `[ ]` | `[ ]` | `[ ]` | Push delivery deduplication |
| T-006 | `todo` | `[ ]` | `[ ]` | `[ ]` | Concurrency safety |
| T-007 | `todo` | `[ ]` | `[ ]` | `[ ]` | SSE/realtime tenant isolation |
| T-008 | `todo` | `[ ]` | `[ ]` | `[ ]` | Tests |

## Execution details

---

### T-001: Database migration

**Trace:** PLAN.md § Scope
**Status:** `in_progress`

**Description:**
Thêm cột `sourceJobId` (UUID, nullable) vào `notifications`.
Thêm constraint `UNIQUE (source_job_id, user_id)` (hoặc phối hợp với `notification_key` tuỳ thuộc thiết kế hiện tại).
Thêm các index: `notifications_org_user_created_idx` (org, user, created_at DESC) và `notifications_org_user_unread_idx` (org, user, read_at).

**Work items:**
- [ ] 1. Khởi tạo một file Drizzle migration mới.
- [ ] 2. Định nghĩa cột `sourceJobId` trong schema.
- [ ] 3. Khai báo unique constraints trong schema.
- [ ] 4. Bổ sung các index liên quan tại schema.

**Acceptance criteria:**
- Script migration chạy thành công và rollback (lệnh down) hoạt động tốt.

**Verify:** Chạy lệnh `db:migrate`.

**Files:** `packages/api-database/src/schema/platform/notifications.ts`, `.sql` migration file.

---

### T-002: Repository tenant scope

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Refactor các hàm trong `NotificationsRepository` (list inbox, unread count, mark read, mark all read, delete) để luôn yêu cầu tham số `{ userId: string; organizationId: string }` và filter triệt để.

**Work items:**
- [ ] 1. Cập nhật các type interface của hàm trong repository để chứa thuộc tính `organizationId`.
- [ ] 2. Update logic implement của `listForUser`, `countUnread`, `markAsRead`, v.v... đảm bảo query với cả `organizationId`.

**Acceptance criteria:**
- Mọi queries đều phải query theo điều kiện bao gồm cả `userId` và `organizationId`.

**Verify:** Biên dịch backend, chạy thử unit tests.

**Files:** `packages/api-platform/src/modules/notifications/infrastructure/notifications.repository.ts`.

---

### T-003: Controller/use-case enforcement

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Đảm bảo `NotificationInboxUseCase` và Controller của nó tiếp nhận `organizationId` qua context đã xác thực (vd: `requireOrganizationId(actor)`). Tuyệt đối không đọc trực tiếp từ HTTP body hay query.

**Work items:**
- [ ] 1. Refactor đầu vào của `NotificationInboxUseCase` để ép phải truyền `organizationId`.
- [ ] 2. Refactor HTTP Controller, trích xuất thông tin qua `requireOrganizationId` từ biến `AuthenticatedRequestUser`.
- [ ] 3. Kiểm tra bảo đảm các thông báo nền tảng chung (nếu có `organizationId = null`) được cách ly/xử lý theo flow khác.

**Acceptance criteria:**
- Tenant scope luôn được lấy mặc định từ Auth request (actor context).

**Verify:** Biên dịch backend, thực thi API tests.

**Files:** `packages/api-platform/src/modules/notifications/application/use-cases/notification-inbox.use-case.ts`, `packages/api-platform/src/modules/notifications/presentation/http/notification-inbox.controller.ts`.

---

### T-004: Idempotent inbox creation

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Refactor hàm tạo inbox để tận dụng mệnh đề `INSERT ... ON CONFLICT DO NOTHING` dựa vào constraint unique của `source_job_id`. Hàm trả về kết quả `{ notification, created: boolean }` giúp worker nhận diện trạng thái retry.

**Work items:**
- [ ] 1. Update hàm `createMany` (hoặc tương tự) trong repository dùng `ON CONFLICT DO NOTHING`.
- [ ] 2. Map dữ liệu trả về với cờ `created: boolean`.

**Acceptance criteria:**
- Các lệnh tạo inbox trùng lặp không bị throw error nhưng vẫn nhận diện được qua biến trả về.

**Verify:** Viết unit test thử giả lập insert trùng dữ liệu 2 lần.

**Files:** `packages/api-platform/src/modules/notifications/infrastructure/notifications.repository.ts`.

---

### T-005: Push delivery deduplication

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Thiết lập định danh cho giao dịch gửi push qua combo `(notification_id, device_token_id, channel)` và unique constraints. Định nghĩa các trạng thái `PENDING`, `PROCESSING`, `SENT`, `FAILED`.

**Work items:**
- [ ] 1. Update schema DB của delivery job/tracking (thêm cột nếu cần trên bảng tracking hiện hữu).
- [ ] 2. Thêm unique constraint `(notification_id, device_token_id, channel)`.
- [ ] 3. Refactor worker push, đảm bảo chỉ claim các job chưa tới trạng thái `SENT`.

**Acceptance criteria:**
- Thông tin phân phối push bảo đảm tính duy nhất trên mỗi thiết bị/channel/notification.

**Verify:** Unit test giả lập nỗ lực push lặp đi lặp lại cùng một thông báo.

**Files:** `packages/api-database/src/schema/platform/notifications.ts`, `packages/api-platform/src/modules/notifications/application/use-cases/notification-delivery.use-case.ts`.

---

### T-006: Concurrency safety

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Implement lệnh `FOR UPDATE SKIP LOCKED` cho phép hàng chục worker song song cùng nhặt job mà không bị kẹt hay giẫm chân lên nhau.

**Work items:**
- [ ] 1. Update worker job claim logic, nối chuỗi `FOR UPDATE SKIP LOCKED` qua query Drizzle/Postgres.
- [ ] 2. Đảm bảo cập nhật nguyên tử (atomic update) trạng thái về `PROCESSING`.

**Acceptance criteria:**
- Hai worker pick job cùng lúc phải claim thành công 2 job riêng biệt.

**Verify:** Test integration cho nhiều instance claim đồng thời.

**Files:** `packages/api-platform/src/modules/notifications/infrastructure/notification-jobs.repository.ts`.

---

### T-007: SSE/realtime tenant isolation

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Sửa `NotificationStreamService`, thay đổi channel name để luôn gắn theo `userId + active organizationId`. Cập nhật cách thức front-end/SSE đóng hay mở stream lúc user chuyển organization.

**Work items:**
- [ ] 1. Điều chỉnh channel Redis Pub/Sub, thêm `organizationId` vào format.
- [ ] 2. Kiểm tra/thêm luồng ngắt SSE client kết nối khi có sự thay đổi org scope (nếu front-end xử lý) hoặc route SSE trên backend tự động xác thực orgId đúng.

**Acceptance criteria:**
- Event chỉ được broadcast cho các user có session vào chính xác tổ chức phát sinh event đó.

**Verify:** E2E test cho tình huống 1 user login trên 2 tổ chức.

**Files:** `packages/api-platform/src/modules/notifications/infrastructure/notification-stream.service.ts`.

---

### T-008: Tests

**Trace:** PLAN.md § Scope
**Status:** `todo`

**Description:**
Bổ sung các bộ test để kiểm chứng lại toàn bộ yêu cầu.

**Work items:**
- [ ] 1. Đảm bảo inbox của Org A không xuất hiện thông báo thuộc Org B.
- [ ] 2. Test hàm mark-read từ Org A không chạm tới Org B.
- [ ] 3. Test nỗ lực retry trùng `sourceJobId` sẽ không đẻ thêm bản ghi inbox.
- [ ] 4. Test nhiều worker song song pick riêng biệt từng job.
- [ ] 5. Test tính biệt lập của luồng SSE.

**Acceptance criteria:**
- Mọi spec phải Pass.

**Verify:** Dùng lệnh `npm run test` / `bun test`.

**Files:** Các E2E và file spec của khối Notifications.

---
