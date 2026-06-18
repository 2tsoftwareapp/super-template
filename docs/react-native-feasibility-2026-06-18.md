# React Native Feasibility Review — Super Template

_Date: 2026-06-18 · Scope: architecture review + capability assessment for adding a React Native client_

## TL;DR

Adding a React Native (RN) client is **feasible with low backend risk and medium client-side effort**. The backend is contract-first and fully client-agnostic, so the API needs **no changes** for core flows. The real work is (1) building the RN app against the existing OpenAPI contract and (2) wiring a non-trivial native app into the pnpm + Turborepo monorepo.

**Important context:** the template **already has a complete, tested mobile client built in Flutter** (`apps/mobile`), with full feature parity to the web/admin apps. So the first decision is not _technical_ but _strategic_:

| Option | What it means | Cost | Recommendation |
|--------|---------------|------|----------------|
| **A — RN alongside Flutter** | Two mobile clients to maintain | High ongoing (double maintenance, drift risk) | Only if you intentionally want to showcase/support both stacks |
| **B — RN replaces Flutter** | Swap `apps/mobile` Flutter → RN | One-time migration; discards working Flutter code | Preferred if the goal is "the template's mobile stack should be RN" |

The architecture supports either equally well. Everything below is the technical capability assessment.

---

## 1. What makes this a good fit (favorable)

### 1.1 Contract-first API with an existing TypeScript pipeline ⭐ biggest win
The single source of truth is `apps/api/openapi.json`, generated from NestJS Swagger decorators. There is **already a TypeScript contract** generated from it:

- `pnpm --filter api contract:generate` → `openapi-typescript` → `packages/api-contract/src/generated/index.ts`
- Consumed today by both `apps/web` and `apps/admin` via `@repo/api-contract` (`components["schemas"]["..."]`).

Because RN is TypeScript, it can **consume `@repo/api-contract` directly**, exactly like admin does (see `apps/admin/src/lib/types.ts`). No Dart-style codegen toolchain (Docker + `dart-dio` + `build_runner`) is needed — RN reuses the types the repo already produces.

### 1.2 Stateless, token-based REST auth — the admin SPA is a ready blueprint
The API authenticates with `Authorization: Bearer <accessToken>` and refreshes via a refresh token in the request body. `apps/admin/src/lib/http.ts` is a near-perfect template for the RN networking layer:

- Bearer header injection
- Single-flight refresh on `401` (`refreshAccessToken()` against `/api/v1/auth/refresh`)
- Token persistence abstraction (`getStoredAuthTokens` / `setStoredAuthTokens`)

For RN, the only change is swapping browser storage for secure storage (`expo-secure-store` or `react-native-keychain`). The refresh/retry logic ports over almost verbatim. The Flutter app already proves this exact pattern works for a mobile client ("single-flight refresh path in the Dio interceptor", per `docs/architecture.md`).

### 1.3 The API is already a multi-client REST surface
Three different clients already hit the same API: web (via Next.js BFF), admin (Vite SPA, direct REST), and Flutter (direct REST). RN is just a fourth REST consumer. The architecture doc's dependency rules already assume non-web clients:
- "Web and mobile consume API DTO contracts, not Drizzle schema"
- "Permission checks in the frontend are UX hints only; backend guards remain the source of truth"

RN inherits all of this for free.

### 1.4 Push notifications and deep linking are already server-ready
- FCM push is implemented server-side (`POST /api/v1/notifications/devices` device registration, Firebase Admin SDK send path, `FCM_*` env vars). RN registers device tokens through the **same endpoint** via `@react-native-firebase/messaging` or `expo-notifications`.
- Deep linking is already a designed concern (git history: _"integrate Firebase and deep linking support in mobile app"_).

### 1.5 The monorepo already tolerates an app outside the Node toolchain
`apps/mobile` (Flutter) lives in `apps/` but is **not** in the pnpm workspace (`pnpm-workspace.yaml` lists only `apps/api`, `apps/admin`, `apps/web`, `apps/web/e2e`, `packages/*`). It's driven via the `Makefile` (`dev-mobile`, `test-mobile`) and `flutter` CLI, and excluded from Turbo tasks. An RN/Expo app is a _Node_ app, so it can integrate **more cleanly** into pnpm + Turbo than Flutter does — or stay Makefile-driven like Flutter if you prefer isolation.

---

## 2. Friction, costs, and watch-outs (unfavorable)

### 2.1 `api-contract` provides types, not a runtime client
`openapi-typescript` emits **types only** — there are no callable methods like the Dart `dart-dio` client's `AuthApi.login()`. Admin hand-writes `fetch` wrappers and maps responses to `components["schemas"][...]`. RN has two paths:
- **Low effort:** copy the admin pattern (manual `fetch` + typed payloads).
- **Better DX:** add a typed SDK generator. **Recommended: `openapi-fetch`** (same author as `openapi-typescript`, consumes the exact output already produced — minimal new tooling). Alternatives: `orval`, `openapi-typescript-codegen`.

This is a choice, not a blocker — but worth deciding up front so RN isn't stuck with stringly-typed fetch calls.

### 2.2 pnpm + Metro bundler interop ⭐ main technical risk
RN's Metro bundler historically struggles with pnpm's strict, symlinked `node_modules`. Mitigations:
- Add `node-linker=hoisted` (or `shamefully-hoist`) scoped for the mobile app, **or**
- Use **Expo**, which has first-class monorepo support; configure `metro.config.js` with `watchFolders` (repo root) and `nodeModulesPaths`.

The repo's root `.npmrc` is currently minimal (57 bytes), so this needs deliberate setup. **This is the most likely source of "it won't bundle" pain** and should be prototyped first.

### 2.3 Redundancy with the existing Flutter client (if Option A)
The Flutter app already implements the full feature matrix (`apps/mobile/README.md`): auth, projects, notifications, profile, preferences, security, sessions, organizations, imports/exports, and the full admin hub — all permission-gated and test-covered. Running RN _alongside_ it means maintaining two mobile codebases that must stay in sync as the API evolves. Budget for that, or pick Option B.

### 2.4 SSE needs a polyfill on RN
Web notifications use **SSE**, not FCM (per README). RN has no native `EventSource`. If the RN app wants the live notification stream (not just FCM push), add `react-native-sse`, or rely on FCM + pull-to-refresh / polling. Flutter sidesteps this with FCM; RN can do the same.

### 2.5 CSRF header is a browser concern — verify, don't assume
`apps/admin/src/lib/http.ts` sets `x-csrf-token` on mutations, but that's for cookie-authenticated browser contexts ("CSRF protection is applied to cookie-authenticated mutations" — `docs/architecture.md`). A pure Bearer-token RN client should not need it, and the Flutter client doesn't send it, so this path is already proven. Still, confirm the API doesn't hard-require the header for Bearer requests before building out mutations.

### 2.6 Build/verify/CI integration
- **Turbo:** Flutter is excluded from `turbo run build/lint/test/dev`. An RN Node package would get pulled into those tasks — scope `turbo.json` and the app's `package.json` scripts so Metro/EAS don't break `pnpm build` (e.g., no default `build` that triggers a native compile in CI).
- **`scripts/verify.sh` / `make verify`:** currently runs Flutter format-check + analyze + test. Add RN `lint` + `typecheck` + `test` (Jest/RNTL). If RN only consumes the already-generated TS types, `generate-contracts.sh` needs **no** new branch; if you add an SDK generator, add a step there.
- **Native toolchains:** RN still needs Xcode / Android SDK, same as Flutter — no net-new burden over the current state. Expo managed workflow reduces native config (no hand-maintained Podfile/gradle).

---

## 3. Concrete integration points

| Concern | Existing asset to reuse | RN action |
|---------|------------------------|-----------|
| API types | `@repo/api-contract` (`openapi-typescript`) | Import directly; optionally add `openapi-fetch` for typed calls |
| Auth + refresh | `apps/admin/src/lib/http.ts` (single-flight 401 refresh) | Port logic; swap storage for secure store |
| Token storage | Flutter secure storage pattern | `expo-secure-store` / `react-native-keychain` |
| Push | `POST /api/v1/notifications/devices` + Firebase Admin | `@react-native-firebase/messaging` or `expo-notifications` |
| Live notifications | API SSE stream | `react-native-sse` polyfill, or FCM + polling |
| Navigation/permissions | Flutter route→permission matrix (`apps/mobile/README.md`) | Mirror with React Navigation/Expo Router; UX-only gating |
| Monorepo wiring | pnpm workspace + Turbo + Makefile | Add to workspace **or** Makefile-drive like Flutter; set `node-linker=hoisted` |

---

## 4. Recommended approach & phasing

**Recommendation:** Use **Expo** (managed or prebuild) with **`openapi-fetch`** on top of the existing `@repo/api-contract`. Expo minimizes the pnpm/Metro and native-config pain, and `openapi-fetch` gives typed API calls with near-zero new tooling.

Suggested phases (de-risk the monorepo wiring first):

1. **Spike — bundling proof (½–1 day):** Scaffold an Expo app in `apps/mobile-rn`, get it to import `@repo/api-contract` and bundle under pnpm. This validates §2.2 before any feature work.
2. **Networking + auth (1–2 days):** Port `http.ts` (Bearer + single-flight refresh) onto secure storage; wire login/refresh/logout against `/api/v1/auth/*`.
3. **Core screens (bulk of effort):** Implement the feature matrix incrementally (home, projects, notifications, profile). Permissions as UX hints only.
4. **Push + deep linking (1–2 days):** FCM device registration via existing endpoint; deep-link config.
5. **Toolchain integration (1 day):** Add lint/typecheck/test to `verify.sh` + CI; scope Turbo tasks; decide Flutter coexistence vs. removal.

**Effort:** backend ≈ 0 (verify CSRF/Bearer only). Client + plumbing ≈ **1.5–3 weeks** for parity with the current Flutter app, front-loaded by the Phase 1 bundling spike.

---

## 5. Bottom line

- **Capability: yes.** The contract-first, token-based, multi-client architecture is essentially _designed_ for adding another client. RN slots in where admin/Flutter already sit.
- **Backend changes: none** for core flows (confirm CSRF/Bearer expectation; optionally add an SDK generator step).
- **Biggest technical risk:** pnpm ↔ Metro bundling — prototype it first.
- **Biggest strategic question:** RN _alongside_ Flutter (double maintenance) vs. _replacing_ it (discard working code). Decide this before writing feature code.
