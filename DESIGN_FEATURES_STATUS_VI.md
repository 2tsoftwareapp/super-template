# Báo cáo trạng thái các tính năng trong `DESIGN_FEATURES.md`

Ngày đánh giá: 23/06/2026

## 1. Phạm vi và quy ước

Báo cáo này đối chiếu từng tính năng trong `DESIGN_FEATURES.md` với:

- Hợp đồng API hiện tại tại `apps/api/openapi.json`.
- Mã nguồn backend trong `packages/api-identity`, `packages/api-platform`, `packages/api-workspace`.
- Giao diện Web, Admin và Mobile.
- Lược đồ cơ sở dữ liệu và kiểm thử hiện có.

Quy ước trạng thái:

- ✅ **Hoàn chỉnh**: có luồng nghiệp vụ chính, API/domain hợp lệ và có đường sử dụng thực tế.
- 🟡 **Một phần**: đã có nền tảng hoặc một phần luồng, nhưng chưa đạt hành vi đầy đủ.
- ⚠️ **Chưa đúng**: có triển khai mang tên hoặc gần với tính năng, nhưng hành vi hiện tại không thực hiện đúng mục tiêu.
- ❌ **Chưa có**: chưa thấy API, domain, dữ liệu hoặc giao diện đáp ứng tính năng.

Tổng quan 70 tính năng:

| Trạng thái | Số lượng |
|---|---:|
| ✅ Hoàn chỉnh | 61 |
| 🟡 Một phần | 8 |
| ⚠️ Chưa đúng | 0 |
| ❌ Chưa có | 1 |

## 2. Kết quả kiểm chứng kỹ thuật

- `pnpm test`: đạt 246/246 kiểm thử đơn vị.
  - API: 200 kiểm thử (bao gồm domain TOTP/AES-GCM/OIDC-JWT-verify/Apple-client-secret, account-linking policy, use-case 2FA + SSO, export/retention audit, versioning/batch-delete file, job observability, và `SendAdminMailUseCase` mới). `packages/api-platform` trước đây không nằm trong glob `include` của `apps/api/vitest.config.ts` lẫn script `test` ở `package.json` (alias resolve đã có sẵn nhưng include thì thiếu) nên toàn bộ unit test của package này (audit, files, mail, jobs, settings...) bị bỏ qua một cách âm thầm; đã bổ sung cả hai chỗ.
  - Web: 14 kiểm thử.
  - Admin: 32 kiểm thử.
- `pnpm test:e2e` (`apps/api`): 47 kiểm thử E2E, 43 pass / 4 fail — 4 fail là lỗi có sẵn từ trước, không liên quan 2FA/SSO/Audit/Files/Jobs/Mail (xem mục "Phát hiện thêm trong lúc xác minh E2E"). E2E 2FA (`mfa.e2e.spec.ts`), SSO (`sso.e2e.spec.ts`, dùng provider mock), Audit (`audit.e2e.spec.ts`), Files catalog/versioning/batch (`files-catalog.e2e.spec.ts`), Job observability (`job-observability.e2e.spec.ts`) và Mail workspace (`mail-workspace.e2e.spec.ts`) đều pass toàn bộ.
- Sửa kèm một bug có sẵn không liên quan trực tiếp đến audit nhưng bị test export phát hiện: endpoint `GET /files/:id/download` thiếu `@SkipEnvelope()` nên `ResponseEnvelopeInterceptor` bọc `StreamableFile` thành JSON, khiến mọi download nhị phân qua endpoint này luôn trả về JSON hỏng thay vì nội dung file gốc.
- Files catalog/versioning/batch: migration `0012_file_versions_and_batch.sql` thêm `files.checksum`/`files.latestVersion`, bảng `file_versions` và `file_batch_operations` (cả hai có RLS tenant-isolation riêng theo đúng pattern của `files`/`projects`/...), cộng index `mime_type`/`created_at` trên `files`.
- Sửa một bug có sẵn **nghiêm trọng** phát hiện qua test job observability mới: `JobsRepository.claimDueJobs` dùng `RETURNING *` trong raw SQL (trả về cột snake_case thật của Postgres) nhưng `ProcessJobsUseCase` đọc `job.maxAttempts`/`job.organizationId`/`job.createdById` theo camelCase — luôn `undefined` ở runtime dù type khai báo là camelCase. Hệ quả: `job.attempts < job.maxAttempts` luôn so sánh với `undefined` → luôn `false` → **retry chưa bao giờ thực sự chạy**, mọi job lỗi nhảy thẳng sang `FAILED` ngay lần thử đầu bất kể `maxAttempts`; đồng thời job luôn được xử lý với `organizationId`/`createdById` là `null` (sai tenant context). Đã sửa bằng cách alias rõ từng cột trong `RETURNING`. Migration `0013_job_observability.sql` thêm `job_attempts`, `job_events`, `job_dependencies` (đều có RLS tenant-isolation kiểu nullable-org giống `jobs`/`audit_logs`).
- Mail workspace: thêm `SendAdminMailUseCase` vào `MailModule` khiến `MailModule` ⇄ `JobsModule` trở thành phụ thuộc module hai chiều thật (`JobsModule` đã import `MailModule` từ trước để gửi mail trong job handler; nay `MailModule` cũng cần `JobsService` để enqueue). NestJS từng resolve "thành công" theo nghĩa typecheck/build nhưng `app.init()` lúc runtime gọi `process.abort()` (crash native, không phải exception bắt được) — `apps/api/test/support/test-app.ts` đã được vá thêm `abortOnError: false` ở `NestFactory.createApplicationContext`/`createNestApplication` để runtime trả về exception bắt được thay vì abort câm, giúp lộ rõ lỗi `UnknownDependenciesException` thật. Đã sửa bằng `forwardRef()` ở cả hai module imports (`jobs.module.ts` ⇄ `mail.module.ts`) và ở cả hai chiều constructor injection (`SendAdminMailUseCase` inject `JobsService`, `JobHandlersRegistry` inject `MailService`) — chỉ vá một chiều không đủ vì thứ tự khởi tạo provider giữa hai module phụ thuộc vòng là không xác định.
- Đồng bộ lại `apps/api/openapi.json`/`packages/api-contract` sau khi thêm route Mail làm lộ một lỗi type-safety có sẵn (không liên quan Mail) ở `apps/web` và `apps/admin`: trang `/login` và route `api/auth/login` truy cập `response.data.user`/`accessToken`/`refreshToken` trực tiếp không kiểm tra `mfaRequired`, dù `LoginResponseDto` đã optional hóa các field này từ khi thêm tính năng 2FA. Đã thêm guard chặn truy cập khi `mfaRequired`/thiếu `user` (báo lỗi rõ ràng "chưa hỗ trợ 2FA ở giao diện này" thay vì crash) và chỉ set cookie khi có `accessToken`/`refreshToken` thật — **chưa làm UI nhập mã 2FA**, đây vẫn là tính năng thiếu cần một hạng mục riêng.
- `pnpm typecheck`: đạt 15/15 tác vụ (bao gồm `apps/web`, `apps/admin` sau khi đồng bộ contract).
- `pnpm generate:check`: chưa có kết luận vì lệnh vượt quá giới hạn 3 phút.
- Chưa chạy toàn bộ E2E vì các bộ E2E cần dịch vụ hạ tầng và dữ liệu runtime.

## 3. Trạng thái chi tiết

### 3.1. Auth

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| Phân chia role `superadmin`, `admin`, `user` | ✅ | Có `SUPER_ADMIN`, `ADMIN`, `USER` và kiểm thử ma trận role tại `packages/api-core/src/common/rbac`. |
| Permission CRUD theo RBAC | ✅ | Có permission dạng `resource.action`, guard `@Authorize`, role-permission động và màn hình quản lý role. |
| Phân chia theo tổ chức | ✅ | Role có `organizationId`, user-role theo tổ chức, tenant context và E2E tenant isolation. |
| Login | ✅ | API, Web, Mobile, session và kiểm thử đầy đủ. |
| Logout | ✅ | Thu hồi session hiện tại; Web và Mobile đều có luồng logout. |
| Register | ✅ | Tạo tài khoản, gửi email xác minh, có UI Web/Mobile và E2E. |
| Forgot password | ✅ | API sinh token và gửi email reset; có UI Web/Mobile. |
| Reset password | ✅ | Token một lần, hết hạn, cập nhật mật khẩu và thu hồi session. |
| Refresh token | ✅ | Có rotation, phát hiện reuse và thu hồi session; có E2E. |
| Revoke token/session | ✅ | Có danh sách session, revoke theo session ID và logout-all. |
| Verify email | ✅ | Có token xác minh, API, UI và E2E. |
| Reset password qua email | ✅ | Forgot-password gửi template `auth.reset-password`, sau đó reset bằng token. |
| Resend email verification | ✅ | Có API, rate limit và UI Mobile; Web E2E gọi được luồng. |
| Lock account | ✅ | Chuyển trạng thái sang `BLOCKED`, chặn login/refresh và thu hồi session đang hoạt động. |
| Unlock account | ✅ | Chuyển lại `ACTIVE`, có UI quản trị trạng thái. |
| Change role | ✅ | Có API thay role, chính sách chống tự đổi role và chống admin quản lý tài khoản đặc quyền. |
| Change password | ✅ | Có API, Web/Mobile UI và thu hồi các session khác. |
| 2FA | ✅ | TOTP RFC 6238 hand-rolled (`packages/api-identity/src/modules/mfa/`), secret mã hoá AES-256-GCM tại nghỉ (`MFA_ENCRYPTION_KEY`), recovery code hash sha256, API `auth/mfa/{setup,confirm,disable,status,recovery-codes/regenerate}` và login tự động rẽ sang challenge khi user bật 2FA. Có unit test + E2E (`apps/api/test/mfa.e2e.spec.ts`). |
| Me: xem/cập nhật profile | ✅ | Có `GET/PATCH /users/me`, upload avatar và UI Web/Mobile. |
| Login SSO Google/Apple | ✅ | OIDC Authorization Code + PKCE backend hoàn chỉnh (`packages/api-identity/src/modules/sso/`): `GET auth/sso/:provider/start` + `GET/POST auth/sso/:provider/callback`, verify id_token qua JWKS thật (RS256 hand-rolled), client_secret ES256 tự build cho Apple, account-linking policy (chống takeover qua email chưa verify), redirect-URI allowlist theo `WEB_ORIGIN`. Có provider "fake" cho dev/test khi chưa có credential thật. Còn thiếu nút đăng nhập SSO trên Web/Mobile. |
| Logout SSO | ❌ | Logout vẫn chỉ revoke session nội bộ (đủ dùng); chưa gọi revocation/end-session phía Google/Apple — provider không bắt buộc điều này nên để lại cho giai đoạn sau nếu cần. |
| OTP | ✅ | Triển khai dưới dạng 2FA/TOTP (xem dòng 2FA) cộng recovery code dùng một lần; không làm OTP email riêng vì TOTP đã đáp ứng yêu cầu MFA chính. |

### 3.2. Preferences

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| Change language | 🟡 | Giá trị được lưu, nhưng chưa có i18n provider/catalog và giao diện vẫn dùng chuỗi tiếng Anh cố định. |
| Change theme | 🟡 | Giá trị được lưu ở API, nhưng Web không gọi `setTheme` theo preference; Mobile dùng theme store cục bộ tách khỏi API preference. |
| Change timezone | 🟡 | Giá trị được lưu, nhưng format ngày giờ chưa dùng timezone của người dùng. |
| Change notification settings | 🟡 | Web lưu `notificationPreferences`, nhưng luồng gửi email/push chưa đọc preference để quyết định gửi. Mobile chưa có điều khiển notification preference. |
| Get Preferences | ✅ | Có `GET /users/me/preferences`, repository và UI Web/Mobile. |
| Save Preferences | ✅ | Có `PATCH /users/me/preferences`, persistence và audit log. |
| Reset Preferences | ❌ | Không có endpoint, use case hoặc nút reset về mặc định. |

### 3.3. Organization

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| Create organization | ✅ | Có API tạo, tạo membership OWNER, list/switch và UI Mobile. |
| Join organization | ✅ | Luồng accept invitation cho tổ chức đã được siết theo allow-list `organization`/`project`, yêu cầu đăng nhập bằng đúng email được mời, upsert `organization_members` trong transaction, chặn role `OWNER`, hỗ trợ role `ADMIN`/`MEMBER`, ghi audit log và cho phép người nhận thấy tổ chức trong API list rồi switch vào tổ chức mới. |
| Leave organization | ✅ | `POST /organizations/:id/leave`; chặn owner cuối cùng rời tổ chức (`ORGANIZATION_LAST_OWNER`), có audit log và E2E. Chưa có UI Web/Admin/Mobile. |
| View organization | ✅ | `GET /organizations/:id` trả chi tiết (role, memberCount) và `GET /organizations/:id/members` trả danh sách thành viên; cả hai yêu cầu membership. Chưa có UI Web/Admin/Mobile. |
| Manage organization | ✅ | `PATCH/DELETE /organizations/:id` (đổi tên, soft delete) và `PATCH/DELETE /organizations/:id/members/:userId` (đổi role, xóa thành viên) với policy OWNER/ADMIN/MEMBER riêng (`organization-access.policy.ts`), bảo vệ owner cuối cùng, audit log đầy đủ và E2E. Chưa có UI Web/Admin/Mobile. |

### 3.4. Users

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| List users | ✅ | API phân trang, Web/Admin/Mobile UI. |
| Create user | ✅ | API, kiểm tra role được phép gán và UI quản trị. |
| Update user | ✅ | Cập nhật email, display name, mật khẩu, avatar và trạng thái. |
| Delete user | ✅ | Soft delete, kiểm tra quyền/tài khoản đặc quyền và UI xác nhận. |
| View user | ✅ | API chi tiết và trang Admin chi tiết. |
| Search users | ✅ | Tìm theo tên/email, debounce và query URL. |
| Sort users | ✅ | Hỗ trợ nhiều cột và thứ tự tăng/giảm. |
| Filter users | ✅ | Lọc theo status và role, có phân trang. |

### 3.5. Audit

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| View audit logs | ✅ | API phân trang, Web/Admin/Mobile UI và kiểm tra `audit.read`. |
| Add audit log | ✅ | Có `AUDIT_WRITER`, redaction dữ liệu nhạy cảm và được dùng trong auth, users, projects, invitations, notifications. |
| Export audit logs | ✅ | `POST /admin/audit-logs/export` (`ExportAuditLogsUseCase`): áp cùng filter với list, giới hạn an toàn 5000 dòng, tạo CSV qua `toCsv`, upload lên object storage và tạo `files` record scoped theo `organizationId` của actor; thao tác export tự ghi lại một audit log (`audit.exported`). E2E: `apps/api/test/audit.e2e.spec.ts`. |
| Delete audit log | ✅ | Không cho xóa tùy ý; thêm retention policy qua `AUDIT_RETENTION_DAYS` (0 = tắt) và job purge hàng ngày (`AuditRetentionService`, cron 3h sáng) gọi `PurgeExpiredAuditLogsUseCase` → `auditRepository.deleteOlderThan`; nếu có xóa thì tự ghi audit log `audit.retention_purged`. Unit test: `purge-expired-audit-logs.use-case.spec.ts`. |
| Search audit logs | ✅ | Thêm tham số `q` (ILIKE trên action/entityType/requestId) cạnh bộ lọc actor/action/resource/date hiện có, dùng chung `buildAuditLogFilters` cho cả list và export. |
| Sort audit logs | ✅ | Có sắp xếp theo thời gian tăng/giảm. |
| Filter audit logs | ✅ | Backend hỗ trợ actor, action, resource type/ID, khoảng thời gian; Web hiện mới hiển thị một phần bộ lọc. |
| View audit log details | 🟡 | Đã có `GET /admin/audit-logs/:id`. UI bảng vẫn chưa có drawer/trang chi tiết. |

### 3.6. Files

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| Upload files | ✅ | Multipart upload, policy kích thước/loại file, storage adapter và Web/Mobile client. |
| Download files | ✅ | Stream download, content disposition an toàn và Mobile repository. |
| Delete files | ✅ | Soft delete, kiểm tra quyền và xóa object storage. |
| View file details | 🟡 | Có `GET /files/:id` (kèm `checksum`/`latestVersion`) nhưng chưa có file browser hoặc màn hình chi tiết độc lập trên Web/Admin. |
| Sign URLs | ✅ | Có `GET /files/:id/url`, token hết hạn và storage adapter. |
| Batch file operations | ✅ | `POST /files/batch-delete` (`BatchDeleteFilesUseCase`): xóa nhiều file, trả kết quả từng item (`fileId`/`success`/`error`), hỗ trợ `idempotencyKey` (lưu trong `file_batch_operations`, replay trả đúng kết quả cũ thay vì xóa lại). Giới hạn tối đa 100 file/lần. Chưa có bulk download/move/tag. |
| Search files | ✅ | `GET /files` (`ListFilesUseCase`): phân trang, search theo `originalName`, lọc `mimeType`/`uploadedById`/khoảng ngày, sort theo `createdAt`/`originalName`/`sizeBytes`, scoped theo `organizationId` của actor. |
| View file versions | ✅ | Bảng `file_versions` (immutable, giữ `storageKey`/`mimeType`/`sizeBytes`/`checksum` sha-256/`createdById`/`createdAt` riêng từng version) + `files.checksum`/`files.latestVersion` làm con trỏ bản hiện tại. `POST /files/:id/versions` tạo version mới, `GET /files/:id/versions` liệt kê. |
| View file history | ✅ | `GET /files/:id/history` hợp nhất event từ `file_versions` (upload/version) và audit log (`entityType=file`), sort theo thời gian giảm dần. Chưa có UI lịch sử trên Web/Admin. |

### 3.7. Jobs

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| Background jobs | ✅ | Có scheduler, claim bằng `FOR UPDATE SKIP LOCKED`, retry, idempotency và handler registry. **Sửa một bug có sẵn nghiêm trọng phát hiện qua test mới**: `claimDueJobs` dùng `RETURNING *` trong raw SQL nên trả về cột snake_case, nhưng code đọc `job.maxAttempts`/`job.organizationId`/`job.createdById` theo camelCase → luôn `undefined` → mọi job lỗi đều nhảy thẳng sang `FAILED` (retry không bao giờ thực sự chạy) và job luôn xử lý với tenant context rỗng. Đã sửa bằng cách alias cột rõ ràng trong `RETURNING`. |
| List jobs | ✅ | API phân trang/lọc theo status/type và UI Admin/Mobile. |
| View job details | 🟡 | Đã có `GET /admin/jobs/:id`. UI chi tiết (Admin/Web/Mobile) vẫn chưa làm. |
| Cancel job | ✅ | Có API và UI; repository chỉ hủy job `PENDING` (đã đúng ở backend), ghi `job_events` loại `cancelled`. UI Web vẫn cho chọn `PROCESSING` (chưa sửa). |
| View job logs | ✅ | Bảng `job_attempts` (start/end/duration/lỗi mỗi lần thử) + `job_events` (timeline: `claimed`/`completed`/`failed`/`retry_scheduled`/`cancelled`/`no_handler`, metadata được redact qua `redactSensitive`). `GET /admin/jobs/:id/logs` phân trang. Chưa có UI timeline. |
| View job metrics | ✅ | `GET /admin/jobs/metrics` (`GetJobMetricsUseCase`): đếm theo status/type, `averageDurationMs` (từ `job_attempts`), `retryRate`, `failureRate`, lọc theo khoảng `from`/`to`. Chưa có UI/time-series chart. |
| View job dependencies | ✅ | Bảng `job_dependencies` (`job_id` → `depends_on_job_id`), `POST/GET /admin/jobs/:id/dependencies`. Chặn tự phụ thuộc và cycle qua recursive CTE (`wouldCreateCycle`). `claimDueJobs` chỉ claim job khi mọi prerequisite đã `COMPLETED`. |
| View job status | ✅ | Có trạng thái và các mốc thời gian trong DTO/UI. |

### 3.8. Mail

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| Send mail | ✅ | `POST /admin/mail/send` (permission `mail:create`, throttle 10/phút): validate template tồn tại, chặn template `mandatory` (`auth.verify-email`/`auth.reset-password`, vốn mang token bảo mật) gửi thủ công, validate đủ biến bắt buộc trước khi enqueue, hỗ trợ `idempotencyKey` (replay trả lại cùng job thay vì gửi lại), enqueue job nền `mail.send` qua `JobsService` và ghi audit log `mail.send_requested`. UI duyệt/gửi vẫn chưa làm (chỉ có API). |
| View mail | ✅ | Có API delivery history và UI Admin/Mobile. |
| View mail templates | ✅ | `GET /admin/mail/templates` trả key, cờ `mandatory`, cờ `sendable` (= không phải mandatory) và danh sách biến `{{var}}` quét trực tiếp từ file template. `GET /admin/mail/preview/:templateKey` hỗ trợ override biến qua query `variables` (JSON string) và trả `missingVariables`. UI duyệt catalog (ngoài preview hiện có) vẫn chưa làm. |

## 4. Các vấn đề cần ưu tiên

### P0 - Sửa hành vi sai của Join organization

Phạm vi: `Join organization`.

Trạng thái hiện tại trên branch này: backend đã được triển khai lại theo hướng transaction-safe và có unit test cho luồng accept.

Cập nhật: lỗi nền chặn E2E không phải do thiếu migration — `apps/api/test/support/test-app.ts` tính `DATABASE_URL_TEST_ADMIN` sai cổng khi `.env` không khai báo biến này (rơi về placeholder cổng 5432 trong `.env.example` thay vì cổng thật trong `POSTGRES_PORT`), khiến script reset/migrate chạy nhắm vào một Postgres instance khác với instance mà app thật sự kết nối. Đã sửa `configureTestDatabaseUrls()` để luôn suy ra `DATABASE_URL_TEST_ADMIN` từ `POSTGRES_HOST`/`POSTGRES_PORT` thay vì tin giá trị đã có sẵn trong `process.env`. Sau khi sửa, E2E chạy được và lộ ra một bug thật: `CreateAdminUserUseCase` luôn set `emailVerifiedAt: null` dù `status` được set `ACTIVE`, khiến `LoginUseCase` (yêu cầu `emailVerifiedAt`) luôn từ chối đăng nhập các user admin tạo trực tiếp — đã sửa để set `emailVerifiedAt` khi `status === 'ACTIVE'`.

1. Giới hạn invitation tổ chức bằng loại entity rõ ràng, không nhận chuỗi tùy ý.
2. Khi accept, yêu cầu người dùng đã đăng nhập hoặc lưu trạng thái chờ gắn tài khoản sau đăng ký.
3. Trong cùng transaction:
   - Khóa invitation để chống accept lặp.
   - Kiểm tra email, hạn dùng và tổ chức còn hoạt động.
   - Upsert `organization_members` với role hợp lệ.
   - Đánh dấu invitation `ACCEPTED`.
   - Ghi audit log.
4. Không cho invitation gán `OWNER`; chỉ cho `ADMIN` hoặc `MEMBER`.
5. Sau accept, refresh access profile/session và cho phép switch vào tổ chức mới.
6. Bổ sung E2E: accept thành công, token dùng lại, sai email, hết hạn, org đã xóa, role vượt quyền và tenant isolation.

Tiêu chí hoàn tất: người nhận xuất hiện trong `organization_members`, thấy tổ chức trong API list và truy cập được tài nguyên đúng role.

### P1 - Hoàn thiện Preferences end-to-end

Phạm vi: language, theme, timezone, notification settings, reset preferences.

1. Chuẩn hóa DTO bằng enum/allow-list cho theme, locale và timezone IANA.
2. Thêm `DELETE /users/me/preferences` hoặc `POST /users/me/preferences/reset`.
3. Web:
   - Đồng bộ `next-themes` bằng `setTheme`.
   - Thêm i18n provider, catalog `en`/`vi` và đổi locale theo preference.
   - Format ngày giờ bằng timezone đã chọn.
4. Mobile:
   - Hợp nhất API preference với `ThemeStore`.
   - Thêm localization delegate và timezone-aware formatting.
   - Thêm điều khiển email/push.
5. Notification/mail dispatch phải đọc preference trước khi enqueue/gửi, đồng thời định nghĩa rõ notification bắt buộc không thể tắt.
6. Thêm unit test mapper/validation và E2E lưu, reload, reset, áp theme/language/timezone.

Tiêu chí hoàn tất: thay đổi preference có hiệu lực ngay, tồn tại qua đăng nhập lại và reset trở về mặc định.

### P1 - Hoàn thiện quản lý Organization

Phạm vi: leave, view detail, manage organization.

Trạng thái: backend hoàn tất (mục 1-4 dưới đây); UI Web/Admin/Mobile (mục 5) chưa làm.

1. ✅ Đã thêm API:
   - `GET /organizations/:id`
   - `PATCH /organizations/:id`
   - `DELETE /organizations/:id`
   - `GET /organizations/:id/members`
   - `PATCH /organizations/:id/members/:userId`
   - `DELETE /organizations/:id/members/:userId`
   - `POST /organizations/:id/leave`
2. ✅ Đã có policy OWNER/ADMIN/MEMBER riêng tại `packages/api-identity/src/modules/organizations/domain/organization-access.policy.ts` (`assertOrganizationRole`, `assertCanManageTargetRole`, `assertNotLastOwner`) — mọi endpoint đều kiểm tra membership/role thật trong `organization_members`, không chỉ permission RBAC chung.
3. ✅ Owner cuối cùng không được rời hoặc bị hạ quyền/xóa (`ORGANIZATION_LAST_OWNER`); transfer ownership thực hiện qua `PATCH .../members/:userId` với `role: OWNER` trước khi owner cũ leave/bị xóa.
4. Đã xác minh không cần xử lý thêm: `AccessProfileCache` (`access-profile.cache.ts`) chỉ cache profile khi tra cứu không kèm `organizationId`; mọi tra cứu access-profile theo tổ chức cụ thể luôn tính lại trực tiếp từ DB, nên không có cache cũ cần vô hiệu hóa khi đổi role/membership.
5. ❌ Chưa làm: màn hình Web/Admin/Mobile cho chi tiết tổ chức, danh sách thành viên, đổi role, leave/delete.
6. ✅ Đã có E2E (`apps/api/test/organization-management.e2e.spec.ts`): toàn bộ lifecycle owner/admin/member, chặn owner cuối cùng rời/bị xóa/bị hạ quyền, admin không được quản lý admin/owner khác, non-member bị 403. Chưa có test concurrent update.

### P1 - Bổ sung 2FA và OTP — ✅ Backend hoàn tất

Phạm vi: 2FA, OTP.

1. ✅ TOTP RFC 6238 hand-rolled bằng `node:crypto` (HMAC-SHA1), không thêm dependency mới — `packages/api-identity/src/modules/mfa/domain/totp.ts`, đã verify khớp test vector chuẩn RFC 6238/4226. Không làm OTP email riêng vì TOTP đáp ứng đủ yêu cầu MFA.
2. ✅ Bảng `user_two_factor_secrets` (ciphertext/iv/authTag AES-256-GCM), `user_recovery_codes` (hash sha256), `mfa_challenges` (tokenHash, attempts, expiresAt, TTL 5 phút) — `packages/api-database/src/schema/identity/two-factor.ts`, migration `drizzle/0010_two_factor_auth.sql`.
3. ✅ API: `POST auth/mfa/setup`, `POST auth/mfa/confirm`, `GET auth/mfa/status`, `POST auth/mfa/disable`, `POST auth/mfa/recovery-codes/regenerate`, `POST auth/mfa/verify-challenge` (public, dùng challenge token).
4. ✅ Login bước một (`POST auth/login`) trả `{ mfaRequired: true, mfaToken }` khi user đã bật 2FA, không phát hành access/refresh token; bước hai xác minh code (TOTP hoặc recovery code) qua `verify-challenge` mới phát hành session đầy đủ (`IssueSessionUseCase` dùng chung giữa login thường và sau-challenge).
5. ✅ Secret mã hóa bằng `MFA_ENCRYPTION_KEY` (32-byte hex, ngoài database, validate ở `env.schema.ts`); mọi thao tác (`mfa.enabled`, `mfa.disabled`, `mfa.recovery_codes_regenerated`, `mfa.challenge.succeeded/failed`) đều có audit log; challenge giới hạn 5 lần thử sai trước khi bị khóa (`MFA_TOO_MANY_ATTEMPTS`).
6. ✅ Unit test cho TOTP/encryption/verifier/use-cases và E2E đầy đủ lifecycle (`apps/api/test/mfa.e2e.spec.ts`: setup → confirm sai/đúng code → login phát challenge → verify-challenge sai/đúng/replay → recovery code dùng một lần → regenerate → disable → login lại không cần challenge).
7. ❌ Chưa làm: UI Web/Mobile cho setup/confirm/disable/recovery codes (chỉ có backend + contract; FE chưa nối).

### P1 - Bổ sung SSO Google/Apple — ✅ Backend hoàn tất

Phạm vi: Login SSO, Logout SSO.

1. ✅ OAuth 2.0/OIDC Authorization Code + PKCE (S256), state/nonce một lần dùng lưu hash trong bảng `sso_login_states` (TTL 10 phút), redirect_uri callback cố định theo provider (`packages/api-identity/src/modules/sso/`).
2. ✅ Bảng `external_identities` (provider, provider_subject, userId, email, unique theo provider+subject) — migration `drizzle/0011_sso_external_identities.sql`.
3. ✅ Callback verify đầy đủ: state hash + TTL, JWKS thật của Google/Apple (RS256, hand-rolled bằng `node:crypto`, không thêm dependency), kiểm `iss`/`aud`/`exp`/`nonce`; Apple `client_secret` tự build dạng JWT ES256 ký bằng private key của developer (`domain/apple-client-secret.ts`).
4. ✅ Account-linking policy (`domain/account-linking.policy.ts`): chỉ tự link vào tài khoản cũ khi email tài khoản đó **đã verify**; nếu chưa verify thì trả `SSO_EMAIL_CONFLICT` (409) thay vì âm thầm chiếm quyền — đúng yêu cầu "tránh takeover khi email trùng".
5. ✅ Tài khoản mới qua SSO được cấp role `USER` mặc định + tổ chức cá nhân (giống `RegisterUseCase`), phát hành session nội bộ qua `IssueSessionUseCase` dùng chung với login mật khẩu và luồng MFA. Token trả về qua URL fragment (không qua query string/log).
6. 🟡 Logout vẫn chỉ revoke session nội bộ; chưa gọi provider revocation/end-session (chấp nhận được vì không bắt buộc, nhưng chưa làm).
7. ❌ Chưa làm: nút Google/Apple trên Web/Mobile. ✅ Đã có E2E với provider mock (`apps/api/test/sso.e2e.spec.ts`, dùng provider "fake" — bật qua `SSO_FAKE_PROVIDER_ENABLED`, tự chặn khi `APP_ENV=production`): signup mới, link theo email đã verify, chặn replay state/code, chặn conflict email chưa verify.

### P2 - Hoàn thiện Audit

Phạm vi: export, retention/delete, search, detail.

1. ✅ Đã thêm `GET /admin/audit-logs/:id`. Còn thiếu: drawer chi tiết trên UI.
2. ✅ Đã thêm `q` (ILIKE action/entityType/requestId) dùng chung giữa list và export qua `buildAuditLogFilters`.
3. ✅ Đã thêm `POST /admin/audit-logs/export` (CSV, giới hạn 5000 dòng, lưu qua object storage + `files`, tự audit lại thao tác export).
4. ✅ Không cho xóa tùy ý; đã thêm `AUDIT_RETENTION_DAYS` + job purge hàng ngày (`AuditRetentionService`/`PurgeExpiredAuditLogsUseCase`), tự audit lại khi có xóa.
5. ❌ Chưa làm: mở đầy đủ filter date/actor/resource trên UI Web (vẫn hiển thị một phần).
6. ✅ Unit test cho export/purge use case (`export-audit-logs.use-case.spec.ts`, `purge-expired-audit-logs.use-case.spec.ts`) + E2E search/export/quyền truy cập (`apps/api/test/audit.e2e.spec.ts`). Lưu ý kiến trúc: `audit_logs.organizationId` là nullable (platform-wide), nên "theo tenant" áp dụng ở file export (scoped theo org actor), không phải ở chính dòng audit log.

### P2 - Xây File catalog, batch và versioning

Phạm vi: details UI, batch, search, versions, history.

1. ✅ `GET /files` với pagination, search theo `originalName`, lọc MIME/uploader/khoảng ngày, sort. Còn thiếu lọc theo "trạng thái" (xóa/active) trên query — repository hỗ trợ `includeDeleted` nhưng controller chưa expose.
2. ❌ Chưa làm: file browser và trang/drawer chi tiết trên Web/Admin.
3. ✅ Bảng `file_versions` riêng (immutable), `files` giữ vai trò con trỏ bản hiện tại (`checksum`, `latestVersion`).
4. ✅ Mỗi version giữ `checksum` (sha-256), `sizeBytes`, `storageKey`, `createdById`, `createdAt` riêng, không ghi đè version cũ.
5. ✅ `GET /files/:id/history` hợp nhất version event và audit event, sort theo thời gian.
6. ✅ `POST /files/batch-delete`: giới hạn 100 file/lần, `idempotencyKey` (unique theo actor, lưu `file_batch_operations`), trả kết quả từng item kèm lỗi nếu có.
7. ✅ Index `organization_id` (có sẵn), thêm `mime_type`/`created_at` trên `files`, `organization_id` trên `file_versions`/`file_batch_operations`; mọi repository method đều lọc theo `organizationId` của actor, đồng thời `file_versions`/`file_batch_operations` có RLS tenant-isolation riêng giống `files`.
8. 🟡 Đã có test version upload + checksum đổi, batch partial failure, idempotency replay, tenant isolation cho catalog/list (`apps/api/test/files-catalog.e2e.spec.ts` + unit test cho `CreateFileVersionUseCase`/`BatchDeleteFilesUseCase`). Chưa có: virus-scan hook, version restore, xóa blob theo retention (ngoài phạm vi đã làm).

### P2 - Bổ sung Job observability

Phạm vi: details, logs, metrics, dependencies.

1. ✅ Đã thêm `GET /admin/jobs/:id`.
2. ✅ Bảng `job_attempts` (start/end/duration/lỗi mỗi lần thử) và `job_events` (timeline có cấu trúc) đã thêm; metadata được `redactSensitive` trước khi lưu, không có secret thô từ payload.
3. ✅ `GET /admin/jobs/:id/logs` phân trang theo `job_events`. Chưa có UI detail/timeline.
4. ✅ `GET /admin/jobs/metrics`: status/type counts, `averageDurationMs`, `retryRate`, `failureRate`, lọc `from`/`to`. Throughput (rate theo thời gian) chưa có, chỉ có tổng số.
5. ✅ Bảng `job_dependencies` (`job_id`/`depends_on_job_id`), ngăn cycle bằng recursive CTE, `claimDueJobs` chỉ claim khi mọi prerequisite `COMPLETED`.
6. 🟡 Backend cancel đã đúng từ trước (chỉ hủy `PENDING`); UI Web cho chọn `PROCESSING` vẫn chưa sửa (ngoài phạm vi backend của lượt này).
7. ✅ Test: claimed/completed event, no-handler failure, retry-scheduled vs exhausted-failure, cancel event, dependency block + cycle prevention, metrics aggregation (`apps/api/test/job-observability.e2e.spec.ts`, 6 test) + unit test cho `AddJobDependencyUseCase`/`GetJobMetricsUseCase`. Chưa có test concurrent-claim chuyên biệt (đã có sẵn `FOR UPDATE SKIP LOCKED` nhưng chưa test race trực tiếp).

### P2 - Hoàn thiện Mail workspace

Phạm vi: send mail, template catalog.

1. ✅ Đã thêm `GET /admin/mail/templates` trả key, cờ `mandatory`, cờ `sendable` và danh sách biến `{{var}}` quét trực tiếp từ file template (chưa có mô tả tự do cho từng template).
2. ✅ Preview (`GET /admin/mail/preview/:templateKey`) nhận biến tùy chỉnh qua query `variables` (JSON string, validate `@IsObject`) và trả `missingVariables` (biến template tham chiếu nhưng không có giá trị supplied/default).
3. ✅ `POST /admin/mail/send` với permission riêng (`mail:create`, role `ADMIN` được cấp thêm `CREATE` ngoài `READ`), allow-list template (chặn `mandatory` template — `auth.verify-email`/`auth.reset-password` — vì mang token bảo mật), throttle 10 request/phút và ghi audit log `mail.send_requested`.
4. ✅ Gửi mail qua background job nền `mail.send` (tái dùng `JobsService`/`JobHandlersRegistry` có sẵn), hỗ trợ `idempotencyKey` (replay trả lại job cũ, không enqueue trùng) và trạng thái delivery xem qua `GET /admin/mail/deliveries`.
5. Không cho nhập subject/body HTML tùy ý nếu chưa có sanitizer và chính sách chống lạm dụng — giữ nguyên: endpoint chỉ nhận `templateKey` + biến, không nhận HTML tự do.
6. Thêm UI catalog, preview desktop/mobile và delivery detail (vẫn chưa làm — chỉ có API).
7. ✅ Test: rejection mandatory-template/thiếu biến, idempotency replay, gửi thành công + job hoàn tất + delivery record (`apps/api/test/mail-workspace.e2e.spec.ts`, 5 test) + unit test cho `SendAdminMailUseCase` (4 test, bao gồm reject mandatory/unknown template, reject thiếu biến, enqueue + audit thành công).

### Phát hiện thêm trong lúc xác minh E2E (chưa sửa, cần theo dõi riêng)

- `CreateAdminUserUseCase` (`packages/api-identity/src/modules/users/application/use-cases/create-admin-user.use-case.ts`): khi actor không phải `SUPER_ADMIN`, `roleName` bị âm thầm hạ về `USER` nếu actor request `role: 'ADMIN'`, thay vì từ chối với 403. Test `auth-projects-notifications.e2e.spec.ts` ("defaults new users to USER and prevents admins from managing privileged accounts") kỳ vọng 403 nhưng nhận 201 — cần quyết định rõ hành vi đúng (từ chối tường minh hay hạ quyền âm thầm) rồi đồng bộ lại test.
- Cùng file test trên: assertion `.expect(200)` cho `POST /organizations` ("accepts organization invitations...") sai — endpoint này (giống mọi `@Post()` khác trong codebase) trả `201 Created`, không phải `200`.
- `tenant-isolation.e2e.spec.ts` ("prevents an org-scoped ADMIN from reading another organization project"): user dựng cho test không nhận được role `ADMIN` như kỳ vọng (`roles` rỗng) — có thể cùng nguồn gốc với bug hạ quyền ở trên.
- Các mục này thuộc `auth-projects-notifications.e2e.spec.ts`/`tenant-isolation.e2e.spec.ts`, là WIP có sẵn trên branch (không phải do phần Organization management mới thêm), chỉ lộ ra sau khi sửa 2 bug chặn E2E (cổng `DATABASE_URL_TEST_ADMIN` và `emailVerifiedAt`) nêu ở mục P0.
- `pnpm exec turbo boundaries` báo 5 vi phạm có sẵn (không liên quan Mail/Files/Jobs/Audit): `packages/api-workspace/src/modules/invitations/` import trực tiếp `OrganizationsRepository`, `AccessControlService`, `OrganizationsModule`, `AccessControlModule` từ `packages/api-identity/src/modules/...` bằng đường dẫn tương đối xuyên package (`../../../../api-identity/...`), vi phạm ranh giới package. Cần expose qua `@repo/api-identity`'s public `index.ts`/port thay vì import đường dẫn nội bộ — chưa sửa trong lượt này vì thuộc phạm vi Invitations/Organization management, không phải Mail.

## 5. Thứ tự triển khai đề xuất

1. Sửa `Join organization` vì hành vi hiện tại có thể báo accept thành công nhưng không cấp membership.
2. Hoàn thiện Organization management và vô hiệu hóa access cache đúng lúc.
3. Đồng bộ Preferences thực tế trên Web/Mobile.
4. ✅ 2FA và SSO Google/Apple backend đã triển khai (xem các mục P1 tương ứng); cả hai còn thiếu UI Web/Mobile.
5. ✅ Audit export/retention/search backend đã triển khai (xem mục P2 Audit); còn thiếu drawer chi tiết và mở đầy đủ filter trên UI Web.
6. ✅ File catalog/search/versioning/batch-delete backend đã triển khai (xem mục P2 Files); còn thiếu file browser/UI chi tiết trên Web/Admin.
7. ✅ Job observability (logs/metrics/dependencies) đã triển khai (xem mục P2 Job observability), kèm sửa một bug retry/tenant-context có sẵn nghiêm trọng; còn thiếu UI timeline/metrics chart và sửa UI cancel.
8. ✅ Mail template catalog và send workflow backend đã triển khai (xem mục P2 Mail); còn thiếu UI catalog/send/delivery detail trên Web/Admin.

## 6. Các tệp bằng chứng chính

- `apps/api/openapi.json`
- `packages/api-core/src/common/rbac/`
- `packages/api-identity/src/modules/auth/`
- `packages/api-identity/src/modules/mfa/`
- `packages/api-identity/src/modules/sso/`
- `packages/api-identity/src/modules/access-control/`
- `packages/api-identity/src/modules/organizations/`
- `packages/api-identity/src/modules/preferences/`
- `packages/api-identity/src/modules/users/`
- `packages/api-platform/src/modules/audit/`
- `packages/api-platform/src/modules/files/`
- `packages/api-platform/src/modules/jobs/`
- `packages/api-platform/src/modules/mail/`
- `packages/api-database/src/schema/platform/files.ts`, `file-versions.ts`, `file-batch-operations.ts`
- `apps/api/drizzle/0012_file_versions_and_batch.sql`
- `packages/api-database/src/schema/platform/job-attempts.ts`, `job-events.ts`, `job-dependencies.ts`
- `apps/api/drizzle/0013_job_observability.sql`
- `packages/api-platform/src/modules/jobs/infrastructure/job-observability.repository.ts`
- `apps/api/test/job-observability.e2e.spec.ts`
- `packages/api-platform/src/modules/mail/application/use-cases/send-admin-mail.use-case.ts`
- `apps/api/test/mail-workspace.e2e.spec.ts`
- `apps/api/test/support/test-app.ts` (`abortOnError: false`)
- `packages/api-workspace/src/modules/invitations/`
- `apps/web/src/app/`
- `apps/web/src/app/(public)/login/page.tsx`, `apps/web/src/app/api/auth/login/route.ts`
- `apps/admin/src/app/`
- `apps/admin/src/app/(public)/login/page.tsx`, `apps/admin/src/app/api/auth/login/route.ts`
- `apps/mobile/lib/features/`
