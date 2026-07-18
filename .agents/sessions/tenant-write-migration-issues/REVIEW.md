# Review

## Tóm tắt nội dung chính (Executive summary)

- Đã xem xét các thay đổi thực thi (diff), kết quả test và tài liệu trong session `tenant-write-migration-issues`.
- Các chức năng RLS, Audit Export ACL, và fix advisory lock đã được triển khai đầy đủ và verified qua E2E testing.
- **Top Finding (H-001):** Sử dụng hardcode string nhiều nơi (`AUDIT_EXPORT`, `RESTRICTED`, `SUPER_ADMIN`, `platform`/`organization`). Cần khai báo hằng số (constants) hoặc enum chung trong `api-core` thay vì hardcode.
- Mặc dù code chạy đúng và pass E2E tests, nhưng việc hardcode string gây nợ kỹ thuật (tech debt) và khó bảo trì lâu dài theo ghi nhận từ phía user.
- **Khuyến nghị (Recommendation):** Needs fix - Sửa lại code để sử dụng constant thay vì hardcode trước khi merge.

## Tổng quan trạng thái (Developer overview)

- **Recommendation:** 🔴 Needs fix (Cần sửa lỗi hardcode)
- **Findings:**
  - Critical: 0
  - High: 1 (Hardcode strings)
  - Medium: 0
  - Low: 0
  - Info: 0
- **Verification gaps:** Không có, mọi thay đổi logic đã được cover bởi unit/E2E tests.
- **Next action:** Cập nhật lại PLAN và thực thi refactor để sử dụng constants.

## Phạm vi được xem xét (Scope reviewed)

- Toàn bộ các thay đổi trong diff (`api-platform`, `apps/admin`, `api-core`, `api-identity`).
- Các Use case: `ExportAuditLogsUseCase`, `PurgeExpiredAuditLogsUseCase`, `FileAccessService`, `AttachFileUseCase`, `ConfirmImportUseCase`.
- Frontend Controller: `useAuditLogsController`.
- Tests: `audit.e2e.spec.ts`, unit tests.

## Đầu vào (Inputs)

- `PLAN.md`, `TASKS.md`, `EXECUTION.md`
- Kết quả test: `pnpm --filter api-platform run typecheck`, E2E test `audit.e2e.spec.ts`.
- Ghi chú từ người dùng về việc hardcode text.

## Phát hiện (Findings)

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| H-001 | High | Maintainability | `FileAccessService`, `ExportAuditLogsUseCase` | Các string `'AUDIT_EXPORT'`, `'RESTRICTED'`, `'SUPER_ADMIN'`, `'platform'`, `'organization'` đang được viết trực tiếp dạng string literal trong code. | Khó bảo trì, dễ xảy ra lỗi typo nếu tái sử dụng ở các module khác nhau. Vi phạm chuẩn clean code. | Tạo constants/enums cho FileKind, FileVisibility, SystemRole, và SystemScope trong `api-core/domain` và sử dụng thay cho text cứng. | High |

## Độ bao phủ yêu cầu (Requirement coverage)

| Requirement | Covered? | Evidence | Notes |
|---|---|---|---|
| T-004: Secure Export logs with AUDIT_EXPORT | Yes | `ExportAuditLogsUseCase` tạo file với `kind: 'AUDIT_EXPORT'` | Cần refactor dùng constant thay vì string. |
| T-005: Block unauthorized AUDIT_EXPORT download | Yes | `FileAccessService` kiểm tra `file.kind === 'AUDIT_EXPORT'` | Hoạt động tốt. Bị lỗi maintainability (H-001). |
| T-006: Fix Advisory Lock in Audit Repository | Yes | `try/finally` và `unlockAdvisoryLock` | Đã verify qua unit tests. |
| T-007: Implement UI Truncated Toast | Yes | `toast.warning()` trong `useAuditLogsController` | Đã triển khai. |
| T-008: Write Security E2E Tests | Yes | `audit.e2e.spec.ts` chặn `403` download. | Hoạt động như mong muốn. |

## Đánh giá xác minh (Verification reviewed)

| Check | Result | Evidence | Concern |
|---|---|---|---|
| ACL Bypass test | Pass | `audit.e2e.spec.ts` test `prevents non-authorized users...` chặn với HTTP 403. | None. |
| Memory/Lock leak test | Pass | Mock của `unlockAdvisoryLock` được gọi trong block `finally`. | None. |

## Chuyển giao (Handoff)

- **Next action/skill:** Trở lại `planning` hoặc `execution` để tiến hành refactor thay thế chuỗi hardcode bằng constants.
- **Owner:** Agent
- **Blocking status:** Blocked cho đến khi fix xong finding H-001.
