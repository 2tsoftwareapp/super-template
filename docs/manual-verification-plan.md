# Manual Verification Plan — Core Features

> Purpose: a hands-on checklist to manually verify each core feature works **and** that the tenant-isolation guarantees actually hold. Built from the deep review on 2026-06-18.
>
> Legend: `[ ]` to do · `[x]` passed · `[!]` failed (note it)

## How to read this

Each item has: **What** · **How** (steps/commands) · **Expect** (pass criteria). The 🔴 markers flag the high-risk gaps from the review — verify those carefully, they are the ones most likely to fail.

## 0. Environment setup

- [ ] **Infra up** — `docker compose -f infra/docker-compose.yml --env-file .env up -d postgres redis mailpit`
- [ ] **Migrate** — `pnpm --filter @repo/api db:migrate` (or `make ...`) completes without error
- [ ] **Seed** — seed runs; default users exist (`admin@example.local`, `user@example.local`, password `ChangeMe123!`)
- [ ] **API up** — `pnpm --filter @repo/api dev`; `GET http://localhost:3001/api/v1` reachable
- [ ] **Swagger** — `http://localhost:3001/api/docs` loads (non-prod only)
- [ ] **Note which DB role you are running as** — `psql $DATABASE_URL -c "select current_user, (select rolsuper from pg_roles where rolname=current_user)"`
  - 🔴 If `rolsuper = t` (default `postgres`), **RLS is bypassed** — every isolation test below will pass for the wrong reason. Re-run the isolation sections against a restricted, `NOSUPERUSER` `NOBYPASSRLS` role to get a real result.

---

## 1. Authentication & sessions

- [ ] **Register** — `POST /api/v1/auth/register` with new email → `200`, success message; no tokens returned yet (verification required)
- [ ] **Verification email** — check Mailpit (`http://localhost:8025`); a verify link with `?token=` arrives
- [ ] **Login blocked before verify** — `POST /api/v1/auth/login` → `403` "Verify your email"
- [ ] **Verify email** — `POST /api/v1/auth/verify-email` with token → success; user becomes `ACTIVE`; welcome email arrives
- [ ] **Login** — `POST /api/v1/auth/login` → `200` with `accessToken`, `refreshToken`, `user`, `permissions`, `organizationId`, `session`
- [ ] **Wrong password** — → `401` "Invalid email or password" (same shape whether or not email exists — enumeration safe)
- [ ] **Blocked user** — set a user `BLOCKED`, login → `403` "blocked"
- [ ] **`GET /auth/me`** with access token → current profile, roles, permissions, `sessionId`, `organizationId`
- [ ] **Refresh** — `POST /api/v1/auth/refresh` with refresh token → new access + refresh; old refresh token now rejected (rotation)
- [ ] 🔴 **Refresh reuse** — submit the *old* refresh token after a refresh → `401` reuse detected, **session revoked** (subsequent refresh with the latest token also fails)
- [ ] **Concurrent refresh race** — fire two refreshes with the same token near-simultaneously → one succeeds; the other returns a clean `401`, **not a 500**
- [ ] **Logout** — `POST /auth/logout` → session revoked; reusing its access token → `401`
- [ ] **Logout all** — `POST /auth/logout-all` → all sessions for the user revoked
- [ ] **List sessions** — `GET /auth/sessions` → array; the current session has `current: true`
- [ ] **Revoke a session** — revoke another session by id → that session's tokens stop working
- [ ] **Forgot password** — `POST /auth/forgot-password` for existing + non-existing email → **identical** success response both times; reset email only sent for the real account
- [ ] **Reset password** — use token → password changes; **all sessions revoked**; old password rejected; new works
- [ ] **Access after user deactivated** — set user non-`ACTIVE`, hit any protected route with a still-valid JWT → `403` (session check runs every request)

## 2. Authorization (RBAC)

- [ ] **User cannot reach admin routes** — `user@example.local` → `GET /api/v1/admin/users` → `403`
- [ ] **Admin can** — `admin@example.local` → `GET /api/v1/admin/users` → `200`
- [ ] **Permission-gated route** — call a route requiring a permission the role lacks → `403` "do not have permission"
- [ ] **Privileged-account protection** — as a non-SUPER_ADMIN admin, try to edit/assign roles on a SUPER_ADMIN account → `403` "Only SUPER_ADMIN can manage privileged…"
- [ ] **Granting privileged role blocked** — non-SUPER_ADMIN tries to assign SUPER_ADMIN/privileged role → `403`
- [ ] **Role change invalidates cache** — change a user's roles; that user's next request reflects new permissions (no stale access-profile cache)

## 3. Multi-tenant isolation (RLS) 🔴

> Run this whole section against a **restricted DB role** (see step 0). Under superuser it proves nothing.

- [ ] **Confirm enforcing role** — the running API reports a non-superuser `current_user` (see existing `tenant-isolation.e2e.spec.ts` `getCurrentDatabaseUser`)
- [ ] **List orgs** — `GET /api/v1/organizations` → user's own org(s), `current: true`, `role: OWNER`
- [ ] **Cross-org project read blocked** — Org A admin cannot read Org B's project (`404`/empty), and vice versa
- [ ] **Cross-org write blocked** — attempt to create/update a row referencing another org's id → rejected (RLS `WITH CHECK`)
- [ ] **Switch organization** — `POST /auth/switch-organization` to an org the user belongs to → new access token scoped to that org; data set changes accordingly
- [ ] **Switch to non-member org blocked** — switch to an org you are not a member of → `403`/forbidden
- [ ] **RLS-covered tables** — spot check each: `projects`, `files`, `notifications`, `attachments`, `jobs`, `invitations`, `import_jobs`, `export_jobs`, `comments`, `activities`, `audit_logs`, `notification_jobs` — Org A cannot see Org B rows
- [ ] **Raw DB sanity** — as the restricted role with `app.tenant_id` set to Org A, `select count(*)` on each table returns only Org A rows

## 4. Background jobs & notifications 🔴 (highest-risk area)

> The cron workers run with **no tenant context**. Under a restricted role this is expected to fail today — verify explicitly.

- [ ] **Org-null job runs** — enqueue a job with `organizationId = null` → processed within ~1 min (`@Cron EVERY_MINUTE`), status `COMPLETED`
- [ ] 🔴 **Tenant-scoped job runs** — enqueue a job with a real `organizationId`; wait for the cron tick
  - Under **restricted role**: EXPECT IT TO FAIL today (job never claimed, or marked `FAILED` on notification insert). Record the actual outcome.
  - Under **superuser**: it will appear to work (RLS bypassed) — not a valid result for this check.
- [ ] 🔴 **Notification fan-out** — enqueue a notification job for an org with several recipients → each recipient gets a `notifications` row
  - Under restricted role: EXPECT failure (insert blocked by `WITH CHECK`). Record outcome.
- [ ] **Job retry** — make a handler throw once → job requeues and retries up to `maxAttempts`, then `FAILED` with message
- [ ] **No handler** — enqueue an unknown job type → marked `FAILED` "No handler registered"
- [ ] **Notification stream / SSE** — subscribe; trigger a notification → delivered live
- [ ] **Device token / push** — register a device token; verify FCM path is invoked (or stubbed) on send

## 5. Idempotency 🔴

- [ ] **Repeat enqueue (sequential)** — enqueue the same `idempotencyKey` (with a `createdById`) twice → second returns the **same** job, no duplicate
- [ ] 🔴 **Concurrent enqueue (race)** — fire two requests with the same `idempotencyKey` simultaneously → both return the same job; **neither returns 500** (today this is expected to 500 on the unique-index violation — record it)
- [ ] **No `createdById`** — enqueue with `idempotencyKey` but null `createdById` → note that dedup is skipped (two jobs created); confirm whether that's acceptable
- [ ] **Imports / exports idempotency** — repeat an import and export request with the same key → no duplicate job

## 6. Rate limiting

- [ ] **Global throttle** — exceed 120 req/min from one client → `429`
- [ ] 🔴 **Auth brute-force** — hammer `POST /auth/login` with wrong passwords → note how many attempts are allowed before `429` (currently only the global 120/min applies; flag if too permissive)

## 7. Platform features (smoke)

- [ ] **File upload** — upload within size/type policy → stored; oversize/wrong-type → rejected
- [ ] **File download URL** — generated link works; cross-org file not downloadable
- [ ] **Attachments** — attach to an entity; list returns only same-org attachments
- [ ] **Settings** — admin reads/writes settings; non-admin blocked
- [ ] **Mail deliveries** — admin can list deliveries; entries appear after auth emails
- [ ] **Audit log** — `auth.login.succeeded`, `auth.registered`, role changes, etc. recorded; cross-org audit rows not visible
- [ ] **Comments / activities** — create, list scoped to org; moderation permission enforced
- [ ] **Invitations** — create invite (permissioned), accept flow lands the user in the right org

## 8. Cross-cutting / hardening

- [ ] **CORS** — request from a non-allowed origin is rejected; allowed origin works with credentials
- [ ] **Helmet headers** — security headers present on responses
- [ ] **Payload limit** — `>1mb` body → `413`
- [ ] **Validation** — unknown/extra fields rejected (`forbidNonWhitelisted`)
- [ ] **Error envelope** — errors return the standard shape with an error code; no stack traces leak in production mode
- [ ] **Web CSRF** — the web BFF rejects mutating requests with a missing/invalid signed CSRF token; accepts valid ones
- [ ] **Swagger disabled in prod** — with `NODE_ENV=production`, `/api/docs` is not served

## 9. Clients (smoke)

- [ ] **Web** (`:3000`) — login, see data, switch org, logout
- [ ] **Admin** (`:3002`) — login as admin, user/role tables load, mutations work
- [ ] **Mobile** (Flutter) — `bootstrap.dart` path: app boots, login, token refresh on expiry, secure storage persists session

---

## Known gaps to confirm (from review 2026-06-18)

| # | Severity | Gap | Where to see it |
|---|----------|-----|-----------------|
| 1 | P0 | RLS bypassed under default superuser `DATABASE_URL` | §0, §3 |
| 2 | P0 | Tenant-scoped cron jobs/notifications fail under restricted role (no tenant context in workers) | §4 |
| 3 | P1 | Idempotency race returns 500 instead of existing job; skipped when `createdById` null | §5 |
| 4 | P2 | Auth endpoints only covered by coarse global throttle | §6 |
| 5 | P2 | Refresh CAS-loss path doesn't revoke session | §1 |

Mark each section as you go; capture any `[!]` with the actual response/status so the fixes can be scoped.
