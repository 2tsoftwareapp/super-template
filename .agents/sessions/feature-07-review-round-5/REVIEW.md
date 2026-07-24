# Review: Feature 07 — Background Jobs (Round 5)

## Executive summary (80/20)

- **Recommendation:** `Blocked`
- **Resolved:** Build contract/scope mismatch đã được sửa; worker fencing giờ chỉ finish attempt và ghi event sau khi fenced transition thành công.
- **Blocking findings:** Notification `ON CONFLICT` target không khớp composite unique index; propagation savepoint dùng UUID thô nên lỗi cú pháp và rethrow nên không thật sự isolate; mail retry vẫn không thể claim lại row `FAILED` để gửi lại.
- **Verification status:** Static review trên đúng commit `7a0615a3a47c41f69af419ef215f402e7a4b9e56`. Không có GitHub CI status/workflow run; diff không thay test file và session không có `EXECUTION.md`.
- **Next action:** Sửa H-001 → H-003, bổ sung PostgreSQL integration/crash-window tests, khôi phục semantics `BLOCKED`, rồi review round 6.

## Developer overview

- **Recommendation:** `Blocked`
- **Finding counts:**
  - Critical: 0
  - High: 3
  - Medium: 4
  - Low: 1
  - Info: 1
- **Previous blockers status:**
  - Build blocker: Resolved statically.
  - Round 4 H-002 worker fencing: Resolved statically.
  - Round 4 H-003 mail retry: Still open.
  - Round 4 H-004 notification replay: Still open due conflict-target mismatch.
  - Round 4 H-005 propagation: Still open due savepoint/runtime isolation bugs.
- **Next action:** Không chuyển `done`; cần PostgreSQL-backed verification cho conflict/savepoint/retry paths.

## Scope reviewed

Review commit `7a0615a3a47c41f69af419ef215f402e7a4b9e56` so với parent `e7b620c74a08ea522b6fcf20ed3dcbd51526a3a8`, gồm:

- Scope contract của `markBlocked` và `listDependents`.
- Worker fencing trên success, retry, fail và no-handler.
- Notification background-job idempotent replay.
- Mail delivery retry/idempotency semantics.
- Shared BFS propagation service, savepoint isolation và stale/cancel/no-handler wiring.
- `BLOCKED` lifecycle classification.
- Test/typecheck/CI evidence.

## Inputs

- `.agents/settings.yaml`
- `.agents/skills/review/SKILL.md`
- Round 4 `REVIEW.md` và `OVERVIEW.md`
- Commit diff `7a0615a3a47c41f69af419ef215f402e7a4b9e56`
- `jobs.repository.port.ts`
- `jobs.repository.ts`
- `process-jobs.use-case.ts`
- `cancel-job.use-case.ts`
- `jobs.processor.ts`
- `propagation.service.ts`
- `job-lifecycle.ts` và lifecycle spec
- `drizzle-transaction.service.ts`
- Notification repository/use case/schema/migration
- Mail repository/use case/schema
- GitHub combined status và workflow runs
- Session `PLAN.md`, `TASKS.md`, `OVERVIEW.md`
- `EXECUTION.md`: Not found.

## Findings

| ID | Severity | Category | Location | Evidence | Impact | Recommendation | Confidence |
|---|---|---|---|---|---|---|---|
| H-001 | High | PostgreSQL / Notification idempotency | `notifications.repository.ts:26-42`; `notifications.ts`; migration `0029` | `create()` dùng conflict target chỉ gồm `sourceBackgroundJobId`, nhưng unique partial index là composite `(source_background_job_id, user_id)`. PostgreSQL chỉ infer conflict target khi column set/predicate khớp unique index. | Mọi `notification.send` có `sourceBackgroundJobId` có thể lỗi `no unique or exclusion constraint matching the ON CONFLICT specification`; idempotency path không chạy được, job retry/fail. | Dùng target `[sourceBackgroundJobId, userId]` với cùng predicate, hoặc đổi schema thành unique trên source ID nếu business invariant thật sự là một recipient/job. Lookup existing cũng phải dùng cùng identity. Thêm PostgreSQL integration test thực tế. | High |
| H-002 | High | PostgreSQL / Dependency propagation / Transaction isolation | `propagation.service.ts:39-59`; `drizzle-transaction.service.ts:25-40`; jobs schema UUID | Savepoint name là `propagate_${dep.jobId}`; `dep.jobId` là UUID có dấu `-`, nhưng `sql.raw('SAVEPOINT ...')` không quote/sanitize identifier. Ngoài ra `withSavepoint()` rollback rồi rethrow, còn caller không catch, nên một edge lỗi vẫn làm callback outer transaction throw và rollback parent transition. | Cancel/fail/no-handler/stale propagation có thể lỗi ở dependent đầu tiên; cancellation/markFailed/stale recovery batch bị rollback. “Per-edge error isolation” chưa đạt. | Sinh savepoint name an toàn chỉ gồm `[A-Za-z0-9_]` hoặc dùng counter/hash; wrap từng `withSavepoint` bằng catch ngoài savepoint để log và tiếp tục. Test bằng PostgreSQL thật với UUID và injected edge failure. | High |
| H-003 | High | Mail reliability / Retry state machine | `send-mail-template.use-case.ts:62-105`; `mail-deliveries.repository.ts:26-50` | Lần đầu insert row `FAILED`, SMTP lỗi thì row giữ `FAILED`. Retry insert conflict, lookup thấy không `SENT`, rồi throw — nhưng không có path claim/update row cũ và gọi SMTP lại. Mọi retry sau lặp lại cùng nhánh. | Transient SMTP failure hoặc crash-before-send dẫn đến email không bao giờ được gửi; job retry đến max attempts rồi `FAILED`. Fix chỉ đổi silent success thành deterministic failure, chưa khôi phục delivery. | Thêm state machine `PENDING/PROCESSING/SENT/FAILED` và atomic claim/reclaim; retry được phép claim row `FAILED` hoặc stale `PROCESSING`. Identity lookup phải gồm `sourceJobId + recipient`. Test fail→retry→success và crash windows. | High |
| M-001 | Medium | Domain lifecycle / Requirement regression | `job-lifecycle.ts:5-29`; lifecycle spec; Round 3 R2-07 | Commit loại `BLOCKED` khỏi cả terminal và blocking sets với lý do có thể về `PENDING`, nhưng repository không có transition unblock và claim chỉ nhận `PENDING`. `BLOCKED` được tạo khi dependency đã `FAILED/CANCELLED`, nên hiện là trạng thái kết thúc thực tế. | Domain helper/spec mâu thuẫn lifecycle storage và requirement R2-07; future metrics/UI/cleanup logic có thể xử lý `BLOCKED` như active job. | Giữ `BLOCKED` terminal/blocking. Propagation BFS nên vẫn traverse descendants bằng graph traversal riêng, không cần làm sai classification của node. Nếu muốn unblock, phải thiết kế transition/invariant rõ ràng. | High |
| M-002 | Medium | Atomic observability | `process-jobs.use-case.ts:42-46,80-93` | Claim job commit trước, `startAttempt + claimed event` ở transaction sau. | Crash window vẫn tạo `PROCESSING` job không có attempt/event. | Claim + attempt + claimed event trong một transaction/CTE hoặc orchestration atomically. | High |
| M-003 | Medium | Stale recovery observability | `jobs.processor.ts:75-105`; `recoverStaleProcessing()` | Stale exhausted source job chuyển `FAILED` và propagate, nhưng attempt hiện tại không được finish và source job không có `stale_exhausted` event. | Attempt có thể còn `PROCESSING`; metrics/timeline thiếu terminal cause. | Close open attempt và ghi source event atomically với stale transition. | Medium |
| M-004 | Medium | Verification / Session hygiene | Commit file list; GitHub status/workflow; Task-9 session | Commit message ghi `68/68 tests pass` và typecheck clean, nhưng GitHub không có status/run; diff không sửa test file; session không có `EXECUTION.md`, `OVERVIEW.md` vẫn ở planning/0 progress. | Không có reproducible evidence cho PostgreSQL-specific paths; unit mocks có thể pass dù H-001/H-002 tồn tại. | Lưu exact commands/output trong `EXECUTION.md`; chạy typecheck, unit, migration, PostgreSQL integration/E2E trong CI; cập nhật TASKS/OVERVIEW trạng thái thật. | High |
| L-001 | Low | Operability / Worker identity | `process-jobs.use-case.ts`; `jobs.processor.ts` | Hai module vẫn tạo random `WORKER_ID` riêng. | Log stale recovery không correlate trực tiếp worker claim/attempt. | Inject shared stable worker identity. | High |
| I-001 | Info | Positive coverage | Scope contract; process use case; shared service wiring | Port/repository/call sites hiện có scope đồng bộ; no-handler/retry/fail đều kiểm tra fenced transition trước finish attempt; propagation được centralize và wire vào ba terminal paths. | Đây là cải thiện đúng hướng và nên được giữ lại khi sửa runtime blockers. | Giữ cấu trúc shared service, chỉnh SQL/state semantics và thêm integration tests. | High |

## Requirement coverage

| Requirement / Task | Covered by change? | Evidence | Notes |
|---|---|---|---|
| Build blocker: scoped repository contract | Yes statically | Port, repository và calls có `JobScope` | Cần DB test cross-tenant nhưng compile contract đã đồng bộ. |
| H-001 worker fencing | Yes statically | Transition result được check trước attempt/event trên success/retry/fail/no-handler | Còn claim/attempt atomicity là M-002 riêng. |
| H-002 notification idempotency | No at runtime | Conflict-as-existing flow được viết | Conflict target không khớp unique index (H-001). |
| H-003 mail idempotency/retry | No | Existing `SENT` no-op; existing `FAILED` throw | Không có reclaim/resend path (H-003). |
| H-004 transitive BFS | Partial | Shared BFS + visited guard | Savepoint syntax/rethrow làm runtime propagation fail (H-002). |
| H-004 all terminal paths | Yes structurally | Process/cancel/stale đều gọi shared service | Runtime blocked by H-002. |
| H-004 error isolation | No | Savepoint exists | Invalid identifier; exception rethrown to outer transaction. |
| Lifecycle bug | No / regression | `BLOCKED` removed from terminal/blocking | Không có unblock transition; trái R2-07. |
| Tests 68/68 | Needs more verification | Commit message only | No CI/EXECUTION, no test diff. |
| Typecheck clean | Plausible / unverified externally | Static signature alignment | No CI artifact. |

## Verification reviewed

| Check | Result | Evidence | Concern |
|---|---|---|---|
| Static TypeScript contract | Pass | Scope signatures align | GitHub CI missing. |
| Worker fencing ordering | Pass statically | All terminal branches gate attempt/event behind transition row | No barrier integration test. |
| Notification SQL conflict | Fail | Target one column vs composite index | Requires real PostgreSQL to expose. |
| Mail retry correctness | Fail | Existing FAILED always throws; no claim/send path | Retry cannot recover. |
| BFS structure | Pass statically | Queue + visited + shared service | Runtime savepoint fails. |
| Savepoint syntax | Fail | Raw identifier contains UUID hyphens | No sanitization/quoting. |
| Per-edge isolation | Fail | Savepoint helper rethrows; service does not catch | Outer transaction rolls back. |
| Lifecycle classification | Fail requirement | BLOCKED non-terminal/non-blocking | No unblock mechanism. |
| Unit tests | Needs more verification | Self-reported 68/68 | No test diff/output artifact. |
| CI status/workflow | Missing | GitHub returned none | Cannot infer pass. |

## Testing gaps

| Gap | Risk | Suggested follow-up |
|---|---|---|
| Notification insert with real partial composite index | Production SQL error | PostgreSQL integration test for first insert + replay. |
| Savepoint using real UUID | Propagation always fails | Integration test with actual `uuid` job IDs. |
| One dependent edge throws | Whole parent transaction rollback | Assert sibling edges continue and parent transition commits. |
| Mail SMTP fail then success | Permanent failed job/no email | Fake provider fail first, succeed second; assert reclaim and SENT. |
| Mail crash before/after SMTP | Lost email or false status | Failure injection around send/status update. |
| Fencing race | Stale worker mutates attempt | Barrier test across old/new worker attempts. |
| Cancel/stale/no-handler graph `C → B → A` | Incomplete propagation | PostgreSQL E2E for each source terminal path. |
| BLOCKED lifecycle | Wrong active/terminal reporting | Unit + API/metrics tests for terminal classification. |
| Stale recovery attempt closure | Orphan PROCESSING attempt | Cron integration test. |

## Residual risks

| Risk | Impact | Acceptance / mitigation |
|---|---|---|
| SMTP exactly-once is not generally achievable | Duplicate/loss trade-off | Explicit at-most-once vs at-least-once policy, durable claim, reconciliation. |
| Timeout does not cancel handler | Side effect may continue after lease | Handler-level idempotency and cooperative cancellation. |
| Large dependency graph in one transaction | Locks/latency | Bound batch size or outbox/recursive SQL with metrics. |

## Recommendation

**Blocked**

Commit `7a0615a` closes the static scope/build blocker and worker-fencing ordering, but the three production-critical runtime paths remain incorrect. Feature 07 is not ready for `done` until PostgreSQL conflict/savepoint behavior and mail retry state are fixed and verified.

## Handoff

- **Next action/skill:** `planning` → `execution`
- **Owner:** Agent / Developer
- **Blocking status:** Yes — H-001, H-002, H-003
- **Ready for done/PR:** No
- **Review baseline:** `7a0615a3a47c41f69af419ef215f402e7a4b9e56`
