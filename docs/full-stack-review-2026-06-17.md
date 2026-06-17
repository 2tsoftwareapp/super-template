# Full-Stack Review — Architecture, Code, Security, Features

Date: 2026-06-17
Scope: `apps/api`, `apps/web`, `apps/admin`, `apps/mobile`, `packages/*`, infra, CI
Method: Static inspection of source, schema/migrations, config, and CI. No runtime/DB execution was performed; findings that depend on runtime behavior are marked **(needs verification)**.

This review supersedes `docs/backend-architecture-review-2026-06-16.md`. The backend was modularized into `packages/api-*` after that review, and several of its findings are now resolved (see [§7](#7-changes-since-the-2026-06-16-review)).

---

## 1. Executive Summary

The template is a credible, well-structured full-stack starter: NestJS modular monolith split into domain packages, a Next.js BFF with HttpOnly-cookie sessions, a Vite admin, a Flutter client, Drizzle migrations, RBAC + permissions, audit logging, and end-to-end OpenAPI contract generation. Security fundamentals are mostly present and thoughtfully implemented (session-backed JWT with refresh rotation + reuse detection, Argon2id, strict global validation, Helmet, CORS, an exception filter that does not leak internals).

The intended authority model is now confirmed: **`USER`** = normal user, **`ADMIN`** = administrator scoped to one organization, **`SUPER_ADMIN`** = global manager. The code already encodes this (only `SUPER_ADMIN` bypasses RLS), which makes **multi-tenant isolation the dominant risk**: an org `ADMIN` bypasses ownership checks in services and is kept inside their organization *solely* by Row-Level Security. The current migration set has expanded RLS coverage beyond the original 4-table baseline, and the test harness now runs against a restricted app role and asserts that tenant-scoped queries execute under that non-superuser identity.

Secondary themes that still matter: **no Redis** (so rate limiting, SSE notification fan-out, and caching are single-instance only), package coupling, and mobile CI coverage.

Overall posture: **solid base, with one remaining high-risk tenancy proof and a few infrastructure gaps.**

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
2. **Cross-feature package coupling.** Feature packages import each other's internals (e.g. `projects.service.ts` imports `AttachmentsRepository` and `AuditService` from `api-platform`; jobs/exports reach into `api-identity`/`api-workspace`). The 2026-06-16 review measured 323 `turbo boundaries` issues, and a fresh `turbo boundaries` run still exposes the `api-identity` / `api-platform` / `api-workspace` cycle. The package *names* imply independence the code does not honor. Introduce ports/events (`AuditWriter`, `NotificationPublisher`, `UserLookup`) so features depend on `api-core` abstractions, not each other.
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
- **Imports/exports appear demo-scoped** (projects only); fine for a template but should be labeled as such.

---

## 4. Security Review

Trust boundaries inspected: browser↔BFF, BFF↔API, API auth/permission guards, API↔Postgres (RLS), file upload/download, mail/token issuance, secrets/config.

### SEC-1 — RLS isolation is now exercised under the restricted app role — **Resolved**
- **Coverage has expanded.** The current migrations add RLS policies for the original core tables and the remaining org-scoped tables (`0005_expand_organization_rls.sql`), so the original “4 of 13” gap is no longer accurate.
- **The runtime proof now exists.** `apps/api/test/support/test-app.ts` provisions a non-superuser `super_template_app` role, seeds and resets through the privileged role, then serves the test app through the restricted role; `tenant-isolation.e2e.spec.ts` also asserts `current_user` matches that app role before checking cross-org project visibility.
- **Admin org-confinement remains by design.** `ADMIN` still depends on RLS to stay inside its organization while `SUPER_ADMIN` bypasses the boundary. The current app-role test coverage is now the concrete evidence for that design rather than a missing proof point.

### SEC-2 — Per-route rate limiting is now present on auth endpoints — **Resolved**
The auth controller now uses strict `@Throttle` overrides on the sensitive routes, so the earlier “global-only throttling” finding no longer applies. The remaining scaling concern is distributed enforcement, not route coverage.

### SEC-3 — Upload validation has been hardened — **Resolved**
The file upload path now validates file type more defensively and returns downloads with attachment headers. The earlier “no allowlist / inline serving” statement is no longer current.

### SEC-4 — SSE refresh now persists rotated tokens — **Resolved**
The notifications stream route now writes rotated cookies back to the response, matching the main BFF refresh path.

### SEC-5 — CSRF tokens are now signed when configured — **Resolved**
The BFF now signs CSRF nonces with `CSRF_SECRET` when the secret is present and validates the signature on unsafe requests. In local/dev without the secret it still falls back to the previous token-only behavior, so the mechanism remains configurable without breaking existing environments.

### SEC-6 — Local storage downloads are now served through the file controller — **Resolved**
The files module now exposes an authenticated download route and the local storage path is covered by a signed token flow. The earlier “missing controller” statement is no longer current.

### SEC-7 — Login timing padding is now in place — **Resolved**
`login` now uses `verifyPasswordWithTimingPadding(...)` for both the missing-user and real-user paths, which removes the earlier measurable shortcut on unknown email. `forgotPassword`/`resendVerification` still keep neutral responses.

### SEC-8 — Web cookie flags are now config-driven — **Resolved**
The web BFF cookie layer now reads `COOKIE_SAMESITE`, `COOKIE_DOMAIN`, and `COOKIE_SECURE`/`NODE_ENV`, so cross-site and subdomain deployments no longer require code changes for the common cookie topology settings.

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
- **Route param validation is now mostly explicit.** The main UUID id routes in projects/files/jobs/admin-users/auth use `ParseUUIDPipe`, so the earlier blanket complaint no longer holds. Any remaining gaps should be treated as isolated leftovers, not a systemic issue.
- **Multi-step writes still mix concerns.** `FilesService.upload` writes to object storage *before* the DB insert but does compensate by deleting the object on failure (`files.service.ts:90`) — acceptable. `delete` removes the DB row before storage and throws if storage cleanup fails, diverging state. Exports/notification-jobs flows still lack idempotency keys; partial failure can orphan files or duplicate sends.
- **Tracked artifacts have been cleaned up.** The previously committed runtime upload and `tsconfig.tsbuildinfo` files are no longer in the tree; keep them out via `.gitignore`/CI if they reappear.
- **Config parity is tighter.** `.env.example` now matches the active web/API schema more closely; keep future sample keys wired into validation before adding them.

---

## 6. Prioritized Gaps & Recommendations

| # | Severity | Area | Gap | Recommendation |
|---|----------|------|-----|----------------|
| 1 | High | Security/Arch | RLS runtime proof under restricted app role | Resolved in current test harness and CI |
| 2 | Medium | Infra/Scale | No Redis — in-memory throttler, in-process SSE fan-out, no shared cache | Add Redis; back throttler + SSE pub/sub + access-profile cache |
| 3 | Medium | Arch | Cross-feature package coupling (323 boundary issues) | Ports/events via `api-core`; enforce `turbo boundaries` in CI |
| 4 | Low | Security | CSRF token integrity | Resolved in current web BFF path |
| 5 | Low | Security | Login timing enumeration | Resolved in current code path |
| 6 | Low | Security | Web cookie flags ignore env | Resolved in current web BFF path |
| 7 | Low | Quality | Remaining `ParseUUIDPipe` gaps, if any | Audit the few leftover id routes and normalize them |
| 8 | Low | Quality/Repo | Tracked upload + tsbuildinfo artifacts | Keep them out of the tree; CI check on generated files |
| 9 | Low | CI | Mobile not verified | Resolved in current CI workflow |
| 10 | Low | Config | Orphan `.env.example` keys | Resolved in current env example |

---

## 7. Changes Since the 2026-06-16 Review

Resolved:
- **Graceful shutdown** — `app.enableShutdownHooks()` now called (`main.ts:25`).
- **Throttler wired and scoped** — `ThrottlerModule` + global `ThrottlerGuard` are registered, and sensitive auth routes now have explicit `@Throttle` overrides.
- **Atomic refresh rotation** — `updateSessionIfMatches` is a CAS on `id + refreshTokenHash + revokedAt IS NULL` (`auth.repository.ts:74`).
- **CI quality gates enforced** — `ci.yml` runs lint, typecheck, API tests, web tests, build, and Playwright E2E.
- **Restricted test role** — API e2e now executes under a dedicated non-superuser DB role, with an explicit `current_user` assertion in tenant isolation tests.
- **Mobile CI added** — `ci.yml` now also runs Flutter format, analyze, and test in a dedicated mobile job.
- **Modularization** — backend split from `apps/api/src/modules/*` into `packages/api-*`.
- **Local download path** — authenticated file download exists in the files module.
- **SSE refresh cookies** — notification stream refresh now persists rotated cookies.

Still open: package boundaries (P1), some transactional/idempotency gaps (P1), Redis / single-instance scaling (P1).

Open question now answered: admin roles are **org-scoped** (`ADMIN`) vs **global** (`SUPER_ADMIN`), with `USER` as the normal role — see §2.1 and SEC-1.

---

## 8. Verification Notes & Residual Risk

- This review is static, but the highest-impact tenancy proof now exists in the test harness and CI: the API e2e path runs under a restricted role and asserts the active database user before checking isolation.
- No secrets, tokens, or customer data were copied into this document.
- Recommended next commands:
  - `pnpm lint && pnpm typecheck && pnpm --filter api test && pnpm --filter web test` (confirm gates are green on current tree)
  - Keep the restricted-role cross-tenant RLS integration test in CI — assert that an org-`A` **`ADMIN`** cannot read/modify org-`B` projects/files (the strongest test of the authority model)
  - `pnpm exec turbo boundaries` (quantify current coupling; current runs still fail on the `api-identity` / `api-platform` / `api-workspace` cycle)
  - Add Redis to `infra/docker-compose.yml` and back the throttler, SSE fan-out, and access-profile cache before any multi-instance deployment
