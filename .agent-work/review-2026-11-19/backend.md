# Backend review — super-template (2026-11-19)

Read-only review of `apps/api/src`, `apps/worker/src`, `packages/api-kernel`, `packages/api-runtime`,
`packages/api-plugin-kit`, `packages/database-runtime`, `packages/observability`, `packages/feature-*/src`
(server-side only). Static reading + `rg`/`find`; no install, build, test or typecheck was run
(`node_modules` absent, `pnpm` not on PATH).

Baseline used: the review brief's defect list, plus the repo's own declared rules —
`docs/architecture/ARCHITECTURE_RULES.md` §16 (transaction boundaries), §32 (error handling),
§33 (never log tokens/secrets), §34 (no ad-hoc `process.env`), §39 (runtime uses the restricted
non-BYPASSRLS role). `REVIEW.md` items were checked and contain nothing this report repeats.

**Counts: P0 = 0, P1 = 3, P2 = 4, P3 = 5 (12 findings).**

---

## 1. Conclusion

The deliverable is **not ready to ship as-is**: there are 3 must-fix (P1) defects. One hangs the
storage-cleanup worker in an unbounded retry loop on a single failing delete; one makes the
authentication and refresh paths read the *security decision* (password hash, account status) from
the read replica, so a password reset or block can be bypassed for the replica-lag window when the
read-replica capability is enabled; one silently drops realtime notifications created by the worker
process. Four further P2 defects (worker-log secret/PII exposure, an in-tenant attachment IDOR,
a broken local-storage download link, and an error-swallowing tenant reselection) should be fixed in
the same pass. The remaining five are low-risk observations. Overall the code is unusually
well-guarded — CAS/idempotency, RLS with `FORCE`, primary-client selectors and explicit
tenant-context wrappers are used deliberately — so these findings are narrow exceptions, not a
pattern.

---

## 2. Must fix

### P1-1 — Storage cleanup loops forever on an object whose delete keeps failing

**Location** `packages/feature-upload/src/storage/application/storage-cleanup.service.ts:82-101`
(second, related location `packages/feature-upload/src/storage/infrastructure/storage-tracking.repository.ts:86-110`).

```
    for (;;) {
      const orphans = await this.platformTransactionPort.run((tx) =>
        this.tracking.listOrphans(cutoff, ORPHAN_BATCH_SIZE, tx),
      );
...
        } catch {
          // Handled via the outbox; keep sweeping the rest.
        }
```

**Problem** `listOrphans` selects rows that are still `status = 'UPLOADED'` and unreferenced. On
success the tracked wrapper marks the row `DELETED`; on failure it only *enqueues* an outbox retry
and rethrows (`tracking-object-storage.service.ts:43-52`), leaving the ledger row `UPLOADED`. The
`catch {}` at line 97 swallows that error and the `for (;;)` loop re-queries the same batch, so the
same failing keys are retried immediately, forever, inside one cron invocation.

**Impact** One persistent delete failure (bucket policy denies `s3:DeleteObject`, object owned by
another account, local path not writable) pins the storage-cleanup cron in a tight DB + network
loop: `StorageCleanupService.processing` never resets, `processDeleteOutbox()` is never reached,
and the worker issues unbounded storage delete calls. No progress is possible without a restart.
The same root shape exists in `claimPendingDeletes`, which claims by `updated_at = now()` but never
changes `status`, and filters no `scheduled_at` — failed rows are re-claimed and re-failed in one
burst, burning `max_attempts` with no backoff.

**Evidence** `listOrphans` SQL (`storage-tracking.repository.ts:59-77`) keys on
`so.status = 'UPLOADED' AND NOT EXISTS (...)`; `TrackingObjectStorage.delete` only calls
`tracking.recordDelete(key)` on the success branch.

**Fix direction** Make the sweep progress-driven rather than state-driven: track keys attempted in
this run and `break` when a batch yields no newly-deleted key (or delete only `ORPHAN_BATCH_SIZE`
keys per invocation). For the outbox, have `claimPendingDeletes` transition `status` to
`PROCESSING` (CAS, like `jobs.repository.ts` does) and add `scheduled_at <= now()` to the claim so
retries back off instead of exhausting in one pass.

### P1-2 — Login, refresh and MFA completion read the security decision from the read replica

**Location** `packages/feature-users/src/infrastructure/users.repository.ts:86-107`;
callers `packages/feature-auth/src/application/use-cases/login.use-case.ts:28`,
`.../refresh-session.use-case.ts:83`, `.../complete-mfa-login.use-case.ts:33`.

```
  async findByEmail(email: string, executor: DatabaseExecutor = this.database) {
    const [user] = await executor
      .select()
      .from(users)
      .where(and(eq(users.email, email), activeAccount()))
      .limit(1);
```

**Problem** `findById` / `findByEmail` default to `this.database`, which is the composed Drizzle
client: when the `database-read-replica` capability is enabled (a documented, supported topology —
`packages/feature-database-read-replica`), plain `select`s route to the replica. `findByIdStrong`
exists and *is* used by `AuthenticateAccessTokenUseCase:54`, but the three paths that decide whether
a credential or account may be used still call the replica-bound variants.

**Impact** For the replica-lag window (seconds under load; longer if replication stalls):
- `PATCH /users/me/password` or a password reset commits the new `password_hash`; `POST /auth/login`
  still verifies against the old hash on the replica, so the **old password keeps working** and the
  new one is rejected.
- `PATCH /admin/users/:id/status` (BLOCKED) commits; `POST /auth/refresh` reads
  `user.status !== "ACTIVE"` from the replica and keeps minting access tokens for a blocked account;
  `POST /auth/mfa/verify` then issues a full session for it.
This is exactly the class the repository already guards against for access tokens — the protection
was applied to one path and not the other three.

**Evidence** `users.repository.ts:96-98` `findByIdStrong` → `this.findById(userId, this.primaryDatabase)`;
`refresh-session.use-case.ts:83` `const user = await this.usersRepository.findById(session.userId);`
(the session row itself correctly comes from `findSessionForUser`, which defaults to `primaryDatabase`).

**Fix direction** Use `findByIdStrong` in `RefreshSessionUseCase` and `CompleteMfaLoginUseCase`, and
add `findByEmailStrong` (primary executor) for `LoginUseCase`. Keep replica reads for display-only
lookups. A comment at each call site should state that the read authorizes the request.

### P1-3 — Realtime notifications created by the worker are never published to Redis

**Location** `packages/feature-notifications/src/infrastructure/notification-stream.service.ts:42-63`.

```
  async onModuleInit() {
    // await this.ensureRedis();
  }
...
  emit(userId: string, organizationId: string, event: NotificationStreamEvent): void {
    if (!this.redisPublisher) {
      // Fallback: no Redis configured, emit locally
      this.getSubject(this.channelKey(userId, organizationId)).next(event);
      return;
    }
```

**Problem** Redis initialisation is triggered only by `stream()` (line 61). `emit()` checks a null
`redisPublisher` and returns early with a purely in-process `Subject.next`, never reaching
`publish()` (which *does* lazily call `ensureRedis`). `onModuleInit` — the one place that would
initialise the publisher for a process that never serves SSE — is commented out.

**Impact** `apps/worker` never serves SSE, so in any deployment with `REDIS_URL` set its
`redisPublisher` stays null forever: every notification produced by a background job is emitted to a
`Subject` with no subscribers and is lost. API instances exhibit the same loss until their first SSE
connection happens to open. Clients connected to another replica receive nothing — a silent failure,
since `emit` returns `void` and logs nothing.

**Evidence** Line 61 is the only `ensureRedis()` call on the stream path; `publish()` at lines 126-140
is only reached from the non-null branch of `emit()`.

**Fix direction** `await this.ensureRedis()` in `onModuleInit` (restore the commented line) and make
`emit` fall back to the local Subject only when no `REDIS_URL` is configured, not when the client is
merely uninitialised. Add a unit test that `emit` publishes when Redis is configured but no stream
has been opened.

---

## 3. Worth considering

### P2-1 — Request and exception logs persist the full URL, including query-string credentials

**Location** `packages/api-runtime/src/middleware/request-logger.middleware.ts:21`,
`packages/api-runtime/src/filters/app-exception.filter.ts:66`.

```
      const context = {
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
```

**Problem** Every completed request and every handled/unhandled exception logs `originalUrl`, which
includes the query string unredacted. The repo has endpoints that put one-time credentials there:
`GET /auth/sso/:provider/callback?code=…&state=…` (public, `sso.controller.ts:52-61`) and
`GET /files/:id/download?token=<HMAC>` (`local-file-download-url.service.ts:26`). Emails can also
appear in query strings on admin filters.

**Impact** Violates ARCHITECTURE_RULES §33 ("never log … access tokens … reset/verification tokens")
and puts short-lived OAuth authorization codes and file-capability tokens into stdout/Sentry/Telegram
(`ErrorReporterService` forwards `path` as a Sentry tag and context field). Anyone with log access can
replay them within their lifetime.

**Fix direction** Log `request.path` (no query) plus an allow-listed query-key set, or run the URL
through `redactSensitive`-style query redaction before logging. Apply the same change in
`AppExceptionFilter.buildExceptionContextBase`.

### P2-2 — Attachment listing has no actor or tenant scope; RLS is the only fence

**Location** `packages/feature-upload/src/attachments/presentation/attachments.controller.ts:55-63`,
`.../application/use-cases/list-attachments.use-case.ts:18-22`,
`.../infrastructure/attachments.repository.ts:34-49`.

```
  @Get()
  @Authorize({ permissions: [perm("attachments", ACTION.READ)] })
  @ApiArrayResponse(AttachmentDto)
  list(@Query() query: AttachmentsQueryDto) {
    return this.listAttachments.execute({
      entityType: query.entityType,
      entityId: query.entityId,
    });
```

**Problem** Unlike every sibling read path (`AttachFileUseCase`, `FileAccessService`,
`listFilesAccessScope`), the list use case receives no `AuthenticatedRequestUser` and the repository
filters only on `(entity_type, entity_id, deleted_at)`. `attachments.read` is granted to the `USER`
role by default (`feature-upload/src/upload.feature.ts:24-28`), so any authenticated user can list
attachment rows for any entity in the organization, including `fileId`, `label` and `createdById` of
files they cannot open.

**Impact** In-tenant IDOR: attachment metadata (original names, labels, uploader ids) is disclosed to
any user who knows/guesses an `entityId`, and it hands out `fileId`s that can then be probed against
`GET /files/:id`. For a SUPER_ADMIN request the interceptor sets `bypassRls = true`, so the query is
not even tenant-fenced — only the UUID collision prevents cross-org rows. Correctness today depends
entirely on the RLS policy and the matching tenant GUC, not on this feature.

**Fix direction** Pass the actor into the use case, resolve its organization (or platform scope) and
add `organizationId` to the repository predicate, mirroring `canAccessFile`'s rule that a file and
its attachment must be in the actor's organization. Keep RLS as the backstop, not the primary check.

### P2-3 — Local-storage download URL can never be fetched: the route requires a Bearer token

**Location** `packages/feature-upload/src/files/presentation/files.controller.ts:163-173`,
`packages/feature-upload/src/files/application/services/local-file-download-url.service.ts:21-36`.

```
  @Get(":id/download")
  @Authorize({ permissions: [perm("files", ACTION.READ)] })
  @SkipEnvelope()
```

**Problem** In local-driver mode `GET /files/:id/url` returns
`${API_INTERNAL_URL}/api/v1/files/:id/download?token=<hmac>` (a URL meant to be opened directly),
but the `download` handler is neither `@Public()` nor free of `@Authorize`, so `AuthGuard` rejects a
plain navigation. `STORAGE_DRIVER` defaults to `local` (`env.schema.ts:142`), i.e. this is the
development/default path. The admin consumes the URL with `window.open(url, "_blank")`
(`apps/admin/src/features/files/controllers/use-files-mutations.ts:34-43`), which sends no
`Authorization` header.

**Impact** Downloading a file returns 401 in every local-driver environment; the HMAC token check in
`DownloadFileUseCase:20-22` is dead weight because a caller who already has a Bearer token does not
need it. Secondary: the URL is built from `API_INTERNAL_URL` (the server-to-server host), so the
browser must be able to resolve that host too. In S3 mode the equivalent URL is pre-signed and works,
so the defect is invisible in production/staging.

**Fix direction** Either mark the download route `@Public()` and rely solely on the validated,
expiring token (plus `files.read` remains enforced on the `/url` issuance endpoint), or drop the
token requirement for local mode and document that downloads are authenticated fetches. Pick one —
today the two halves contradict each other.

### P2-4 — Organization resolution swallows every error and silently switches tenant

**Location** `packages/feature-organizations/src/application/use-cases/resolve-organization-id-for-user.use-case.ts:28-35`.

```
    if (organizationId) {
      try {
        await this.assertOrganizationMembershipUseCase.execute(organizationId, userId, executor);
        return organizationId;
      } catch {
        // Fall back to primary organization if the specified one is invalid/deleted/non-member
      }
    }
```

**Problem** The bare `catch` cannot distinguish "not a member / deleted org" (fallback is intended)
from an infrastructure failure inside `assertOrganizationMembership` (DB error, pool exhaustion,
`FOR UPDATE` timeout). Any error becomes "use the user's primary organization" and a session is
issued or refreshed for a tenant context the caller did not ask for.

**Impact** A transient failure during `POST /auth/refresh` or `switch-organization` silently relocates
the session to a different organization (both are memberships, so RLS still fences rows), producing
wrong-tenant writes to `jobs.organizationId`, audit scope, notifications and activities for that
request — with no log line and no error surfaced. It also masks real availability faults.

**Fix direction** Fall back only on the specific typed error(s) that mean "not a member / org gone"
(e.g. `AppError` with `AUTH_FORBIDDEN` / `ORGANIZATION_NOT_FOUND`); rethrow everything else. Log the
fallback at `warn` with the requested and resolved ids.

---

## 4. Only recording

- `packages/feature-mail/src/presentation/admin-mail.controller.ts:64-70` — `:templateKey` is not
  checked against `listTemplateKeys()` before `join(templatesDir, …)` in
  `template-renderer.service.ts:109-116`; path traversal is possible in principle, but `render()`
  reads `.subject.txt` + `.text.txt` + `.html.txt` together and requires `mail.read`, so exposure is a
  read of a co-located template triple. Add an allow-list check for symmetry with `send-admin-mail.use-case.ts:50-58`.
- `packages/feature-auth/src/auth.guard.ts:48-50` — `process.env.NODE_ENV === "test"` lets a client
  null its own `organizationId` via `x-organization-id: ""`; a test-only branch in production code
  and a `process.env` read in a feature package (§34). Gate it behind a DI-provided flag if it is
  still needed.
- `packages/database-runtime/src/database.provider.ts:119-124` — the callback branch calls
  `release(error)` and then hands the same already-released client to the caller's callback together
  with the error; a caller that inspects `client` or releases again hits a released client.
- `packages/feature-jobs/src/application/use-cases/process-jobs.use-case.ts:279-289` — `withTimeout`
  rejects via `Promise.race` but cannot cancel the handler; a timed-out attempt is retried while the
  first handler may still be writing, so handler side effects must be idempotent. Worth an explicit
  note in the handler contract.
- `packages/feature-organization-management/src/application/use-cases/delete-organization.use-case.ts:117-120`
  — member cache invalidation loops `invalidateAccessProfile` per member (one Redis round trip each)
  although `AccessProfileCache.invalidateUsers` exists and batches.

---

## 5. Scope and coverage

**Verified against source** (all read in full or in the cited ranges): database-runtime
(`database.provider`, `database.types`, `tenant-context`, `database-rls.guard`, transaction services,
`idempotent-insert`), api-runtime (global pipeline, `AuthorizeGuard`, `AuthGuard`, exception filter,
request logger, access-profile cache, throttler storage, pagination DTO, bootstrap pipeline),
api-kernel helpers (`password`, `opaque-token`, `redact`, `csv`, tenant context), auth (login,
refresh/rotation, MFA completion, reset password, session revocation, SSO callback and OIDC verify),
access control (role-assignment policy, access profile, role/permission persistence), organizations
(resolution and membership), user management (list/get/status/roles), jobs (claim/complete/retry,
processor), outbox dispatcher/repository, notifications (inbox, stream, dispatch, delivery
controller/repository), upload (files, attachments, storage tracking/cleanup, download URL), mail
(template renderer, admin send/preview), audit (read scope, repository), import/export (confirm,
parser, export processor), settings (maintenance guard, lookup), observability transports, and the
RLS/DDL migrations `0004`, `0005`, `0037` plus the RLS policies they create.

**Checks that came back clean** (no finding raised): raw-SQL construction (all interpolations go
through Drizzle parameter binding; the only `sql.raw` uses a double-quote-escaped savepoint name),
CSV formula injection on export, open-redirect/CORS/helmet setup, `ValidationPipe`
(`whitelist`, `forbidNonWhitelisted`), pagination bounds (`MAX_PAGE_SIZE`), password hashing and
timing padding, refresh-token reuse/rotation CAS, MFA attempt accounting and challenge CAS, SSO state
hashing/CAS/nonce and email-verified account linking, audit read scoping, job claim
(`FOR UPDATE SKIP LOCKED`) and idempotent enqueue, import confirm CAS + per-row savepoints.

**Not verified / out of reach**
- No build, test or typecheck run (constraint: no `node_modules`, no `pnpm`); behaviour is inferred
  from source only. Re-run `pnpm --filter @repo/feature-upload test` and
  `pnpm --filter @repo/database-runtime test` after fixes.
- P1-2 is conditional on the `database-read-replica` capability being enabled; the default registry
  (`packages/app-composition/src/feature-registry.ts`) does not include it, so the bug is latent in
  the default profile and live in the replica profile.
- P1-3 assumes a multi-process deployment (API + worker, `REDIS_URL` set), which the code's own
  Redis/SSE design implies; a single-process deployment masks it.
- RLS effectiveness was read from migration SQL, not exercised against a database. The
  `DatabaseRlsGuard` startup assertion (restricted role) was not executed.
- Frontend code was consulted only to confirm how the download URL and SSE stream are consumed; it
  was not reviewed.
