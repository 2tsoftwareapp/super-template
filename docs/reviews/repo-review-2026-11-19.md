# Repository review — super-template

**Date:** 2026-11-19
**Scope:** whole repository — `apps/{api,worker,admin,web,mobile}`, `packages/*`, root config, `scripts/*`, `.github/workflows`, and the normative docs (`ARCHITECTURE_RULES.md`, ADRs, `REVIEW.md`).
**Method:** static review plus the repo's own non-TS policy scripts. At review time `node_modules` was absent and `pnpm` was not on `PATH`, so **no install, build, typecheck or test ran during the review itself**; §0 records the verification done after the fixes. Every finding cites the code that produces it; items inferred rather than read are labelled *unverified*.

---

## 0. Resolution status (2026-11-19, same day)

All 42 findings were actioned. Verification after the fixes:

| Gate | Result |
| --- | --- |
| `pnpm run check` (`lint:policy` + ESLint + typecheck + unit tests) | **pass** — 44/44 turbo tasks, 50 packages |
| `pnpm run format:check` | **pass** |
| `scripts/__tests__` guards | **now executed** — 47 node tests + 15 vitest tests |
| `turbo boundaries` | **pass** with the four new tag manifests |
| `admin` / `web` / `api` / `feature-upload` suites | pass (new regression tests for the CSV proxy, local-download capability token, URL redaction, bulk results) |
| Web production build | pass via `next build --webpack`; the Turbopack path could not run here because the local pnpm store is missing the `@next/swc-darwin-arm64` native binary (environment, not code) |
| Flutter (`apps/mobile`) | **not executed** — no Dart/Flutter toolchain on this machine. Every Dart change is static-only and must be validated with `pnpm run mobile:check` |
| Postgres e2e suites | **not executed** — no database/Docker session in this environment |

Deliberate deviations from the reviewer's suggested fix:

- **A1** clears cookies only for session-level 401s. `AUTH_INVALID_CREDENTIALS` is also a 401 and means "wrong current password"; clearing there would sign the user out of the rotation form.
- **B6** keeps the authenticated `/files/:id/download` route untouched and adds a public `/files/:id/download/local` capability route instead. Making the existing route public would have exposed S3 downloads without a token.
- **M2** drops `myapp://invite` links instead of routing to a non-existent `/invite` screen.
- **B3** initialises Redis eagerly but non-blocking (`void ensureRedis()`); `await` in `onModuleInit` blocked host bootstrap whenever Redis was unreachable — the bootstrap matrix tests caught it.
- **F7** returns `null` in production builds rather than throwing, so an unset `NEXT_PUBLIC_*` hides the link instead of failing `next build` in CI.

---

## 1. Verdict

The repository is in unusually good shape structurally: the layered feature/plugin architecture is real, not aspirational, and the code is free of the usual escape hatches (see §2). The defects found are narrow and specific, not systemic.

Shipping blockers are few but real:

| ID | Severity | Area | Defect |
| --- | --- | --- | --- |
| A1 | **P0** | admin | Password change always returns 401 — users forced to rotate their password cannot use the app at all |
| B1 | P1 | upload | Storage cleanup loops forever on one failing object delete |
| B2 | P1 | auth | Login / refresh / MFA read the security decision from the read replica *(only when the read-replica capability is enabled)* |
| B3 | P1 | notifications | Notifications created by the worker are never published to Redis |
| F1 | P1 | admin | Audit-log CSV export downloads the literal text `null` |
| C1 | P1 | CI | A worker-only change runs **zero** CI jobs |
| C2 | P1 | tooling | `lint:policy` passes silently when `ripgrep` is missing |
| C3 | P1 | CI | `database-topology.e2e.spec.ts` never runs in CI |

Counts across the whole review: **P0 = 1, P1 = 7, P2 = 23, P3 = 11** (42 findings).

---

## 2. What is genuinely solid (verified, not assumed)

These are the reasons the findings below are scoped narrowly rather than read as "the repo is a mess":

- **Few type-safety escape hatches.** 0 explicit `any` in the policy-checked scope, 0 `@ts-ignore`/`@ts-nocheck`, 23 `eslint-disable` lines in ~96k LOC (each with a stated reason), 0 `TODO`/`FIXME`. `as unknown as` appears 18 times outside tests — mostly the idempotency-record JSON boundary (e.g. `batch-delete-files.use-case.ts:35,61,71,87`), so it is a rough edge, not a pattern.
- **No dead or disabled tests.** 0 skipped suites (`*.skip`), 290 spec files.
- **Boundaries hold.** 0 wildcard exports, 0 deep cross-package imports (`@repo/x/src/...`), 0 feature→app imports, 0 framework imports in `api-kernel`, 0 business tables in `database-runtime`. 44 of 50 workspaces carry a turbo tag manifest (see C10 for the exceptions).
- **Security defaults are deliberate.** `helmet`, CORS from configured origins, `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`, body-size limits, global throttler → auth → authorize guard ordering (`apps/api/src/composition/global-pipeline.ts`), argon2 hashing, hashed refresh tokens with rotation CAS, httpOnly access/refresh cookies + CSRF for mutations, RLS with `FORCE`, stack traces only outside production (`app-exception.filter.ts:70`), no `sql.raw`/`eval`/`dangerouslySetInnerHTML` with user data, no tokens in `localStorage`.
- **Committed `.env.development` is non-secret** (dev defaults only), matching the `.gitignore` contract.
- **Capability variants are intentional.** `feature-tenant-schema`, `feature-tenant-shared-schema`, `feature-org-model-personal-orgs`, `feature-database-read-replica` are not in the default registry because `create:project` selects them (`docs/architecture/feature-dependency-graph.md` §"Capability variants"). They are not dead code.

---

## 3. P0

### A1 — Admin password change never sends the access token

`apps/admin/src/app/api/users/me/password/route.ts:15-20`

```ts
const response = await callBackend({
  path: "users/me/password",
  method: "PATCH",
  headers: new Headers({ "content-type": "application/json" }),
  body,
});
```

`callBackend` only sets `authorization: Bearer …` when passed `accessToken` (`packages/web-server/src/server/backend.ts:128-136`); this route never reads the cookies. The backend endpoint is authenticated — `packages/feature-user-management/src/presentation/users.controller.ts:48-56` uses `@CurrentUser()` — so the call always 401s.

**Impact:** password change is non-functional for every admin user. Users flagged `mustChangePassword` are redirected to exactly this form from every other path (`apps/admin/src/features/auth/model/admin-guard.state.ts:51-53`), so they are locked out of the admin app entirely.

**Fix:** read `accessToken` via `readAuthCookies()` and pass it, mirroring `apps/admin/src/app/api/auth/switch-organization/route.ts:22,42`; clear session cookies on 401 so the user lands on login instead of retrying the form.

---

## 4. P1

### B1 — Storage cleanup never terminates when one delete keeps failing

`packages/feature-upload/src/storage/application/storage-cleanup.service.ts:82-101`

```ts
for (;;) {
  const orphans = await this.platformTransactionPort.run((tx) =>
    this.tracking.listOrphans(cutoff, ORPHAN_BATCH_SIZE, tx),
  );
  if (orphans.length === 0) break;
  for (const storageKey of orphans) {
    try { await this.objectStorage.delete(storageKey); swept += 1; }
    catch { /* Handled via the outbox; keep sweeping the rest. */ }
  }
}
```

`listOrphans` selects rows still `status = 'UPLOADED'` (`storage-tracking.repository.ts:59-77`). The tracked wrapper marks the row `DELETED` only on success and otherwise records an outbox retry (`tracking-object-storage.service.ts:43-52`), leaving the ledger row unchanged. The swallowed error therefore re-queries the same batch, forever, inside one cron invocation.

**Impact:** one persistent failure (bucket policy, foreign-owned object, unwritable local path) pins the worker in a tight DB + storage loop; `processDeleteOutbox()` is never reached and no progress is possible without a restart. Related: `claimPendingDeletes` (`storage-tracking.repository.ts:86-110`) claims by `updated_at = now()` without a `PROCESSING` transition or `scheduled_at` filter, so retries burn `max_attempts` in one burst with no backoff.

**Fix:** make the sweep progress-driven (break when a batch produced no successful delete, or cap work per invocation); give the outbox a claimed state and backoff.

### B2 — Replica reads decide whether a credential is valid *(conditional: read-replica profile)*

`packages/feature-users/src/infrastructure/users.repository.ts:86-107`

`findById`/`findByEmail` default to the composed client, which routes plain selects to the replica when the capability is enabled (`packages/database-runtime/src/database.types.ts:33-38`, `withReplicas(primary, [replica], () => replica)`). `findByIdStrong` exists and is used for access-token authentication (`authenticate-access-token.use-case.ts:54`), but not here:

- `login.use-case.ts:28` → `findByEmail` (verifies `password_hash`)
- `refresh-session.use-case.ts:83` → `findById` (checks `status`)
- `complete-mfa-login.use-case.ts:33` → `findById` (checks `status`)

**Impact (replica profile only):** for the replication-lag window, an old password still authenticates after a reset, and a blocked account keeps receiving tokens on refresh. In the default profile the client is the primary, so the bug is latent — but the generator offers `--read-replica` as a supported topology.

**Fix:** `findByIdStrong` in refresh/MFA, add a primary-backed `findByEmailStrong` for login, and comment each call site as authorization-relevant.

### B3 — Worker-produced notifications are dropped

`packages/feature-notifications/src/infrastructure/notification-stream.service.ts:42-63`

```ts
async onModuleInit() {
  // await this.ensureRedis();
}
emit(...) {
  if (!this.redisPublisher) { this.getSubject(...).next(event); return; }
  void this.publish(...);
}
```

Redis is initialized only from `stream()` (line 61). A worker process never serves SSE, so `redisPublisher` stays `null` and every notification it produces goes to a local `Subject` with no subscribers. API instances have the same hole until their first SSE connection.

**Fix:** `await this.ensureRedis()` in `onModuleInit`; treat "no `REDIS_URL`" as the only local-fallback case; add a test asserting `emit` publishes without an open stream.

### F1 — Audit CSV export is silently corrupted

`packages/web-server/src/server/backend.ts:164-165`

```ts
const payload = await parseJson<ApiEnvelope<JsonValue>>(response);
const nextResponse = NextResponse.json(payload, { status: response.status });
```

`parseJson` returns `null` for any non-JSON content type (`:13-21`). The audit export is served as `text/csv` (`packages/feature-audit-export/src/presentation/audit-export.controller.ts:79-81`) and downloaded through the generic BFF proxy (`apps/admin/src/features/audit-logs/api/audit-logs.api.ts:35-40` → `apps/admin/src/app/api/bff/[...path]/route.ts:40`). The proxy re-serializes `null` and drops `Content-Disposition`.

**Impact:** the export "succeeds" with a 200 and a `.csv` filename whose contents are `null` — a compliance artifact that is silently wrong.

**Fix:** in `proxyWithRefresh`, stream non-JSON responses through (`new Response(response.body, { status, headers })`) instead of JSON-serializing them.

### C1 — A worker-only PR runs no CI at all

`.github/workflows/ci.yml:36-62` defines `backend` (`apps/api/**`, `packages/*/**`, `scripts/**`, root configs), `frontend`, `api_e2e`, `mobile`. Nothing matches `apps/worker/**`, and every job is gated on those outputs (`ci.yml:66,138,268,361,457`). The worker owns real checks — `build`, `lint`, `test`, `typecheck` and two specs (`apps/worker/test/*.spec.ts`) — none of which CI runs for a worker-only diff. `README.md`'s layout block also omits `apps/worker`.

**Fix:** add `- 'apps/worker/**'` to the `backend` filter (it already covers `packages/*` and `scripts`), or add a dedicated worker job.

### C2 — `lint:policy` passes without `ripgrep`

`scripts/check-source-policy.sh:26-39`: when `rg` is absent, `search_matches` falls through to a bare `true`, and `check_policy` reads empty output as clean (`:44-52`). The direct `rg` calls at `:61,73,86,93,99` collapse to "no match" the same way. `scripts/check-package-cycles.sh:18-44` wraps its whole body in `if command -v rg` and exits 0.

**Impact:** on a machine without ripgrep (stock macOS), `pnpm lint` and `pnpm verify` report green while none of the source-policy rules ran. CI images carry `rg`, so this is a local false green — the precise failure the gate exists to prevent.

**Fix:** fail closed at the top of both scripts (`command -v rg >/dev/null || { echo "rg required" >&2; exit 1; }`), or implement and maintain a `grep` fallback.

### C3 — `database-topology.e2e.spec.ts` is not in the CI suite

`apps/api/test/` holds 15 e2e specs; `.github/workflows/ci.yml:340-357` enumerates 13 by name. `health.e2e.spec.ts` is excluded on purpose and documented; `database-topology.e2e.spec.ts` is simply missing (the comment still says "the other 12"). It is the only end-to-end exercise of the primary/replica split.

**Fix:** use a glob with explicit, commented exclusions instead of a hand-maintained list.

---

## 5. P2

| ID | Location | Defect |
| --- | --- | --- |
| B4 | `request-logger.middleware.ts:21`, `app-exception.filter.ts:66` | Logs `originalUrl` including query strings — SSO `code`/`state` and file download `token` land in logs/Sentry, contra §33 |
| B5 | `attachments.controller.ts:55`, `list-attachments.use-case.ts:18`, `attachments.repository.ts:34` | Attachment listing takes no actor/organization; RLS is the only fence, and `bypassRls` for SUPER_ADMIN removes even that |
| B6 | `files.controller.ts:163`, `local-file-download-url.service.ts:21` | Local driver returns a URL that requires Bearer auth; browser `window.open` sends none → 401 on the default driver |
| B7 | `resolve-organization-id-for-user.use-case.ts:28-35` | Bare `catch` turns any infrastructure failure into "use primary org" — a transient error silently relocates the session's tenant |
| F2 | `use-bulk-mutation.ts:17-25` | Mixed bulk results resolve silently; `successMessage` is never used; block path clears selection before awaiting |
| F3 | `apps/admin/src/app/api/notifications/stream/route.ts:12-16` | SSE proxy never refreshes: stream dies after `JWT_ACCESS_TTL=15m` and `EventSource` retries 401s forever |
| F4 | `packages/web-ui/src/components/error-state.tsx:26-41` | Inline variant ignores `description` (callers pass security-relevant copy) |
| F5 | `files-table-columns.tsx:66`, `notifications-table-columns.tsx:116`, `setting-card.tsx:61,146`, `mfa-setup-flow.tsx:87` | Icon-only destructive controls have no accessible name |
| F6 | `use-resource-table-config.ts:91-99` | Selection clears on page/sort but not on filter/search — bulk block can target invisible rows |
| M1 | `apps/mobile/android/.../AndroidManifest.xml:2-5`, `env/dev.json:3` | No cleartext opt-in while dev points at `http://10.0.2.2:3001` → Android dev builds cannot reach the API |
| M2 | `deep_link_listener.dart:77-101`, `AndroidManifest.xml:31-32` | `myapp://verify-email?token=…` puts the route in the host, so `pathSegments` is empty → link dropped; manifest only matches host `sso` |
| M3 | `router.dart:41-44` | `GoRouter` is rebuilt on every auth-state emission; `switchOrganization` sets `AsyncLoading` → user bounced to `/splash` then `/home` |
| M4 | `test/router_redirect_test.dart:3-16`, `test/login_validation_test.dart:3-5` | Tests re-implement logic instead of importing it; `isValidLogin` does not exist in `lib/` — the auth-gate branch has no real coverage |
| M5 | `ios/Runner.xcodeproj/project.pbxproj:488,671,694` | `DEVELOPMENT_TEAM = ZG4LJ9HHX8` pinned to the author's team; `rename.mjs` does not rewrite it |
| M6 | `android/app/build.gradle.kts:34-40` | Release build types signed with the debug keystore (documented, but unguarded — Play rejects it and sideload updates are forgeable) |
| M7 | `auth_repository.dart:54-67` | A transient network error at cold start is treated as "logged out": valid tokens survive but the user is sent to login |
| C4 | `scripts/__tests__/*` | Six guard tests (`create-project`, `migration-tooling`, `rename`, `ghost-dependencies`, …) have no runner; two docs cite them as verification |
| C5 | `package.json:42` | `check:feature-indexes` exists but no gate invokes it, while `NAMING_CONVENTIONS.md:315` presents it as the guard |
| C6 | `ARCHITECTURE_RULES.md:1501-1503` | Documents `scaffold:api-feature`, `scaffold:admin-feature`, `scaffold:web-feature`; only `scaffold:feature` exists |
| C7 | `ARCHITECTURE_RULES.md:689,698` | Points composition at `apps/api/src/composition/feature-registry.ts`, which is a 5-line re-export; the real registry is `packages/app-composition/src/feature-registry.ts` |
| C8 | `apps/admin/eslint.config.mjs:72-79,158-161` | Two boundary rules demoted to `warn` citing "pre-existing violations" that no longer exist (0 matches); `apps/web` enforces the same rules as errors |
| C9 | `scripts/check-package-cycles.sh` | Contains no cycle detection and duplicates the "features must not import apps" rule already in `check-source-policy.sh` |
| C10 | 3 capability packages + `apps/worker` | No `turbo.json`, so they sit outside the boundary matrix; `apps/worker` is a composition root and could reach feature internals with no gate firing |

---

## 6. P3

| ID | Location | Defect |
| --- | --- | --- |
| F7 | `landing-config.ts:6-8`, `verify-email-config.ts:1` | `NEXT_PUBLIC_*` fall back to `http://localhost:*`; a missing value ships localhost links to production |
| F8 | `auth.constants.ts:9-16` | Seeded admin credentials are prefilled when `NEXT_PUBLIC_APP_ENV=development`, a flag inlined into the client bundle |
| F9 | `use-debounced-url-search.ts:86-91` | URL→local adoption can overwrite in-flight typing (logic-derived, not reproduced) |
| B8 | `admin-mail.controller.ts:64`, `template-renderer.service.ts:109` | `:templateKey` not checked against the known keys before `join(templatesDir, …)` — traversal limited to reading a co-located template triple |
| B9 | `auth.guard.ts:48-50` | `process.env.NODE_ENV === "test"` branch in production code lets a client null its own `organizationId` |
| B10 | `database.provider.ts:119-124` | Release-on-error path hands the caller an already-released client alongside the error |
| B11 | `process-jobs.use-case.ts:279-289` | `withTimeout` cannot cancel the handler; a timed-out attempt may still be writing while it is retried |
| B12 | `delete-organization.use-case.ts:117-120` | Per-member cache invalidation instead of the existing batched `invalidateUsers` |
| C11 | `packages/web-ui/src/index.ts:1` | Catch-all barrel with zero consumers; 11 declared subpaths are never imported |
| C12 | `scripts/generate-contracts.sh:33-45` | `generate:check` exits 0 when Docker or Dart is missing, so stale Dart output is not caught locally |
| M8 | `auth_interceptor.dart:33`, `token_storage.dart:12` | Two sequential secure-storage reads per request, no in-memory cache |

---

## 7. Verification status

| Check | Result |
| --- | --- |
| `check-source-policy.sh` rule patterns (re-run manually with `rg`) | clean: 0 `any`, 0 `@boundaries-ignore`, 0 wildcard exports, 0 `pgTable` in `database-runtime`, 0 framework imports in `api-kernel`, 0 feature→app imports |
| `node scripts/check-error-codes.mjs` | **passed** — 14 catalogs, 11 shared codes, 0 disallowed literal raise sites |
| `node scripts/check-package-cycles.sh` | passed (see C9/C2 — it cannot fail for a cycle and no-ops without `rg`) |
| TS/AST-based scripts (`check-cross-feature-fks`, `check-domain-purity`, `check-feature-manifest-deps`) | **not run** — they import the `typescript` package and `node_modules` is absent |
| `pnpm lint` / `typecheck` / `test` / `build` / `verify` | **not run** — no install performed. The P0/P1 fixes should be validated with `pnpm install && pnpm --filter api test && pnpm run verify` once dependencies are available |
| Mobile (Dart) | **not run** — no `flutter`/`dart` toolchain assumed; all mobile findings are static |

---

## 8. Recommended order of work

1. **A1** — one-line fix, unblocks every admin user.
2. **F1, C1, C2, C3** — small, mechanical, and each closes a gate that currently reports green while broken.
3. **B1, B3** — worker correctness; both are silent failures with unbounded or invisible consequences.
4. **B2** — fix before `create:project --read-replica` is used in anger.
5. **B4–B7, F2–F6** — the P2 cluster; B4 and B5 are the security-relevant ones.
6. **M-series and C4–C10** — template quality: they cost adopters time (deep links, signing, boundary docs) rather than corrupting data today.

Once items are accepted, fold them into `REVIEW.md` (the live backlog) so the next review does not re-derive them.
