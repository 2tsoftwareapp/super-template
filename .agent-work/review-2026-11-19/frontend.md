# Frontend Review — 2026-11-19

**Scope:** `apps/web`, `apps/admin`, `packages/web-ui`, `web-hooks`, `web-server`, `web-utils`, `web-test`.
**Method:** static reading + `rg`/`find` only. No installs, builds, tests, or typecheck were run (node_modules absent, pnpm not on PATH). Every finding below was read in the source at the cited lines; nothing is reported from assumption alone.
**Severity:** P0 = blocks a core flow / security control for all affected users. P1 = feature produces wrong output every time. P2 = wrong or degraded behavior in a realistic scenario. P3 = latent misconfiguration / lower-impact defect.

**Totals:** P0: 1 · P1: 1 · P2: 5 · P3: 3 (10 findings).

---

## P0

### 1. Change-password BFF never forwards the access token — password change always 401s, forced-rotation users are locked out
**Location:** `apps/admin/src/app/api/users/me/password/route.ts:15-20`

```ts
  const response = await callBackend({
    path: "users/me/password",
    method: "PATCH",
    headers: new Headers({ "content-type": "application/json" }),
    body,
  });
```

**Problem:** `callBackend` only sets `authorization: Bearer …` when an `accessToken` argument is supplied (`packages/web-server/src/server/backend.ts:134-136`). This route never passes one, and it never reads the cookie — unlike every other authenticated admin BFF route, e.g. `apps/admin/src/app/api/auth/switch-organization/route.ts:22` (`const { accessToken, csrfToken } = await readAuthCookies();`) then `:42` (`accessToken,`). The backend endpoint is guarded: `packages/feature-user-management/src/presentation/users.controller.ts:48-51` declares `@Patch("me/password")`, `@AllowMustChangePassword()`, `@CurrentUser()`, so an unauthenticated call is rejected.

**Impact:** `PATCH /api/users/me/password` returns 401 for every user, so password change is non-functional. Worse, users flagged `mustChangePassword` are force-redirected to `/security/password` from every other path (`apps/admin/src/features/auth/model/admin-guard.state.ts:51-53`), so they can neither dismiss the redirect nor complete the change — the admin app is unusable for them. The client only shows the generic 401 toast (`apps/admin/src/features/security/controllers/use-change-password-controller.ts:23-29`), which reads as "session expired", hiding the real cause.

**Fix:** read the cookies and pass the token: `const { accessToken, csrfToken } = await readAuthCookies();` then `accessToken` (and `csrfToken` if the backend rotates it) into `callBackend`; clear session cookies on 401 so the user lands on login instead of looping on the form.

---

## P1

### 2. CSV export through the JSON-only BFF proxy downloads the literal text `null`
**Location:** `packages/web-server/src/server/backend.ts:164-165` (with `:13-21`)

```ts
    const payload = await parseJson<ApiEnvelope<JsonValue>>(response);
    const nextResponse = NextResponse.json(payload, { status: response.status });
```

**Problem:** `parseJson` returns `null` unless the upstream `content-type` contains `application/json` (`backend.ts:16-18`). `proxyWithRefresh` then re-serializes `null` as a JSON body, discarding the upstream bytes and headers. The audit-log CSV download is routed through exactly this proxy: `apps/admin/src/features/audit-logs/api/audit-logs.api.ts:35-40` calls `webFetchBlob(bffPath("/api/v1/admin/audit-logs/exports/{fileId}/download"))`, and `bffPath` rewrites `/api/v1` → `/api/bff` (`packages/api-contract/src/bff-path.ts:15`), i.e. the catch-all at `apps/admin/src/app/api/bff/[...path]/route.ts:40`. The backend answers `Content-Type: text/csv` (`packages/feature-audit-export/src/presentation/audit-export.controller.ts:79-81`).

**Impact:** the export "succeeds" (status 200, `response.ok` true), the controller saves a file named `audit-logs-export-<ts>.csv` (`apps/admin/src/features/audit-logs/controllers/use-audit-logs-controller.ts:142-148`) whose entire contents are the four bytes `null`. No error is raised and the truncation toast still fires, so the operator believes the audit export is valid — the worst case for a compliance artifact.

**Fix:** branch on the upstream content type in `proxyWithRefresh`: when it is not JSON, return `new Response(response.body, { status, headers })` preserving `content-type`/`content-disposition`; alternatively add a dedicated streaming download route, the same way the SSE route bypasses the JSON proxy.

---

## P2

### 3. Bulk activate/block silently swallows partial failures and discards its own result
**Location:** `apps/admin/src/hooks/use-bulk-mutation.ts:17-25`

```ts
      const results = await Promise.allSettled(ids.map((id) => mutationFn(id)));
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0 && succeeded === 0) {
```

**Problem:** the mutation rejects only when *every* item fails; a mixed result resolves with `{ succeeded, failed, total }`. Callers drop that payload: `apps/admin/src/features/users/controllers/use-users-bulk-actions.ts:14-19` awaits `mutateAsync`, clears the selection, and shows a toast only in `catch`. The `successMessage` option declared at `use-bulk-mutation.ts:11` is never destructured or used, and both call sites pass it (`apps/admin/src/features/users/api/users.mutations.ts:16,24`), so there is no success feedback either. The block path additionally clears selection *before* awaiting (`apps/admin/src/features/users/controllers/use-users-list-controller.ts:149-157`), so a total failure also loses the selection.

**Impact:** an admin selects 10 users and blocks them; 3 fail (role-protected, concurrent change). The UI shows no message at all, the selection disappears, and the refreshed table shows a mixed state. The admin must diff the table by hand to discover which accounts are still active — a real risk when blocking is used for incident response.

**Fix:** return the counts to the caller and toast on `failed > 0` (e.g. "7 blocked, 3 failed"), use `successMessage` for the all-succeeded case, and only clear the selection after a resolution that reports `failed === 0` (or restore it on error).

### 4. Notification SSE stream never refreshes the access token — live updates die silently after 15 minutes
**Location:** `apps/admin/src/app/api/notifications/stream/route.ts:12-16`

```ts
  const { accessToken } = await readAuthCookies();

  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }
```

**Problem:** the route forwards whatever access cookie exists and has no refresh branch, unlike `proxyWithRefresh` (`packages/web-server/src/server/backend.ts:145-162`). Access tokens are short-lived: `JWT_ACCESS_TTL=15m` (`.env.example:51-53`, validated at `packages/api-runtime/src/config/environment/env.schema.ts:90`). The client opens a bare `EventSource` with no error handling (`apps/admin/src/features/notifications/api/notifications.stream.ts:21-33`), and `EventSource` retries automatically.

**Impact:** after ~15 minutes on the notifications screen the stream 401s and retries forever; the inbox stops updating with no UI signal, and the user only recovers when some other request happens to refresh the cookie pair or the page is reloaded. Every long-lived admin session loses real-time notifications.

**Fix:** on 401, call `refreshSession(refreshToken)` server-side, retry upstream once, and set the refreshed cookies on the streaming response; add `source.onerror` to surface a "live updates paused — refresh" state instead of failing silently.

### 5. `ErrorState` inline variant discards `description`, dropping security-relevant copy
**Location:** `packages/web-ui/src/components/error-state.tsx:26-41`

```tsx
  if (variant === "inline") {
    return (
      <Alert variant="error" className={cn("m-4 mb-0", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" />
            {title}
          </div>
```

**Problem:** the inline branch renders `title` and `action` only; `description` is accepted by the props type (`:8-17`) and rendered solely in the full-page branch (`:51`). Callers pass it anyway: `apps/admin/src/features/security/screens/security-view.tsx:48-53` and `apps/admin/src/features/settings/screens/security-settings-view.tsx:20-25` both send `description="Your MFA settings were not changed."`; `apps/admin/src/features/mail/ui/mail-template-card.tsx:50-54` sends a preview error message.

**Impact:** on the security screen a failed MFA-status load shows only "Could not load MFA status." — the reassurance that no MFA setting was altered never renders. Users cannot tell whether the error changed their security posture, which is the exact question that copy exists to answer. The same silent information loss applies to every other inline caller.

**Fix:** render `{description ? <p className="text-sm">{description}</p> : null}` inside the inline branch (the component's own contract already promises it), or remove the prop from the inline callers if the compact variant is deliberate.

### 6. Icon-only destructive controls have no accessible name
**Location:** `apps/admin/src/features/files/ui/files-table-columns.tsx:66-77`

```tsx
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDeleteClick(row.original);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
```

**Problem:** no `aria-label`, `title`, or `sr-only` text — the accessible name is empty. Same pattern in `apps/admin/src/features/notifications/ui/notifications-table-columns.tsx:116-125` (cancel job, `Trash2`), and `apps/admin/src/features/_plugin-resources/platform-admin/settings/ui/setting-card.tsx:61-69` and `:146-155` (reset draft, `RotateCcw`). `apps/admin/src/features/security/ui/mfa-setup-flow.tsx:87-97` wraps its copy button in a `Tooltip`, which supplies a description but not a name. By contrast the rest of the shell is labelled (`theme-toggle.tsx:15`, `language-switcher.tsx:19`), so this is an inconsistency rather than a house style.

**Impact:** screen-reader users hear "button" with no purpose for the delete/cancel/reset actions — and the two delete/cancel controls are destructive, so an unlabelled press is unrecoverable.

**Fix:** add `aria-label={`Delete ${row.original.name}`}` / `aria-label="Cancel scheduled job"` / `aria-label="Reset changes"` to each; for the copy button add `aria-label="Copy setup key"` alongside the tooltip.

### 7. Table row selection survives search/filter changes, so bulk actions can target rows that are no longer visible
**Location:** `apps/admin/src/components/use-resource-table-config.ts:91-99`

```ts
  const handlePageChange = useCallback(
    (page: number) => {
      onPageChange?.(page);
      if (enableSelection) {
        clearSelection();
      }
    },
```

**Problem:** selection is cleared on page, page-size, and sort changes (`:84-109`) but nothing clears it when the filter/search query changes — there is no effect watching the filter state, and the list controllers call `clearSelection` only after a bulk mutation (`apps/admin/src/features/users/controllers/use-users-list-controller.ts:151`). TanStack keeps `rowSelection` entries for ids that are no longer in `data`, and `selectedIds` is derived from the raw state (`:51-54`).

**Impact:** select 5 users → type a search that returns a different set → the bulk bar still reports "5 selected" and Activate/Block apply to the five off-screen users. In an admin console where the action is "block account", acting on invisible rows is a genuine safety problem, not just a confusing count.

**Fix:** derive a filter signature (e.g. `searchParams.toString()`) and `useEffect(() => clearSelection(), [filterSignature])` inside the hook, or clear the selection in each controller's filter-change handler.

---

## P3

### 8. `localhost` fallbacks for public URLs ship to production when the env var is missing
**Location:** `apps/web/src/features/landing/config/landing-config.ts:6-8`

```ts
export const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";
export const API_DOCS_URL =
  process.env.NEXT_PUBLIC_API_DOCS_URL ?? "http://localhost:3001/api/docs";
```

**Problem:** both default to a developer machine address, and `apps/web/src/features/identity-web/verify-email/config/verify-email-config.ts:1` repeats the pattern for the post-verification redirect (`use-verify-email-controller.ts:46-48`). Unlike server env, there is no schema validating `NEXT_PUBLIC_*` for the web app (`apps/web/src/core/config/server-env.schema.ts` covers server vars only), so a typo or a missing value is invisible at build time.

**Impact:** if `NEXT_PUBLIC_ADMIN_URL` is unset in a deployment, the primary CTA in the nav (`landing-nav.tsx:44-48`), hero (`landing-hero.tsx:31`), footer (`landing-footer.tsx:22`) and the post-verify redirect all send real visitors to `http://localhost:3002`, which resolves to their own machine. The email-verification flow dead-ends after success.

**Fix:** add a `NEXT_PUBLIC_*` schema parsed at module load (fail the build on missing values), or render the CTA only when the URL is defined instead of defaulting to localhost.

### 9. Admin login form ships seeded credentials when `NEXT_PUBLIC_APP_ENV=development`
**Location:** `apps/admin/src/features/auth/model/auth.constants.ts:9-16`

```ts
const isDev =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_APP_ENV === "development";

export const ADMIN_LOGIN_DEFAULT_VALUES = {
  email: isDev ? "admin@example.local" : "",
  password: isDev ? "ChangeMe123!" : "",
} as const;
```

**Problem:** `NEXT_PUBLIC_APP_ENV` is inlined into the client bundle at build time, and the server schema accepts it independently of `APP_ENV` (`apps/admin/src/lib/env.schema.ts:39`). A staging/preview build that sets only `NEXT_PUBLIC_APP_ENV=development` while `NODE_ENV=production` therefore compiles the seeded credentials into the public JS, and the form pre-fills them.

**Impact:** seeded admin credentials are exposed in a shipped bundle and pre-filled on a reachable login page of a non-local environment. The intent (DX prefill) is documented, but the trigger is a public, easily-diverging flag rather than a server-only signal.

**Fix:** gate the prefill on `process.env.NODE_ENV === "development"` alone, or on a dedicated `NEXT_PUBLIC_ENABLE_DEV_LOGIN_PREFILL` that defaults to off and is asserted false for staging/production builds.

### 10. `useDebouncedUrlSearch` can overwrite in-flight typing with a stale URL value
**Location:** `packages/web-hooks/src/use-debounced-url-search.ts:86-91`

```ts
  useEffect(() => {
    if (lastUrlValueRef.current === urlValue) return;
    lastUrlValueRef.current = urlValue;
    syncingFromUrlRef.current = true;
    setLocalValue(urlValue);
  }, [urlValue]);
```

**Problem:** every URL change is adopted into the input unconditionally. When an earlier debounced write lands while the user is still typing, `urlValue` (the older query) replaces `localValue` (the newer keystrokes); the local→URL effect then treats this as a URL-originated sync (`:96-99`) and does not re-write the lost characters. The hook has no focus/pending-edit guard. *(Logic-derived from the two effects; not reproduced at runtime in this review.)*

**Impact:** on a slow navigation, a fast typist can lose a character and see the caret jump in the users/roles/audit search boxes. Intermittent and hard to attribute, so it tends to be reported as "the search is flaky".

**Fix:** skip the URL→local adoption while the input is focused and `localValue !== urlValue`, or record the last value the hook itself wrote to the URL and ignore echoes of anything older than the newest local edit.

---

## Checked and found clean (no finding raised)

- **Server/client boundary:** every `import "server-only"` module is imported only from route handlers; grep for `@/core/server`, `@/lib/server`, `@repo/web-server` across 200 client components returns no client importer. `apps/admin/src/lib/env.ts` (server secrets, `loadEnvFiles`) is imported only by `lib/server/backend.ts`, `lib/auth/cookies.ts`, and the SSE route.
- **XSS:** the only `dangerouslySetInnerHTML` uses are three module-level constant scripts (`apps/web/src/app/[locale]/layout.tsx:14-15`, `apps/admin/src/app/[locale]/layout.tsx:13`); no user data reaches them. No `innerHTML`, `eval`, or `new Function`.
- **CSRF:** every mutating BFF route calls `enforceCsrf`/`enforceMutationGuard`; the cookie is `httpOnly:false` by design (readable by the client) while access/refresh are `httpOnly:true`, and `secure` derives from `APP_ENV` (`packages/web-server/src/auth/cookies.ts:65-71`, `:128-138`). Signed-CSRF is enforced in staging/production by schema (`env.schema.ts:42-50`).
- **Open redirect:** the SSO `redirectUri` forwarded by `apps/admin/src/app/api/auth/sso/[provider]/start/route.ts:14-15` is validated server-side against an allowlist (`packages/feature-sso/src/domain/redirect-allowlist.ts:32-41`); not a defect. The login page ignores a `from` param entirely (`auth.search-params.ts:6-8`, `auth.constants.ts:3-7`).
- **Token storage:** no access/refresh token is written to `localStorage`; `localStorage` holds only the theme.
- **Cache invalidation:** mutations invalidate by key prefix (`usersKeys.all`, `rolesKeys.all`), which covers list and detail queries; no stale-key mismatch found.
- **Loading/empty/error states:** route-level `loading.tsx`/`error.tsx` exist for the admin app segment; every list view inspected renders an error branch (roles and organizations use a dedicated `ErrorState`, not the table's `error` prop).

## Not verified

- No build, typecheck, or test run (constraints: no installs, no pnpm). Behavior claims are from source reading only.
- EventSource retry cadence and the exact user-visible delay in finding 4 depend on browser heuristics; the 401 cause is verified, the recovery timing is not.
- Finding 10 is a logic-level race analysis, not a reproduced runtime failure.

**Fix ordering for the team:** 1 → 2 → 3 → 5 → 6 → 4 → 7 → 8 → 9 → 10.
