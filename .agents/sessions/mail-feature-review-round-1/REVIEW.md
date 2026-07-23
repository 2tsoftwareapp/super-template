# Review: Mail feature — Round 1

## Executive summary (80/20)

- **Recommendation:** `Needs fix`
- **Top findings:** Cơ chế idempotency hiện tại vẫn có thể gửi email trùng và lưu sai trạng thái khi SMTP thành công nhưng ghi DB thất bại, hoặc khi lần đầu `FAILED` rồi retry thành công.
- **Security/data risks:** Luồng admin enqueue mail và ghi audit chưa atomic; template HTML nội suy raw; SMTP production chưa bắt buộc TLS và chưa hỗ trợ credentials.
- **Verification status:** Static review đã hoàn tất. Không tìm thấy `PLAN.md`, `TASKS.md`, `EXECUTION.md`, test evidence riêng cho Mail hoặc CI status trên commit hiện tại; full typecheck còn bị chặn bởi mismatch pre-existing của Jobs repository contract.
- **Next action:** Quay lại `planning`/`execution`, ưu tiên H-001 và H-002, sau đó bổ sung unit + integration tests trước review round 2.

## Developer overview

- **Recommendation:** `Needs fix`
- **Finding counts:**
  - Critical: 0
  - High: 2
  - Medium: 4
  - Low: 1
  - Info: 1
- **Verification gaps:** Không có feature session artifacts gốc; không có CI/test output gắn với Mail trên `main`; chưa có bằng chứng SMTP integration và retry concurrency.
- **Next action:** Tạo plan sửa theo thứ tự H-001 → H-002 → M-001/M-002 → M-003/M-004 → L-001, rồi chạy verification độc lập cho Mail và toàn repo.

## Scope reviewed

Review full-stack Mail feature trên trạng thái hiện tại của `main`, bao gồm:

- Backend module composition, controller, DTO và RBAC/throttling.
- Admin enqueue flow, background `mail.send` handler và delivery persistence.
- Template discovery/rendering/preview và user email preference handling.
- SMTP transport configuration.
- Admin frontend API, React Query, controller hook và send form.
- Database schema/index liên quan `mail_deliveries`.
- Interaction boundary với Jobs và Audit modules.

## Inputs

- `.agents/settings.yaml`
- `.agents/PRJ_REFERENCE.md`
- `.agents/skills/review/SKILL.md`
- `.agents/CODE_COMMENTS.md`
- `packages/api-platform/src/modules/mail/**`
- `packages/api-platform/src/modules/jobs/application/services/job-handlers.registry.ts`
- `packages/api-database/src/schema/platform/mail.ts`
- `packages/api-core/src/config/env.schema.ts`
- `apps/admin/src/features/mail/**`
- `apps/admin/src/app/[locale]/(app)/mail/page.tsx`
- Current `main`: `1303089e6c2d8e660d3bc3a5d7e738c240a07c5d`
- Git history liên quan Mail/Jobs và commit verification notes.
- `PLAN.md`: Not found for this feature review session.
- `TASKS.md`: Not found for this feature review session.
- `EXECUTION.md`: Not found for this feature review session.
- CI status trên current commit: không có status/check được GitHub trả về.

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| H-001 | High | Reliability / Idempotency / Data integrity | `send-mail-template.use-case.ts:62-93`; `mail-deliveries.repository.ts:26-36`; `schema/platform/mail.ts:10-30` | SMTP được gọi trước khi insert delivery. Repository dùng `onConflictDoNothing()` và unique `(source_job_id, recipient)`, nhưng use case bỏ qua kết quả `null`. Nếu SMTP thành công rồi DB lỗi, retry sẽ gửi lần nữa. Nếu lần đầu SMTP lỗi và ghi `FAILED`, retry gửi thành công nhưng insert `SENT` conflict, job vẫn có thể hoàn tất trong khi history còn `FAILED`. Hai worker đồng thời cũng có thể gửi trước khi unique index can thiệp. | Gửi email trùng, trạng thái delivery sai, job `COMPLETED` không phản ánh lịch sử thực tế; đặc biệt nguy hiểm với verify/reset links và mail admin. | Thiết kế state machine delivery bền vững: reserve/upsert row trước send bằng source identity; lock/claim row; chuyển `PENDING/PROCESSING → SENT/FAILED`; retry update cùng row. Không dùng insert-after-side-effect làm idempotency barrier. Thêm concurrency và crash-window tests. | High |
| H-002 | High | Audit / Atomicity | `send-admin-mail.use-case.ts:62-84` | `jobsService.enqueue()` chạy trước, sau đó `auditService.log()` chạy riêng. Không có shared transaction. Audit failure xảy ra sau enqueue khiến outbound mail vẫn được xử lý trong khi API báo lỗi và không có audit record. | Privileged action có thể thực thi không được audit; client retry có thể tạo nhiều job nếu không gửi idempotency key. | Dùng một transaction boundary cho job enqueue + audit insert, truyền cùng executor qua ports. Nếu queue architecture tách transaction, dùng transactional outbox/audit event với guarantee tương đương. | High |
| M-001 | Medium | Validation / Correctness | `template-renderer.service.ts:81-88,115-124`; `send-mail-template.use-case.ts:35-60`; `use-mail-send-form.ts:32-71`; `mail.dto.ts:111-134` | Missing-variable check chỉ kiểm tra key tồn tại (`name in variables`), nên `""` vẫn hợp lệ. Renderer thay biến thiếu bằng chuỗi rỗng. UI khởi tạo toàn bộ variables bằng `""` và `formReady` chỉ cần template + recipient. Generic/mandatory send flow không gọi `findMissingVariables`. DTO chỉ dùng `@IsObject`, không validate từng value là string/non-empty. | Email có link xác minh/reset rỗng hoặc nội dung thiếu vẫn được gửi và ghi `SENT`; admin mail có thể queue payload sai kiểu. | Validate required variables ở boundary dùng chung cho mọi send path; reject missing/blank values; runtime-validate record values; UI disable send và hiển thị lỗi từng biến. Test mandatory security templates. | High |
| M-002 | Medium | Security / Content integrity | `template-renderer.service.ts:115-124`; `templates/auth.verify-email.html.txt:34,41,53` | Renderer nội suy raw vào HTML text và `href` bằng regex replacement, không escape theo context và không validate URL scheme/host. | Biến từ payload/admin có thể chèn HTML hoặc phá attribute, tạo phishing/tracking content; URL security email có thể bị thay bằng scheme không an toàn nếu upstream validation sai. | Dùng templating engine auto-escape; tách helper cho HTML text và URL attributes; validate URL bằng allowlist `https`/known origins cho security templates. Thêm injection tests. | High |
| M-003 | Medium | Scope / Multi-tenant consistency | `send-admin-mail.use-case.ts:62-84`; `admin-mail.controller.ts:69-86`; `apps/admin/.../mail/page.tsx:10-13` | Mail là platform admin resource, nhưng job được enqueue với `organizationId: actor.organizationId ?? null`; audit lại dùng `SYSTEM_SCOPE.PLATFORM`. Khi SUPER_ADMIN đang chọn một organization, cùng một action có job org-scoped và audit platform-scoped. | Job visibility, idempotency key, worker tenant context và support diagnostics phụ thuộc organization đang chọn, không phản ánh bản chất platform operation. | Xác định rule rõ: admin mail luôn platform scope hoặc hỗ trợ explicit target scope trong command. Không suy ra scope từ selected session context cho platform action. Test SUPER_ADMIN có/không selected organization. | Medium |
| M-004 | Medium | Transport security / Configuration | `smtp-mailer.service.ts:15-31`; `env.schema.ts:156-160,201-261` | Production SMTP transport cố định `secure: false`, không có `requireTLS`, username/password hoặc certificate policy. Environment validation không enforce mail TLS ở staging/production. | Verify/reset links là bearer secrets có thể đi qua plaintext SMTP khi server không upgrade STARTTLS; template khó tích hợp SMTP provider yêu cầu authentication. | Bổ sung `MAIL_SECURE`, `MAIL_REQUIRE_TLS`, auth credentials và optional CA policy; enforce TLS cho deployed environments; verify transport khi boot và thêm config tests. | Medium |
| L-001 | Low | Observability / Product behavior | `send-mail-template.use-case.ts:35-45`; `schema/platform/mail.ts:17-24` | Khi user opt-out email, use case `return` im lặng. Schema chỉ có `SENT`/`FAILED`, không lưu `SKIPPED/SUPPRESSED`. | Job có thể `COMPLETED` nhưng delivery history không cho biết email đã bị bỏ qua do preference; support/admin dễ hiểu sai. | Thêm trạng thái `SKIPPED`/`SUPPRESSED` với reason hoặc phát event observability tương đương. | High |
| I-001 | Info | Pre-existing base branch / Verification | `jobs.repository.port.ts`; `jobs.repository.ts:210-249,335-346`; `process-jobs.use-case.ts` | Commit `1303089` đổi port thành `markBlocked(jobId, scope, message, tx)` và `listDependents(jobId, scope, tx)`, nhưng implementation và call sites vẫn dùng signature cũ. Current commit không có CI checks/status. Vấn đề này không được Mail feature tạo ra. | Full repository typecheck có khả năng fail, nên không thể dùng current `main` làm verification baseline đáng tin cậy cho review này. | Sửa riêng pre-existing contract mismatch hoặc revert incomplete contract commit trước khi chạy verification Mail round 2. | High |

## Requirement coverage

Do không có `PLAN.md`/`TASKS.md`, các requirement dưới đây được suy ra từ README, API surface và UI hiện tại; không thay thế feature specification chính thức.

| Requirement / Task | Covered by change? | Evidence | Notes |
|---|---|---|---|
| Catalog mail templates | Yes | `ListMailTemplatesUseCase`, `GET /admin/mail/templates` | Có phân biệt mandatory/sendable. |
| Preview template | Partial | `PreviewMailTemplateUseCase`, renderer preview | Broad catch che giấu filesystem/deployment errors; interpolation không an toàn. |
| Manual admin send chỉ cho non-mandatory templates | Yes | `SendAdminMailUseCase:32-46`; `mail.create` permission | Có RBAC + rate limit. |
| Queue mail bằng background job | Yes | `SendAdminMailUseCase:62-75`; `JobHandlersRegistry:54-70` | Scope cần làm rõ. |
| Idempotent retries / at-most-once external send | No | H-001 | Unique row insert sau SMTP không ngăn side effect trùng. |
| Accurate delivery history | Partial | `mail_deliveries`, list endpoint/UI | Retry có thể để history `FAILED` dù mail đã gửi; opt-out không ghi nhận. |
| Audit privileged admin send | Partial | `SendAdminMailUseCase:77-84` | Có audit call nhưng không atomic với enqueue. |
| Respect user email preferences | Partial | `SendMailTemplateUseCase:35-45` | Có suppress non-mandatory mail nhưng thiếu observable outcome. |
| Required template variables validated | No | M-001 | Blank/missing values có thể thành empty strings. |
| Safe HTML rendering | No | M-002 | Raw context-insensitive interpolation. |
| Production SMTP security/configurability | Partial | `SmtpMailerService`, env schema | Không enforce TLS/auth. |
| Frontend architecture and BFF/OpenAPI paths | Yes | `mail.api.ts`, controller/view structure | Phù hợp Route → Screen → Controller → UI và dùng `bffPath`. |

## Verification reviewed

| Check | Result | Evidence | Concern |
|---|---|---|---|
| Static architecture review | Pass with findings | Presentation gọi use cases; ports/adapters nhìn chung tách đúng; frontend có controller/view layers. | MailModule vẫn export concrete `MailService` như cross-module port adapter, có rationale. |
| RBAC / throttling | Pass | `mail.read`, `mail.create`; POST throttle 10/minute. | Không thay thế audit atomicity và transport safety. |
| Retry/idempotency reasoning | Fail | H-001 state-transition analysis + unique index behavior. | Chưa có crash/concurrency tests. |
| Audit atomicity | Fail | H-002; hai side effects không có shared transaction. | Privileged action có audit gap. |
| Input/template security | Fail | M-001, M-002. | Security templates có bearer links. |
| SMTP deployed-environment config | Needs more verification | Transport/env source review. | Không có integration evidence với production SMTP provider. |
| Dedicated Mail tests | Needs more verification | Không tìm thấy session test output hoặc CI artifact cho Mail. | Không được suy diễn là pass. |
| Current commit CI/status | Missing | GitHub returned no combined statuses for `1303089`. | Baseline không được CI chứng minh. |
| Full repository typecheck | Blocked | I-001 port/implementation mismatch. | Pre-existing, không phải Mail regression. |
| Code comment convention | Partial | `MailService` và frontend controller có rationale/flow docs; nhiều exported ports/classes/use cases/DTOs không có TSDoc. | Cần bổ sung theo `.agents/CODE_COMMENTS.md`, nhưng không phải blocker chính trước H/M findings. |

## Testing gaps

| Gap | Risk | Suggested follow-up |
|---|---|---|
| SMTP success + DB failure crash window | Duplicate send on retry | Integration test với fake Mailer và repository failure injection. |
| FAILED first attempt then successful retry | History remains FAILED while job completes | Assert one delivery identity whose state transitions to SENT. |
| Two workers execute same `sourceJobId` concurrently | Duplicate external sends | Barrier-based concurrency test; assert exactly one Mailer call. |
| Enqueue succeeds but audit fails | Un-audited privileged mail | Transaction rollback test covering both rows. |
| Blank/missing variables on mandatory templates | Broken reset/verify email | Unit tests for missing, blank and wrong-type variables. |
| HTML/attribute injection | Phishing/content injection | Escaping tests for text, markup, quotes and URL schemes. |
| User email opt-out | Invisible skipped outcome | Assert SKIPPED record/event and job completion semantics. |
| SUPER_ADMIN selected organization | Wrong job scope | E2E test on platform mail endpoint with org and platform session contexts. |
| SMTP TLS/auth configuration | Plaintext or deployment failure | Env schema tests and SMTP integration/verify test. |
| Admin frontend validation | Empty variables submitted | Controller/form tests for required variable gating and error display. |

## Residual risks

- Even after replacing the delivery state machine, exactly-once email delivery cannot be guaranteed across an arbitrary SMTP boundary without provider-side idempotency; the design must document at-least-once/at-most-once trade-offs and expose delivery identity.
- Existing delivery rows may contain inconsistent `FAILED` state from past retries; migration/reconciliation may be needed.
- Template files remain deployment assets discovered through multiple runtime paths; packaging/build verification should confirm all three parts (`subject/text/html`) are shipped.
- Until I-001 is resolved, whole-repo verification results are not trustworthy.

## Recommendation

**Needs fix**

H-001 and H-002 block production readiness. M-001 and M-002 should be treated as security-adjacent because mandatory account-security emails contain bearer URLs. Do not mark the feature `Ready` before retry state-machine, audit atomicity and negative/concurrency tests are verified.

## Handoff

- **Next action/skill:** `planning` → `execution`
- **Owner:** Agent / Developer
- **Blocking status:** Blocked by H-001 and H-002; full verification also blocked by pre-existing I-001.
- **Suggested first tasks:**
  1. Design durable delivery state machine and idempotency claim protocol.
  2. Make admin enqueue + audit atomic.
  3. Centralize strict variable validation and context-safe rendering.
  4. Define platform-vs-organization scope contract.
  5. Add deployed SMTP TLS/auth configuration.
  6. Add concurrency, crash-window, audit and security-template tests.
