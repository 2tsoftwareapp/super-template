# HTTP Core Capability

`core/http` owns only web-app-specific HTTP composition.

- `client.ts` configures the shared repository HTTP client with the web app's CSRF cookie policy and then exposes `webFetch`.
- Importing `client.ts` is intentionally side-effectful because it performs runtime configuration.
- Package-owned HTTP contracts and errors are imported directly from `@repo/web-utils/http`; do not add pass-through wrappers here.

Feature `api/` modules may depend on `@/core/http/client`. Presentation, domain, contracts, and route composition must not use the browser HTTP runtime directly.
