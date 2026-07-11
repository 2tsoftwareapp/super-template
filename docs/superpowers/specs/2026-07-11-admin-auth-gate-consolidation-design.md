# Admin auth/session gate consolidation + server middleware

Status: implemented (see implementation note at bottom)
Owner: admin app (`apps/admin`)

## Context

The admin app currently gates authenticated routes with **two overlapping
client-side mechanisms**, plus **no server-side enforcement**:

1. `apps/admin/src/app/(app)/layout.tsx` wraps every `(app)` route in
   `<AdminShell>` (`apps/admin/src/components/admin-shell.tsx`). `AdminShell`
   calls `useSession()`, redirects unauthenticated users to `/login`, runs the
   RBAC checks (`hasAdminAppAccess`, `canAccessResource`), shows
   `<FullScreenLoading>` while the session loads, and only renders its
   `children` once the session is present **and** authorized.

2. `apps/admin/src/app/(app)/page.tsx` (dashboard only) *additionally* wraps
   `<DashboardView>` in `<AuthGate>`
   (`apps/admin/src/components/auth-gate.tsx`), which calls `useSession()`
   again and re-runs a weaker version of the same loading/redirect logic.

Because `AdminShell` renders `children` only after the session is fully
validated, by the time `AuthGate` mounts the session is guaranteed present —
so every branch of `AuthGate` (`isLoading`, `isError`, `!data`) is
**unreachable dead code**. It is also applied to only 1 of the 12 pages, so
it is a leftover rather than a pattern.

### Concrete problems

- **Dead/duplicate gate** — `AuthGate` on the dashboard route does nothing
  reachable; it just adds a second `useSession()` consumer and a nested
  component.
- **Redirect-loop risk** — `admin-shell.tsx` redirects `!canUseAdminApp` to
  `router.replace("/")`, but `/` (dashboard) is itself inside `AdminShell`,
  which will again see `!canUseAdminApp` and redirect to `/` — a loop / stuck
  "Checking admin access" state. An authenticated-but-unauthorized user should
  be signed out to `/login`.
- **Divergent unauth conditions** — `AdminShell` keys off `!session.data`;
  `AuthGate` keys off `session.isError`. Same intent, two rules.
- **Mixed responsibilities** — `AdminShell` couples auth/RBAC gating with
  chrome rendering (sidebar, header, backdrops), so neither can be understood
  or tested in isolation.
- **Client-only enforcement** — there is no `middleware.ts`; the full page
  bundle ships to the browser for anonymous users and only *then* redirects.

## Goal

One authoritative gate. A fast server-side pre-filter (middleware) blocks
obviously-anonymous requests before page JS ships; a single client guard owns
the authoritative session + RBAC state machine; `AdminShell` becomes a
presentational shell that receives already-validated data.

## Non-goals

- No change to how sessions are established, refreshed, or how cookies are set
  (`lib/auth/cookies.ts`, the `api/auth/*` routes stay as-is).
- No change to the RBAC rules themselves (`hasAdminAppAccess`,
  `canAccessResource`, `getFirstAccessibleResourcePath`,
  `getResourceForPath` in `lib/admin-resources.ts` are reused unchanged).
- Not moving session fetching to a server component / RSC data flow — the
  authoritative `/auth/me` fetch stays client-side via `useSession()`. The
  middleware is a cookie-presence pre-filter, not a full auth authority.
- No visual change to the loading screen or shell chrome.

## Design

### 1. Server middleware (`apps/admin/src/middleware.ts`)

A Next.js middleware that runs on the edge before `(app)` routes render.

- **Matcher**: all app routes except Next internals, static assets, and the
  public group — i.e. protect everything that renders `AdminShell`. Concretely
  a matcher that excludes `/login`, `/api`, `/_next`, and static files.
- **Logic**:
  - Read the refresh-token cookie (`REFRESH_TOKEN_COOKIE =
    "st_admin_refresh_token"`, from `lib/auth/cookie-names.ts` — the
    client-safe constants module, importable in middleware).
  - If **absent** on a protected route → `NextResponse.redirect("/login")`
    (preserve the intended path as a `?redirect=` param for post-login
    return, matching whatever the login flow already supports; if it does not
    support return-paths today, omit rather than invent one).
  - If **present** → `NextResponse.next()` (let the client guard do the
    authoritative validation; a stale/invalid token still 401s the
    `/auth/me` call and the client guard redirects).
  - Optionally: if the refresh cookie **is** present and the request is for
    `/login`, redirect to `/` (avoid showing login to already-signed-in
    users). Include only if it does not conflict with the SSO callback flow
    under `(public)/login/sso/callback` — verify that callback route stays
    reachable (it needs to run *before* a session cookie exists, so the
    matcher must not touch `(public)` at all).
- **Why presence-only, not JWT verification**: the API is the token
  authority; verifying signatures at the edge would duplicate secret material
  and validation logic. Presence-check is the cheap, robust pre-filter; the
  client `/auth/me` call remains the source of truth.

### 2. Client guard (`apps/admin/src/features/auth/use-admin-guard.ts`)

A hook that owns the full client gate state machine, extracted from
`AdminShell`. Returns a discriminated union so the wrapper renders declaratively:

```ts
type AdminGuardState =
  | { status: "loading" }
  | { status: "redirecting" }            // an effect is navigating away
  | { status: "ready"; user: SessionUser; permissions: string[] };
```

Responsibilities (moved verbatim from `admin-shell.tsx`, with the loop fix):

- `useSession()` (single consumer).
- Effect: `!isLoading && !session.data` → `router.replace("/login")` →
  `redirecting`.
- Effect: authenticated but `!hasAdminAppAccess(...)` → **sign out** via
  `signOutAdmin(queryClient)` then `router.replace("/login")` (fixes the
  `replace("/")` loop) → `redirecting`.
- Effect: authenticated, has admin access, but
  `!canAccessResource(getResourceForPath(pathname), permissions)` →
  `router.replace(getFirstAccessibleResourcePath(permissions))` →
  `redirecting`.
- Otherwise → `ready` with `user` + `permissions`.

### 3. Guard wrapper (`apps/admin/src/components/admin-guard.tsx`)

Small component consuming `useAdminGuard()`:

- `loading` / `redirecting` → `<FullScreenLoading title="Restoring admin
  session" ... />` (reuse existing copy).
- `ready` → render `children` (which is `<AdminShell user=... permissions=...>`).

### 4. `AdminShell` becomes presentational

`admin-shell.tsx` no longer calls `useSession`, `useRouter` for gating, or the
RBAC functions. It accepts `user` and `permissions` as props and renders the
sidebar + header + backdrops + `children`. Sign-out handler stays (it's a UI
affordance, not a gate).

### 5. Wiring

`(app)/layout.tsx`:

```tsx
export default function AppLayout({ children }) {
  return (
    <AdminGuard>
      {(session) => (
        <AdminShell user={session.user} permissions={session.permissions}>
          {children}
        </AdminShell>
      )}
    </AdminGuard>
  );
}
```

(Render-prop or context — pick whichever reads cleaner; if `AdminShell`'s
children already need `user`/`permissions` via context, expose them through a
small `AdminSessionContext` instead of prop-drilling.)

### 6. Delete `AuthGate`

Remove `apps/admin/src/components/auth-gate.tsx` and its usage in
`(app)/page.tsx` — the page becomes a thin `export default function Page() {
return <DashboardView />; }` with its existing metadata. All gating now lives
in the layout.

## Testing

- Unit-test `useAdminGuard` (or the pure decision function it delegates to)
  with a renderHook + mocked `useSession`/`useRouter`: covers loading,
  unauthenticated → `/login`, no-admin-access → signOut + `/login`,
  no-route-access → first accessible resource, ready. This is behavior that
  currently has **zero** tests.
- Add a unit test for the middleware's decision logic (extract the
  cookie → redirect/next decision into a pure helper so it's testable without
  an edge runtime), covering: no cookie on protected path → redirect; cookie
  present → next; `(public)` paths untouched.
- Existing admin tests (39) must stay green.

## Verification

- `pnpm --filter admin typecheck` and `pnpm --filter admin test` clean.
- Manual: (a) log out, hit `/users` directly → middleware redirects to
  `/login` with no dashboard JS flash; (b) log in as a full admin → all routes
  load; (c) log in as a user lacking admin access → signed out to `/login`, no
  redirect loop; (d) log in as a user with partial permissions → hitting a
  forbidden resource redirects to the first accessible one; (e) SSO callback
  under `(public)/login/sso/callback` still completes.
- Grep guard: `apps/admin/src/components/auth-gate.tsx` no longer exists and
  nothing imports `AuthGate`.

## Risks

- **Matcher over-reach** — a too-broad middleware matcher could intercept
  `(public)/login/sso/callback` (which must run pre-session) or `/api/auth/*`
  routes, breaking login. Mitigation: matcher explicitly excludes `/api`,
  `/_next`, static assets, and the entire `/login` subtree; verify the SSO
  callback e2e.
- **Redirect param format** — only add `?redirect=` return-path handling if
  the existing login flow consumes it; otherwise leave it out to avoid a
  dangling unused param (and never reflect it unsanitized).
- **Double redirect** — middleware and client guard can both decide to
  redirect to `/login` on an expired session; this is harmless (idempotent
  `replace` to the same URL) but worth confirming it doesn't flash.

## Implementation note (post-implementation, 2026-07-11)

Next.js 16.2.9 renamed the `middleware` file convention to `proxy`. The
implementation therefore lives at `apps/admin/src/proxy.ts` with an exported
`proxy()` function, and the pure decision helper is
`apps/admin/src/lib/auth/proxy-auth.ts` (`resolveAdminProxy`). Everywhere this
spec says "middleware", read "proxy". `AdminGuard` provides the validated
session via `AdminSessionContext` (+ `useAdminSession()`) instead of a
render-prop — a function child cannot cross the RSC boundary from the server
layout. Status: implemented; all tests green.
