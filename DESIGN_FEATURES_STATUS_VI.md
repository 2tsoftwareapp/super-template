# Báo cáo trạng thái các tính năng trong `DESIGN_FEATURES.md`

Ngày đánh giá: 22/06/2026

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
| ✅ Hoàn chỉnh | 42 |
| 🟡 Một phần | 12 |
| ⚠️ Chưa đúng | 1 |
| ❌ Chưa có | 15 |

## 2. Kết quả kiểm chứng kỹ thuật

- `pnpm test`: đạt 154/154 kiểm thử đơn vị.
  - API: 109 kiểm thử.
  - Web: 13 kiểm thử.
  - Admin: 32 kiểm thử.
- `pnpm typecheck`: đạt 15/15 tác vụ.
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
| 2FA | ❌ | Không có secret TOTP, recovery code, challenge hoặc API bật/tắt 2FA. |
| Me: xem/cập nhật profile | ✅ | Có `GET/PATCH /users/me`, upload avatar và UI Web/Mobile. |
| Login SSO Google/Apple | ❌ | Không có OAuth/OIDC provider, callback, account linking hoặc nút đăng nhập SSO. |
| Logout SSO | ❌ | Không có phiên đăng nhập liên kết với provider để thực hiện logout/revoke phía provider. |
| OTP | ❌ | Chỉ có component nhập OTP chưa được nối với backend; không có challenge hoặc dữ liệu OTP. |

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
| Join organization | ⚠️ | Invitation có thể chuyển sang `ACCEPTED` nhưng `AcceptInvitationUseCase` không tạo `organization_members`; người nhận chưa thực sự gia nhập tổ chức. |
| Leave organization | ❌ | Không có API/use case rời tổ chức hoặc quy tắc chuyển ownership. |
| View organization | 🟡 | Có danh sách tổ chức và thông tin tóm tắt; chưa có `GET /organizations/:id` hay màn hình chi tiết. |
| Manage organization | ❌ | Chưa có cập nhật tên/slug, quản lý thành viên, đổi role thành viên, xóa/khôi phục tổ chức hoặc UI quản trị. |

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
| Export audit logs | ❌ | Chưa có export use case, API hoặc file kết quả dành riêng cho audit. |
| Delete audit log | ❌ | Chưa có API/chính sách retention. Đây nên là purge theo retention thay vì xóa tùy ý. |
| Search audit logs | 🟡 | Có bộ lọc chính xác theo actor/action/resource/date, chưa có tìm kiếm tự do hoặc tìm trong metadata/request ID. |
| Sort audit logs | ✅ | Có sắp xếp theo thời gian tăng/giảm. |
| Filter audit logs | ✅ | Backend hỗ trợ actor, action, resource type/ID, khoảng thời gian; Web hiện mới hiển thị một phần bộ lọc. |
| View audit log details | 🟡 | DTO có metadata, IP, user-agent, request ID nhưng UI bảng không có drawer/trang chi tiết. |

### 3.6. Files

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| Upload files | ✅ | Multipart upload, policy kích thước/loại file, storage adapter và Web/Mobile client. |
| Download files | ✅ | Stream download, content disposition an toàn và Mobile repository. |
| Delete files | ✅ | Soft delete, kiểm tra quyền và xóa object storage. |
| View file details | 🟡 | Có `GET /files/:id` nhưng chưa có file browser hoặc màn hình chi tiết độc lập. |
| Sign URLs | ✅ | Có `GET /files/:id/url`, token hết hạn và storage adapter. |
| Batch file operations | ❌ | Không có API bulk download/delete/move/tag. |
| Search files | ❌ | Không có endpoint list/search file. |
| View file versions | ❌ | Schema chỉ lưu một bản ghi file, không có version/revision. |
| View file history | ❌ | Không có bảng event/version history hay UI lịch sử file. |

### 3.7. Jobs

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| Background jobs | ✅ | Có scheduler, claim bằng `FOR UPDATE SKIP LOCKED`, retry, idempotency và handler registry. |
| List jobs | ✅ | API phân trang/lọc theo status/type và UI Admin/Mobile. |
| View job details | 🟡 | List DTO chứa payload/error/timestamps, nhưng không có `GET /admin/jobs/:id` và UI chi tiết. |
| Cancel job | ✅ | Có API và UI; repository chỉ hủy job `PENDING`, phù hợp an toàn nhưng UI vẫn cho chọn `PROCESSING` ở Web. |
| View job logs | ❌ | Không có bảng log/attempt event gắn với job. |
| View job metrics | 🟡 | Admin chỉ đếm trạng thái của tối đa 50 bản ghi đang tải, không phải metric toàn hệ thống hoặc time-series. |
| View job dependencies | ❌ | Không có dependency graph, parent/child hoặc prerequisite. |
| View job status | ✅ | Có trạng thái và các mốc thời gian trong DTO/UI. |

### 3.8. Mail

| Tính năng | Trạng thái | Bằng chứng và nhận xét |
|---|---|---|
| Send mail | 🟡 | Có SMTP service, template renderer, delivery record và job handler; chưa có API/UI gửi mail có kiểm soát cho admin. |
| View mail | ✅ | Có API delivery history và UI Admin/Mobile. |
| View mail templates | 🟡 | Có preview theo `templateKey`, nhưng không có API liệt kê template, metadata biến đầu vào hoặc UI duyệt catalog. |

## 4. Các vấn đề cần ưu tiên

### P0 - Sửa hành vi sai của Join organization

Phạm vi: `Join organization`.

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

1. Thêm API:
   - `GET /organizations/:id`
   - `PATCH /organizations/:id`
   - `DELETE /organizations/:id`
   - `GET /organizations/:id/members`
   - `PATCH /organizations/:id/members/:userId`
   - `DELETE /organizations/:id/members/:userId`
   - `POST /organizations/:id/leave`
2. Xây policy OWNER/ADMIN/MEMBER riêng, không dùng permission chung mà thiếu kiểm tra membership.
3. Quy định owner cuối cùng không được rời; hỗ trợ transfer ownership trước khi leave/delete.
4. Vô hiệu hóa session/access cache khi membership hoặc role thay đổi.
5. Thêm màn hình Web/Admin/Mobile: chi tiết, thành viên, invitation, đổi role, leave/delete.
6. Thêm E2E đầy đủ cho quyền, concurrent update, tenant isolation và soft delete.

### P1 - Bổ sung 2FA và OTP

Phạm vi: 2FA, OTP.

1. Chọn TOTP chuẩn RFC 6238 làm 2FA chính; OTP email chỉ dùng cho recovery hoặc passwordless nếu có yêu cầu rõ.
2. Thêm bảng encrypted TOTP secret, recovery code đã hash và challenge có TTL/số lần thử.
3. Thêm API setup, confirm, challenge, disable, regenerate recovery codes.
4. Login bước một chỉ phát hành challenge tạm; access/refresh token chỉ phát hành sau khi xác minh bước hai.
5. Mã hóa secret bằng key quản lý ngoài database; rate limit và audit toàn bộ thao tác.
6. Thêm UI Web/Mobile và E2E cho setup, login, recovery, replay, expiry và account lockout.

### P1 - Bổ sung SSO Google/Apple

Phạm vi: Login SSO, Logout SSO.

1. Dùng OAuth 2.0/OIDC Authorization Code + PKCE.
2. Thêm bảng `external_identities` với provider, subject, user ID và metadata tối thiểu.
3. Thêm callback có kiểm tra state, nonce, issuer, audience và email verification.
4. Xây policy account linking để tránh takeover khi email trùng.
5. Phát hành session nội bộ giống login mật khẩu; logout luôn revoke session nội bộ.
6. Chỉ gọi provider revocation/end-session khi provider hỗ trợ và sản phẩm thực sự cần.
7. Thêm nút Google/Apple cho Web/Mobile, cấu hình redirect riêng từng môi trường và E2E với provider mock.

### P2 - Hoàn thiện Audit

Phạm vi: export, retention/delete, search, detail.

1. Thêm `GET /admin/audit-logs/:id` và drawer chi tiết hiển thị metadata đã redacted, IP, user-agent, request ID.
2. Thêm `q` để tìm action/entity/request ID; nếu cần tìm metadata lớn, dùng PostgreSQL GIN/trigram có giới hạn.
3. Dùng module export hiện có để tạo CSV/JSON bất đồng bộ, lưu file và audit lại thao tác export.
4. Không cung cấp delete tùy ý. Thêm retention policy và job purge theo khoảng thời gian, quyền riêng và audit bất biến.
5. Mở đầy đủ filter date/actor/resource trên UI.
6. Thêm test export theo tenant, redaction, retention và quyền truy cập.

### P2 - Xây File catalog, batch và versioning

Phạm vi: details UI, batch, search, versions, history.

1. Thêm `GET /files` với pagination, search tên, MIME, uploader, ngày tạo và trạng thái.
2. Thêm file browser và trang/drawer chi tiết.
3. Thêm bảng `file_versions` hoặc tách logical file và immutable blob version.
4. Mọi upload phiên bản mới phải giữ checksum, size, storage key, creator và timestamp.
5. Thêm history từ version event và audit event.
6. Thêm batch endpoint có giới hạn số lượng, idempotency và kết quả từng item.
7. Index `organization_id`, normalized filename, MIME, created_at; kiểm tra tenant trên mọi thao tác.
8. Thêm test virus-scan hook, signed URL expiry, version restore, batch partial failure và xóa blob theo retention.

### P2 - Bổ sung Job observability

Phạm vi: details, logs, metrics, dependencies.

1. Thêm `GET /admin/jobs/:id`.
2. Thêm bảng `job_attempts` và `job_events` để lưu start/end/error/retry có cấu trúc; không lưu secret từ payload.
3. Thêm endpoint logs phân trang và UI detail có timeline.
4. Thêm metric query tổng hợp theo status/type/time range, latency, throughput, retry/failure rate.
5. Thêm `parent_job_id` hoặc bảng `job_dependencies`; ngăn cycle và chỉ claim job khi prerequisite hoàn tất.
6. Sửa UI cancel để chỉ cho phép hủy trạng thái backend hỗ trợ, hoặc xây cooperative cancellation cho job đang chạy.
7. Thêm test concurrent claim, retry exhaustion, cancellation race, dependency cycle và metric accuracy.

### P2 - Hoàn thiện Mail workspace

Phạm vi: send mail, template catalog.

1. Thêm `GET /admin/mail/templates` trả key, mô tả và danh sách biến bắt buộc.
2. Thêm preview bằng payload biến có validation, không chỉ nhập key thủ công.
3. Nếu cần gửi thủ công, thêm `POST /admin/mail/send` với permission riêng, allow-list template, rate limit và audit.
4. Gửi mail qua background job, idempotency key và trạng thái delivery.
5. Không cho nhập subject/body HTML tùy ý nếu chưa có sanitizer và chính sách chống lạm dụng.
6. Thêm UI catalog, preview desktop/mobile và delivery detail.
7. Thêm test template thiếu biến, SMTP failure, retry, duplicate idempotency và permission.

## 5. Thứ tự triển khai đề xuất

1. Sửa `Join organization` vì hành vi hiện tại có thể báo accept thành công nhưng không cấp membership.
2. Hoàn thiện Organization management và vô hiệu hóa access cache đúng lúc.
3. Đồng bộ Preferences thực tế trên Web/Mobile.
4. Triển khai 2FA trước, sau đó SSO.
5. Bổ sung Audit detail/export/retention.
6. Xây File catalog/versioning.
7. Bổ sung Job observability.
8. Hoàn thiện Mail template catalog và send workflow.

## 6. Các tệp bằng chứng chính

- `apps/api/openapi.json`
- `packages/api-core/src/common/rbac/`
- `packages/api-identity/src/modules/auth/`
- `packages/api-identity/src/modules/access-control/`
- `packages/api-identity/src/modules/organizations/`
- `packages/api-identity/src/modules/preferences/`
- `packages/api-identity/src/modules/users/`
- `packages/api-platform/src/modules/audit/`
- `packages/api-platform/src/modules/files/`
- `packages/api-platform/src/modules/jobs/`
- `packages/api-platform/src/modules/mail/`
- `packages/api-workspace/src/modules/invitations/`
- `apps/web/src/app/`
- `apps/admin/src/app/`
- `apps/mobile/lib/features/`

