# Web Core

`core/` owns application infrastructure and external mechanisms that are independent of any business feature.

Core is organized by capability, not by a generic technical dumping ground:

- `auth/` — web auth/session runtime, cookie policy, and auth-specific server helpers.
- `config/` — runtime configuration with an explicit server-only boundary (`server-env.ts`).
- `http/` — configured browser HTTP client. Error contracts live separately in `http/errors.ts` so consumers can classify HTTP failures without bootstrapping the client runtime.
- `server/` — app-owned BFF capabilities. Public route-facing capabilities are split by responsibility:
  - `transport.ts` — raw backend calls and refresh transport;
  - `guards.ts` — origin/CSRF/mutation request guards;
  - `proxy.ts` — authenticated proxy-with-refresh orchestration;
  - `internal/runtime.ts` — private composition root that binds server config + auth runtime to `@repo/web-server`.

Rules:

- Never import from `features/`.
- Keep business rules in the owning feature.
- Do not create pass-through wrappers around repository packages unless the app adds policy, configuration, or ownership semantics.
- Separate runtime/bootstrap modules from neutral contracts when importing one would otherwise trigger side effects.
- Keep server secrets/configuration out of generic or client-facing config modules.
- Route handlers depend on the narrow public server capability they need; they must not import `core/server/internal/**` directly.
- Do not expose one god facade that re-exports unrelated transport, security, session, and proxy mechanisms.
- Prefer small capability-oriented folders over generic `types`, `utils`, or `helpers` dumping grounds.
