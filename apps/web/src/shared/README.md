# Web Shared

`shared/` owns feature-agnostic reusable application code that is not infrastructure.

Use this layer for reusable presentation concerns, theme behavior, and stable application helpers shared by multiple features.

Rules:

- Never import from `features/`.
- Do not move feature-specific code here just because two files use it.
- Promote code only after cross-feature reuse and a stable responsibility are clear.
- Generic design-system primitives continue to come from `@repo/web-ui/*`.
