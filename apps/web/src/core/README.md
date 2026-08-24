# Web Core

`core/` owns application infrastructure and external mechanisms that are independent of any business feature.

Use this layer for app-owned HTTP, authentication/session infrastructure, runtime configuration, server/BFF helpers, navigation infrastructure, logging, and observability.

Rules:

- Never import from `features/`.
- Keep business rules in the owning feature.
- Prefer small capability-oriented folders over generic dumping-ground files.
- Infrastructure may depend on shared repository packages and external libraries.
