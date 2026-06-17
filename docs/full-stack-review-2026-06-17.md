# Full-Stack Review — Architecture, Code, Security, Features

Date: 2026-06-17
Scope: `apps/api`, `apps/web`, `apps/admin`, `apps/mobile`, `packages/*`, infra, CI
Method: Static inspection of source, schema/migrations, config, and CI. No runtime/DB execution was performed; findings that depend on runtime behavior are marked **(needs verification)**.

This review supersedes `docs/backend-architecture-review-2026-06-16.md`. The backend was modularized into `packages/api-*` after that review, and several of its findings are now resolved (see [§7](#7-changes-since-the-2026-06-16-review)).

---

## 1. Executive Summary

The template is a credible, well-structured full-stack starter: NestJS modular monolith split into domain packages, a Next.js BFF with HttpOnly-cookie sessions, a Vite admin, a Flutter client, Drizzle migrations, RBAC + permissions, audit logging, and end-to-end OpenAPI contract generation. Security fundamentals are mostly present and thoughtfully implemented (session-backed JWT with refresh rotation + reuse detection, Argon2id, strict global validation, Helmet, CORS, an exception filter that does not leak internals).

The intended authority model is now confirmed: **`USER`** = normal user, **`ADMIN`** = administrator scoped to one organization, **`SUPER_ADMIN`** = global manager. The code already encodes this (only `SUPER_ADMIN` bypasses RLS), which makes **multi-tenant isolation the dominant risk**: an org `ADMIN` bypasses ownership checks in services and is kept inside their organization *solely* by Row-Level Security. But RLS is only partially deployed (4 of 13 org-scoped tables) and its runtime context propagation is fragile, so if RLS is not actually enforced an org `ADMIN` becomes a de-facto global admin — a cross-tenant breach. This must be proven with an integration test using the production DB role before the template is called production-grade.

Secondary themes: **no Redis** (so rate limiting, SSE notification fan-out, and caching are single-instance only), no per-route rate limiting on auth, no upload content-type allowlist, an SSE refresh path that discards rotated tokens, dead/duplicated security config (`CSRF_SECRET`), and lingering tracked build/runtime artifacts.

Overall posture: **solid base, not yet "green" for production tenancy.**

---

## 2. Architecture Review

### Strengths
- **Clear layering per module**: `presentation/` (controllers + DTOs) → `application/` (services) → `infrastructure/` (repositories). Consistent across all feature packages.
- **Domain packages**: `api-core`, `api-database`, `api-identity`, `api-platform`, `api-workspace`, `api-health`, `api-bootstrap`, `api-contract` — a sensible decomposition of a modular monolith.
- **BFF pattern** (`apps/web/src/lib/server/backend.ts`): the browser never holds tokens; access/refresh live in HttpOnly cookies, refresh happens server-side once per eligible 401, CSRF enforced on cookie-authenticated mutations.
- **Contract-first clients**: NestJS Swagger → `openapi.json` → TS types (`api-contract`) → Dart Dio client. Keeps web/admin/mobile in sync.
- **RBAC + tenancy intent**: permissions guard, roles, per-org membership, and Postgres RLS for tenant isolation.

### Architectural concerns
1. **Authority model (confirmed).** `USER` = normal end user; `ADMIN` = administrator **scoped to one organization**; `SUPER_ADMIN` = global manager across all organizations. The code already encodes this: `TenantContextInterceptor` sets `bypassRls = user.roles.includes(SUPER_ADMIN)` (`tenant-context.interceptor.ts:37`) — **only `SUPER_ADMIN` bypasses RLS; `ADMIN` is meant to be confined to its org by RLS.** The consequence is critical: `ProjectsService.assertCanAccessProject` (`projects.service.ts:424`) and `FilesService.findAccessibleFile` (`files.service.ts:142`) let any `ADMIN` bypass *ownership* checks, so an `ADMIN`'s confinement to their own organization depends **entirely** on RLS being effective. If RLS is not enforced (see SEC-1), an org `ADMIN` becomes a de-facto global admin. This authority model should be documented explicitly and covered by tests.
2. **Cross-feature package coupling.** Feature packages import each other's internals (e.g. `projects.service.ts` imports `AttachmentsRepository` and `AuditService` from `api-platform`; jobs/exports reach into `api-identity`/`api-workspace`). The 2026-06-16 review measured 323 `turbo boundaries` issues. The package *names* imply independence the code does not honor. Introduce ports/events (`AuditWriter`, `NotificationPublisher`, `UserLookup`) so features depend on `api-core` abstractions, not each other.
3. **Tenant-context propagation is indirect.** `TenantContextInterceptor` stores tenant data in `AsyncLocalStorage`; `TenantAwarePool.connect()` reads it and runs `set_config(...)`. This couples correctness to pool-checkout timing (see [§4 SEC-1](#sec-1-rls-isolation-is-fragile-and-incomplete--high-needs-verification)).
4. **Docs describe the intended graph, not the real one.** `docs/architecture.md` shows clean app→package layering; the import reality is cross-feature. Generate the dependency diagram from the actual import graph.

---

## 3. Feature Review

Implemented and reasonably complete:
- **Auth lifecycle**: register, email verification, login (status gating: `PENDING`/`BLOCKED`/`ACTIVE`), refresh rotation, logout / logout-all, password reset (revokes all sessions), resend verification, session listing/revocation, organization switching. Opaque tokens are hashed at rest; refresh tokens hashed; reuse detection present.
- **Access control**: roles, permissions, admin roles controller, permission-gated routes.
- **Audit**: append-only log with write + admin read.
- **Notifications**: inbox CRUD, web SSE stream, FCM push, scheduled/queued sends via PG job queue.
- **Projects**: reference CRUD with ownership, soft delete/restore, attachments, activity feed, assignment notifications.
- **Platform capabilities**: storage (local/S3), files, attachments (polymorphic), mail (SMTP + file templates + delivery log), imports/exports (CSV), jobs (PG queue with `FOR UPDATE SKIP LOCKED`), settings, preferences, invitations, comments, activities, organizations.
- **Clients**: web (App Router + BFF), admin (Vite + shadcn + TanStack), mobile (Riverpod + Dio + secure storage + single-flight refresh).

Feature gaps:
- **Local file download endpoint is missing.** `LocalObjectStorage.getSignedUrl` returns `${API_INTERNAL_URL}/storage/local/{key}` (`.../local-object-storage.service.ts:50`), but no controller serves `/storage/local/*` (grep finds only the service). With the default `STORAGE_DRIVER=local`, file download/preview is broken. (See [SEC-6](#sec-6-local-signed-urls-are-not-signed-and-unserved--lowmedium).)
- **Mobile is not verified in CI.** Recent commits skip Flutter steps (`d940b45 ci: skip flutter pipeline steps`); `ci.yml` has no Flutter format/analyze/test. Mobile can regress silently.
- **Imports/exports appear demo-scoped** (projects only); fine for a template but should be labeled as such.

---

## 4. Security Review

Trust boundaries inspected: browser↔BFF, BFF↔API, API auth/permission guards, API↔Postgres (RLS), file upload/download, mail/token issuance, secrets/config.

### SEC-1 — RLS isolation is fragile and incomplete — **High (needs verification)**
- **Incomplete coverage.** `0004_organizations_rls.sql` adds `organization_id` to 13 tables but `ENABLE ROW LEVEL SECURITY` on only 4: `projects`, `files`, `notifications`, `audit_logs` (lines 51–62). `attachments`, `jobs`, `notification_jobs`, `invitations`, `import_jobs`, `export_jobs`, `comments`, `activities` have the column but **no policy** — they rely entirely on application-level filtering, which is applied inconsistently.
- **Fragile context propagation.** Tenant context is applied via `set_config('app.tenant_id', $1, true)` — the third arg `true` makes it **transaction-local** — and is run in `TenantAwarePool.connect()` (`database.provider.ts:38`), i.e. at pool checkout, *outside* any explicit transaction. A transaction-local `set_config` executed in autocommit mode applies only to that single statement and is discarded before the subsequent query runs. Most reads go through `this.database` directly (e.g. `ProjectsRepository.findById`), not through `withTenantContext`. The repo even contains the correct helper (`setTenantContextOnExecutor` / `withTenantContext` in `tenant-context.ts`) but the live path does not use it.
  - If the setting truly does not survive, RLS-enabled tables would deny all rows under a non-superuser role; the app likely "works" today only because CI/dev run as a privileged role that is not subject to `FORCE ROW LEVEL SECURITY`, or because service-level `organizationId` filters mask it.
- **Admin org-confinement depends *only* on RLS.** Per the confirmed model (`ADMIN` = org-scoped, `SUPER_ADMIN` = global), the interceptor grants RLS bypass to `SUPER_ADMIN` only. But `getById` → `assertCanAccessProject` grants every `ADMIN` access regardless of owner and does **not** filter by `organization_id` (`projects.service.ts:62`, `:424`); `FilesService.findAccessibleFile` does the same. So an org `ADMIN` is kept inside their organization *solely* by RLS. If the context-propagation flaw above means RLS is not enforced, an `ADMIN` of org A can read/modify org B's projects and files — a privilege-escalation / cross-tenant breach, not just defense-in-depth.
- **Recommendation.** Decide if RLS is a hard boundary. If yes: route every tenant-scoped repository call through a transaction that sets DB-local context in the *same* transaction; add policies to **all** org-scoped tables; add org indexes on every tenant access path; and add an integration test that connects as the **production application role** (not owner/superuser) and proves a user in org A cannot read org B's rows. Until proven, treat tenant isolation as service-filter-only and document RLS as defense-in-depth, not a guarantee.

### SEC-2 — No per-route rate limiting on auth endpoints — **Medium**
`ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])` is global (`app.module.ts:42`) with a global `ThrottlerGuard`. There is no `@Throttle` override anywhere (grep finds it only in the repo's own best-practice skill docs). 120 req/min is far too loose for `login`, `forgot-password`, `reset-password`, `register`, and `resend-verification`, enabling credential brute force and email/token abuse. The repo's own `nestjs-best-practices` rule recommends ~5/min on login.
- **Recommendation.** Add strict `@Throttle` to auth + invitation mutations (e.g. 5/min login, 3/hour reset).

### SEC-3 — File uploads have no content-type/extension allowlist — **Medium**
`FilesService.upload` validates only size (10 MB, *after* buffering) and trusts the client-supplied `file.mimetype`; it stores the original extension and persists `mimeType` verbatim (`files.service.ts:50-74`). No magic-byte sniffing, no allowlist. Combined with an inline-serving download path, this risks stored XSS (e.g. SVG/HTML) and distribution of executables.
- **Recommendation.** Enforce an allowlist (extension + sniffed content type), configure Multer `limits.fileSize` at the interceptor so oversize is rejected before buffering, and serve downloads with `Content-Disposition: attachment` + a non-executable content type.

### SEC-4 — SSE refresh discards rotated tokens — **Medium**
`apps/web/src/app/api/notifications/stream/route.ts` refreshes on 401 but never writes the rotated tokens back to cookies (unlike `proxyWithRefresh`, which calls `setAuthCookies`). Because refresh rotation is now a compare-and-swap that replaces the stored hash, the browser keeps the **old** refresh cookie; the next BFF refresh sends the stale token, fails the CAS, and trips reuse detection (`AUTH_REFRESH_TOKEN_REUSED`) → session revoked. Result: opening the notifications stream after access-token expiry can spuriously log the user out.
- **Recommendation.** Either persist rotated tokens to cookies in the SSE route (set-cookie on the streamed response) or refresh via the same shared path that writes cookies before opening the stream.

### SEC-5 — `CSRF_SECRET` is dead/duplicated config — **Low**
`CSRF_SECRET` is required (`env.schema.ts:73`, min 24) and present in `.env.example`/CI, but no code consumes it (grep). Actual CSRF is an origin check + random-UUID double-submit cookie in the BFF (`backend.ts:158`, `cookies.ts:39`). The double-submit token is not bound to the session or signed with any secret. The mechanism (origin + same-value cookie/header, SameSite=Lax) is acceptable, but the unused secret is misleading and the token is weaker than a signed/HMAC token.
- **Recommendation.** Either bind the CSRF token with `CSRF_SECRET` (HMAC of session) or remove the unused env var so config reflects reality.

### SEC-6 — Local "signed" URLs are not signed (and unserved) — **Low/Medium**
`LocalObjectStorage.getSignedUrl` returns a plain, non-expiring path with no signature/token (`local-object-storage.service.ts:43-51`), and no route serves it. In S3 mode this is a real presigned URL; in local mode it is neither signed nor functional. If a `/storage/local/*` handler is later added without re-checking `findAccessibleFile` ownership, it becomes an unauthenticated object-access endpoint.
- **Recommendation.** Implement the local download route behind auth + the existing ownership check, and make the "signed" URL genuinely time-limited (signed token) so local/S3 semantics match.

### SEC-7 — Login user-enumeration via timing — **Low**
On unknown email, `login` logs and throws before running Argon2 verification (`auth.service.ts:150-162`); on known email it runs a full Argon2 verify. The response is identical but the timing differs measurably, allowing account enumeration. `forgotPassword`/`resendVerification` correctly use neutral responses.
- **Recommendation.** Perform a dummy Argon2 verification against a constant hash when the user is absent to equalize timing.

### SEC-8 — Web cookie flags ignore env config — **Low**
`apps/web/src/lib/auth/cookies.ts` hardcodes `sameSite: "lax"` and never reads `COOKIE_SAMESITE`/`COOKIE_DOMAIN` (those exist in the API env schema but the cookies are set by the web BFF). `secure` is driven by `isSecureCookie`. For cross-site or subdomain deployments this requires code edits rather than config.
- **Recommendation.** Drive web cookie `sameSite`/`domain`/`secure` from web env so deployment topology is configurable; document that `SameSite=None` requires `Secure`.

### SEC-9 — No Redis: single-instance assumptions break under horizontal scaling — **Medium**
There is no Redis (or equivalent shared store) wired anywhere in source (grep finds it only in `docs/deployment.md` and skill docs). Three runtime concerns are all currently in-process and therefore correct only for a **single API instance**:
- **Rate limiting** — `ThrottlerModule.forRoot([...])` uses the default in-memory storage. Behind N replicas the effective limit is ~N× the configured value and resets on every deploy/restart. This compounds SEC-2: distributed brute-force protection is effectively absent in production.
- **SSE notification fan-out** — `NotificationStreamService` keeps an in-process `Map<userId, Subject>` (`notification-stream.service.ts:18`). A notification emitted on instance A is never delivered to a client whose SSE connection is held by instance B. Multi-instance deployments will silently drop real-time notifications.
- **Caching** — every authenticated request recomputes the access profile (`AuthService.authenticateAccessToken` → `getAccessProfile`) and resolves the organization with no cache layer; there is no shared cache for sessions/permissions.

- **Recommendation.** Add Redis to `infra/docker-compose.yml` and env/config, then back: (a) the throttler with `@nest-lab/throttler-storage-redis` (or equivalent) for global limits; (b) SSE/notification fan-out with Redis Pub/Sub (or move to a broker) so emits propagate across instances; (c) an optional cache for access profiles/permissions with explicit invalidation on role/permission changes. Document single-instance as the only supported topology until this exists.

### Positive security notes
- Strict global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) — `main.ts:26`.
- Helmet + credentialed CORS limited to configured origins — `main.ts:20-24`.
- Exception filter returns generic 500s and only includes stack traces in non-production — `app-exception.filter.ts:76`.
- Swagger disabled in production / behind `API_DOCS_ENABLED` — `main.ts:37`.
- Refresh rotation is now atomic (CAS) and revokes-all on password reset.
- BFF proxy blocks path traversal / absolute URLs and enforces CSRF on non-safe methods (`bff/[...path]/route.ts:14`).

---

## 5. Code Quality Review

- **Consistent and readable.** Uniform module shape, typed DTOs, centralized `ERROR_CODES`, response envelope interceptor, Zod-validated env that fails fast.
- **Route param validation is inconsistent** — UUID path params are accepted as raw strings without `ParseUUIDPipe` across projects/files/jobs/admin-users controllers. Invalid ids reach repositories and produce inconsistent errors.
- **Multi-step writes still mix concerns.** `FilesService.upload` writes to object storage *before* the DB insert but does compensate by deleting the object on failure (`files.service.ts:90`) — acceptable. `delete` removes the DB row before storage and throws if storage cleanup fails, diverging state. Exports/notification-jobs flows still lack idempotency keys; partial failure can orphan files or duplicate sends.
- **Tracked artifacts persist** (regression from prior review, still open): a runtime upload `apps/api/storage/uploads/.../*.png` and five `packages/*/tsconfig.tsbuildinfo` files are committed. These leak state and create noisy diffs.
- **Orphan config**: `.env.example` defines `WORKSPACE_PORT` and `INTERNAL_SERVICE_KEY` (lines 18-19) that are absent from `env.schema.ts` (zod strips them silently) — dead config.

---

## 6. Prioritized Gaps & Recommendations

| # | Severity | Area | Gap | Recommendation |
|---|----------|------|-----|----------------|
| 1 | High | Security/Arch | RLS partial + fragile context; **org `ADMIN` confinement rests entirely on RLS** | Same-transaction DB-local context for all tenant repos; RLS on all org tables; integration test as production DB role + as org `ADMIN` |
| 2 | Medium | Security | No per-route auth rate limit (and in-memory throttler — see #6) | `@Throttle` on login/reset/register/invite |
| 3 | Medium | Security | No upload content-type allowlist; size checked late | Allowlist + magic-byte sniff; Multer `limits`; `Content-Disposition: attachment` |
| 4 | Medium | Security/Correctness | SSE refresh drops rotated tokens → spurious logout | Persist rotated tokens, or refresh before opening stream |
| 5 | Medium | Feature | Local file download route missing under default driver | Implement authed `/storage/local/*` with ownership check + real signed token |
| 6 | Medium | Infra/Scale | No Redis — in-memory throttler, in-process SSE fan-out, no shared cache | Add Redis; back throttler + SSE pub/sub + access-profile cache |
| 7 | Medium | Arch | Cross-feature package coupling (323 boundary issues) | Ports/events via `api-core`; enforce `turbo boundaries` in CI |
| 8 | Low | Security | `CSRF_SECRET` unused; double-submit token unsigned | HMAC-bind the token or remove the secret |
| 9 | Low | Security | Login timing enumeration | Dummy Argon2 verify on missing user |
| 10 | Low | Security | Web cookie flags ignore env | Drive sameSite/domain/secure from web env |
| 11 | Low | Quality | Missing `ParseUUIDPipe` on id params | Apply pipe; test invalid-id shape |
| 12 | Low | Quality/Repo | Tracked upload + tsbuildinfo artifacts | `.gitignore` them; remove from history |
| 13 | Low | CI | Mobile not verified | Restore Flutter format/analyze/test in CI |
| 14 | Low | Config | Orphan `.env.example` keys | Remove or add to schema |

---

## 7. Changes Since the 2026-06-16 Review

Resolved:
- **Graceful shutdown** — `app.enableShutdownHooks()` now called (`main.ts:25`).
- **Throttler wired** — `ThrottlerModule` + global `ThrottlerGuard` registered (`app.module.ts:42,78`). *(Per-route auth throttling still missing — SEC-2.)*
- **Atomic refresh rotation** — `updateSessionIfMatches` is a CAS on `id + refreshTokenHash + revokedAt IS NULL` (`auth.repository.ts:74`).
- **CI quality gates enforced** — `ci.yml` runs lint, typecheck, API tests, web tests, build, and Playwright E2E.
- **Modularization** — backend split from `apps/api/src/modules/*` into `packages/api-*`.

Still open: RLS/tenant completeness (P1), package boundaries (P1), some transactional/idempotency gaps (P1), tracked artifacts (P2), missing `ParseUUIDPipe` (P3). New since then: missing Redis / single-instance throttler + SSE + cache (SEC-9), SSE token drop (SEC-4), upload allowlist (SEC-3), `CSRF_SECRET` dead config (SEC-5), local download route missing (SEC-6), mobile dropped from CI.

Open question now answered: admin roles are **org-scoped** (`ADMIN`) vs **global** (`SUPER_ADMIN`), with `USER` as the normal role — see §2.1 and SEC-1.

---

## 8. Verification Notes & Residual Risk

- This review is static. The **highest-impact** item (SEC-1) is explicitly marked needs-verification: the practical effect of transaction-local `set_config` at pool checkout must be confirmed with a test that runs as the non-privileged production DB role. That test is the single most valuable next step.
- No secrets, tokens, or customer data were copied into this document.
- Recommended next commands:
  - `pnpm lint && pnpm typecheck && pnpm --filter api test && pnpm --filter web test` (confirm gates are green on current tree)
  - Add and run a cross-tenant RLS integration test under the production DB role — assert that an org-`A` **`ADMIN`** cannot read/modify org-`B` projects/files (the strongest test of the authority model)
  - `pnpm exec turbo boundaries` (quantify current coupling)
  - Add Redis to `infra/docker-compose.yml` and back the throttler, SSE fan-out, and access-profile cache before any multi-instance deployment
