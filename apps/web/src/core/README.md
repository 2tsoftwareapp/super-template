# Web Core

`core/` owns application infrastructure and external mechanisms that are independent of any business feature.

Core is organized by capability, not by a generic technical dumping ground:

- `auth/` — auth/session infrastructure split by runtime boundary:
  - `cookie-names.ts` — client-safe app-owned cookie-name policy used by browser HTTP configuration and server auth;
  - `server/runtime.ts` — private server-side auth composition;
  - `server/cookies.ts` — narrow route-facing cookie/session operations only.
- `config/` — server configuration split by responsibility:
  - `server-env.ts` — load + validate raw environment input only;
  - `server-config.ts` — normalize app-owned runtime policy such as allowed origins, cookie security, and signed-CSRF requirements.
- `http/` — browser HTTP infrastructure:
  - `client.ts` — the configured app-owned browser HTTP runtime; importing it intentionally performs HTTP-client bootstrap before exposing `webFetch`.
  - neutral HTTP contracts/errors that are owned by repository packages are imported from those packages directly instead of being re-exported through `core`.
- `server/` — app-owned BFF capabilities. Public route-facing capabilities are split by responsibility:
  - `transport.ts` — raw backend transport required by route composition;
  - `guards.ts` — route-level CSRF/mutation request guards;
  - `proxy.ts` — authenticated proxy-with-refresh orchestration;
  - `internal/runtime.ts` — private composition root that binds normalized server config + auth runtime to `@repo/web-server`.

Rules:

- Never import from `features/`.
- Keep business rules in the owning feature.
- Do not create pass-through wrappers around repository packages unless the app adds policy, configuration, composition, or ownership semantics.
- Import package-owned neutral contracts directly from their owning package; `core` is not an alias layer.
- Make side-effectful runtime imports explicit in the path/name (`http/client`, `auth/server/runtime`, `server/internal/runtime`).
- Separate raw environment validation from normalized application configuration/policy. Runtime capabilities consume normalized config instead of re-parsing or re-interpreting environment values independently.
- Keep server secrets/configuration out of generic or client-facing config modules.
- Server-only modules must declare the `server-only` boundary and live under an explicit server/internal ownership path when a client-safe sibling capability exists.
- Route handlers depend on the narrow public server capability they need; they must not import `core/server/internal/**` or `core/auth/server/runtime` directly.
- Public capability modules expose only operations required by current consumers; internal primitives such as token signing/validation, auth cookie mutation helpers, refresh orchestration, or raw origin checks stay private until a real use case needs them.
- Do not expose one god facade that re-exports unrelated transport, security, session, and proxy mechanisms.
- Prefer small capability-oriented folders over generic `types`, `utils`, or `helpers` dumping grounds.
