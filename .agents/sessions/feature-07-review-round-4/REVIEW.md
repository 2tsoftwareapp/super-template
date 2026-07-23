# Review: Feature 07 — Background Jobs (Round 4)

## Executive summary (80/20)

- **Recommendation:** `Blocked`
- **Build blocker:** `JobsRepositoryPort` yêu cầu scope cho `markBlocked`/`listDependents`, nhưng implementation và các call site trong commit vẫn dùng signature cũ; tuyên bố `typecheck clean` không phù hợp với source tại baseline `bbd9974`.
- **Top findings:** Worker fencing vẫn đóng attempt trước khi transition được fence; mail và notification chỉ chống duplicate một phần nhưng làm sai retry/job outcome; dependency propagation chưa transitive cho cancel/stale recovery và error isolation trong cùng PostgreSQL transaction không thực sự cô lập lỗi.
- **Verification status:** Static review hoàn tất trên đúng commit `bbd997477cbe5490659e9b343bc6c1b3598f8e2c`. Không có CI status/workflow run; commit không thêm hoặc sửa test file.
- **Next action:** Quay lại `planning`/`execution`, sửa H-001 → H-005, bổ sung concurrency/crash-window/PostgreSQL E2E rồi review round 5.

## Developer overview

- **Recommendation:** `Blocked`
- **Finding counts:**
  - Critical: 0
  - High: 5
  - Medium: 3
  - Low: 1
  - Info: 1
- **Verification gaps:** Không có `PLAN.md`, `TASKS.md`, `EXECUTION.md` riêng cho round fix này; không có CI status; không có test diff cho fencing, idempotent replay, crash windows hoặc transitive propagation.
- **Next action:** Không chuyển `done`; trước tiên khôi phục compile contract, sau đó sửa semantics của bốn High cũ và chạy full verification.

## Scope reviewed

Review chính xác commit `bbd997477cbe5490659e9b343bc6c1b3598f8e2c` so với parent `138bd89d2d2ec76b28492a56424f0f92ed357b18`, tập trung vào:

- H-001 worker fencing và attempt/event consistency.
- H-002 notification background-job idempotency.
- H-003 mail delivery idempotency và retry semantics.
- H-004 dependency failure propagation cho failed/cancel/no-handler/stale recovery và graph nhiều tầng.
- Migration/schema/port wiring liên quan.
- Test, typecheck và CI evidence được commit message tuyên bố.

## Inputs

- `.agents/settings.yaml`
- `.agents/skills/review/SKILL.md`
- `.agents/CODE_COMMENTS.md`
- Round 3 `REVIEW.md` và `OVERVIEW.md`
- Commit diff `bbd997477cbe5490659e9b343bc6c1b3598f8e2c`
- `process-jobs.use-case.ts`
- `cancel-job.use-case.ts`
- `jobs.processor.ts`
- `jobs.repository.port.ts`
- `jobs.repository.ts`
- `job-observability.repository.ts`
- `job-handlers.registry.ts`
- Notification command/use case/repository/schema/migration
- Mail use case/repository/port/schema
- GitHub combined status và workflow runs cho commit
- `PLAN.md`: Not found for this round.
- `TASKS.md`: Not found for this round.
- `EXECUTION.md`: Not found for this round.

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| H-001 | High | Build / Contract integrity / Tenant scope | `jobs.repository.port.ts`; `jobs.repository.ts`; `process-jobs.use-case.ts`; `cancel-job.use-case.ts`; `jobs.processor.ts` | Port yêu cầu `markBlocked(jobId, scope, message, tx)` và `listDependents(jobId, scope, tx)`. Repository vẫn implement `(jobId, message, tx)` và `(jobId, tx)`. Các call site mới cũng truyền theo signature cũ. | `pnpm typecheck` không thể sạch theo source; nếu chỉ sửa call site mà không sửa adapter, runtime sẽ truyền `JobScope` vào vị trí message/executor. Scope enforcement của propagation không tồn tại. | Đồng bộ port + implementation + mọi call site trong một commit; bắt buộc `JobScope`; filter scope trong SQL; trả tenant của dependent; thêm compile gate và cross-tenant negative tests. | High |
| H-002 | High | Concurrency / Worker fencing / Observability | `process-jobs.use-case.ts:94-108,138-167` | No-handler path bỏ qua return của `markFailed`. Failure path gọi `finishAttempt(FAILED)` trước `requeueForRetry`/`markFailed`; khi fence trả `null`, transaction vẫn commit attempt đã đóng. | Stale worker có thể đóng attempt, ghi no-handler event và propagate trong khi job đã thuộc worker/attempt mới. Timeline và metrics mâu thuẫn với job row. | Thực hiện fenced transition trước; chỉ finish attempt, record event và propagate khi transition trả row. Với fence miss, dùng outcome `SUPERSEDED` hoặc không mutate attempt. Test stale worker trên success/retry/fail/no-handler. | High |
| H-003 | High | Mail reliability / Retry semantics / Data integrity | `send-mail-template.use-case.ts:62-99`; `mail-deliveries.repository.ts:26-56`; mail enum/schema | Row `FAILED` được insert trước SMTP. Conflict ở retry trả `null` và use case return success. Nếu SMTP lần đầu lỗi, crash trước send, hoặc crash sau SMTP trước status update, lần retry không gửi lại và job có thể `COMPLETED`. | Email có thể không bao giờ được gửi nhưng job hoàn tất; history có thể `FAILED` với `errorMessage=null`, hoặc `FAILED` dù email đã gửi. Duplicate giảm nhưng delivery correctness bị phá. | Dùng state machine `PENDING/PROCESSING/SENT/FAILED`, claim/fence delivery row; retry được phép tiếp tục `FAILED` hoặc stale `PROCESSING` theo policy. Không coi conflict là success trừ khi row đã `SENT`. Test SMTP failure→retry, crash-before-send và SMTP-success/status-update-failure. | High |
| H-004 | High | Notification idempotent replay / Job outcome | `send-notification.use-case.ts:75-121`; `notifications.repository.ts:26-35`; notification unique index | `sourceBackgroundJobId` được persist và unique index đã có, nhưng `create()` vẫn plain insert. Replay sau khi notification transaction đã commit sẽ ném unique violation thay vì trả existing/no-op success. | Notification không duplicate, nhưng background job retry có thể liên tục fail rồi terminal `FAILED` dù notification/delivery đã được tạo thành công. | Thêm `createIdempotent`/`findBySourceBackgroundJobIdAndUser`; dùng conflict handling trả existing record và không duplicate dispatch. Test crash sau commit trước job completion và concurrent replay. | High |
| H-005 | High | Dependency graph / Liveness / Transaction isolation | `process-jobs.use-case.ts:172-209`; `cancel-job.use-case.ts:61-77`; `jobs.processor.ts:73-126` | BFS transitive chỉ nằm trong handler failure/no-handler. Cancel và stale recovery chỉ block direct dependents. `markBlocked` result bị bỏ qua nhưng event/queue vẫn tiếp tục. SQL error được catch bên trong cùng PostgreSQL transaction nhưng không có savepoint; transaction vẫn ở aborted state và cuối cùng rollback. | Chuỗi `C → B → A` có thể để A `PENDING` khi C bị cancel/stale-failed. False events/propagation có thể xuất hiện khi transition miss. Một dependent lỗi có thể rollback toàn bộ stale recovery batch, trái với claim error isolation. | Tạo shared propagation service dùng cho mọi terminal path, BFS/recursive CTE có scope; kiểm tra return của `markBlocked`; dùng per-edge savepoint hoặc transaction riêng/outbox để isolation thực sự; test cancel/stale/no-handler nhiều tầng và một edge lỗi. | High |
| M-001 | Medium | Atomic observability | `process-jobs.use-case.ts:39-43,77-90` | `claimDueJobs()` commit trước; `startAttempt + claimed event` chạy transaction sau. | Crash window tạo job `PROCESSING` không có attempt/claimed event; stale recovery và metrics thiếu timeline. | Claim + attempt + claimed event trong cùng transaction/CTE hoặc transactional orchestration. | High |
| M-002 | Medium | Stale recovery observability | `jobs.processor.ts:73-126`; `recoverStaleProcessing()` | Stale exhausted job được chuyển `FAILED` và block child, nhưng không finish attempt hiện tại và không ghi failed/stale event cho source job. | Attempt có thể còn `PROCESSING`; operator không thấy nguyên nhân terminal từ event stream. | Return attempt identity hoặc lookup open attempt; close attempt + record `stale_exhausted` atomically với transition. | Medium |
| M-003 | Medium | Verification / Regression coverage | Commit file list; GitHub status/workflow | Commit thay production/schema files nhưng không thay test files. GitHub không có status/workflow run; `20/20 pass` chỉ nằm trong commit message. | Không có evidence cho concurrency, crash windows, migration runtime hay transitive graph; claim typecheck còn mâu thuẫn H-001. | Thêm unit/integration/E2E tests và bắt buộc `pnpm typecheck`, unit, PostgreSQL E2E trong CI. Lưu output vào `EXECUTION.md`. | High |
| L-001 | Low | Operability / Worker identity | `process-jobs.use-case.ts`; `jobs.processor.ts` | Hai module vẫn tạo random `WORKER_ID` độc lập; recovery log không cùng identity với worker claim. | Khó correlate lease, attempt và stale recovery giữa process instances. | Inject shared stable worker identity (pod/host/process UUID) và dùng thống nhất. | High |
| I-001 | Info | Positive coverage | Notification schema/wiring; success-path fencing; direct propagation | Commit đã thêm durable notification source column/index, success completion fence check và direct propagation cho thêm terminal paths. | Giảm một phần duplicate và orphan dependents, nhưng chưa đủ để đóng High findings do các vấn đề trên. | Giữ các phần đúng, hoàn thiện semantics và verification thay vì revert toàn bộ. | High |

## Requirement coverage

| Requirement / Task | Covered by change? | Evidence | Notes |
|---|---|---|---|
| H-001 / T-002: Fence mọi terminal transition | Partial | Success completion kiểm tra `markCompleted`; retry/fail có check transition | No-handler bỏ check; attempt được finish trước fence ở catch path. |
| H-002 / T-008/T-009: Notification durable source identity | Partial | Column, FK, partial unique index và handler→command wiring có | Replay ném unique violation; không idempotent success. |
| H-003 / T-001: Chặn duplicate SMTP | Partial | Durable insert xảy ra trước SMTP | Chặn duplicate bằng cách suppress mọi retry; gây lost mail và sai history. |
| H-004 / T-003: Cancel propagates | Partial | Block direct dependent trong transaction cancel | Không transitive; không check `markBlocked` result; signature scope sai. |
| H-004 / T-004: No-handler propagates | Partial | Gọi BFS propagation | No-handler không fence `markFailed`; propagation contract sai. |
| H-004 / T-005: Stale exhausted propagates | Partial | Block direct dependent sau recovery | Không transitive; lỗi một edge có thể rollback toàn batch; thiếu attempt/event source. |
| H-004 / T-006: Multi-level propagation | Partial | BFS có visited guard trong `ProcessJobsUseCase` | Không dùng chung cho cancel/stale; error isolation không đúng PostgreSQL semantics. |
| T-007: Error isolation | No | try/catch per edge | Không có savepoint/transaction boundary; SQL error aborts transaction. |
| T-010: Typecheck clean | No / contradicted | Port, adapter và call sites khác signature | GitHub không có CI evidence. |
| T-010: Unit tests 20/20 | Needs more verification | Commit message only | Không có test diff hoặc workflow/status. |

## Verification reviewed

| Check | Result | Evidence | Concern |
|---|---|---|---|
| Static TypeScript contract | Fail | H-001 | Main baseline không đạt compile contract. |
| Worker fencing semantics | Fail | H-002 | Stale attempt vẫn bị finish ở retry/fail; no-handler bỏ fence. |
| Mail duplicate prevention | Pass narrowly | Insert-before-SMTP + unique index | Đổi duplicate risk thành lost-delivery/job-history risk. |
| Mail retry correctness | Fail | H-003 | Retry conflict return success, không resend. |
| Notification duplicate prevention | Pass narrowly | Durable column/index | Replay outcome không idempotent. |
| Notification retry/job consistency | Fail | H-004 | Unique violation làm job fail sau side effect đã commit. |
| Dependency direct propagation | Partial pass | Added cancel/no-handler/stale paths | Scope/signature và transition-result issues còn tồn tại. |
| Dependency transitive propagation | Fail for complete requirement | BFS only in one path | Cancel/stale still one level. |
| Error isolation | Fail | Catch inside same transaction without savepoint | PostgreSQL aborted transaction rollback. |
| Migration static review | Pass | Migration 0029 matches schema column/index | Chưa có migration integration evidence. |
| Unit tests | Needs more verification | Self-reported 20/20 | No artifact/log/test diff. |
| CI status/workflow | Missing | GitHub returned no statuses/runs | Không được suy diễn pass. |

## Testing gaps

| Gap | Risk | Suggested follow-up |
|---|---|---|
| Stale worker no-handler/retry/fail | Wrong attempt/event/propagation | Barrier-based unit/integration test where fence returns null. |
| Mail first SMTP failure then retry | Job completes without email | Fake SMTP failure then success; assert second attempt sends and row transitions. |
| Mail crash before SMTP / after SMTP | Lost email or false history | Failure injection around claim/send/status update. |
| Notification crash after DB commit before job completion | Delivered notification but terminal failed job | Replay test must return existing and mark job completed. |
| Concurrent notification replay | Unique violation / duplicate dispatch | Two workers same background job ID; assert one record and successful no-op replay. |
| Cancel graph `C → B → A` | A remains pending | E2E transitive cancel propagation. |
| Stale exhausted graph `C → B → A` | A remains pending | Cron/repository integration test. |
| One propagation edge SQL failure | Whole transaction/batch rollback | Savepoint or per-edge transaction test. |
| Cross-tenant graph corruption | Wrong-tenant block/event | Scope-filter negative tests and migration validation. |
| Typecheck and PostgreSQL migration | Main build/runtime break | Run root typecheck + actual migration on clean DB in CI. |

## Residual risks

| Risk | Impact | Acceptance / mitigation |
|---|---|---|
| SMTP cannot provide true exactly-once | Duplicate vs loss trade-off remains | Explicit delivery policy, provider idempotency where available, durable state machine and operator reconciliation. |
| Worker timeout does not cancel underlying handler | Old handler may finish after lease expires | Fence all state/side effects; handlers need their own idempotency and cancellation/cooperative timeout. |
| Propagation touches many rows in one transaction | Lock duration and batch rollback | Bound BFS, use recursive SQL/outbox, metrics and retry policy. |

## Recommendation

**Blocked**

Commit `bbd9974` không nên được xem là closing commit cho Feature 07 Round 3. Source contract hiện không typecheck, và cả bốn High fixes đều còn correctness gaps đáng kể.

## Handoff

- **Next action/skill:** `planning` → `execution`
- **Owner:** Agent / Developer
- **Blocking status:** Yes — H-001 through H-005
- **Ready for done/PR:** No
- **Review baseline:** `bbd997477cbe5490659e9b343bc6c1b3598f8e2c`
