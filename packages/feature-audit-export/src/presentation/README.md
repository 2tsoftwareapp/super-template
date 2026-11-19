# presentation/

The HTTP edge: routing, validation, auth, response shaping.

**Put here**
- `*.controller.ts` — route + `@Authorize` + DTO in, use-case out.
- `dto/` — class-validator request/response shapes.

**Do not put here**
- Repository/Drizzle access, another feature's internals.
- Error JSON built by hand — throw `AppError`.
- `@Public()` without a comment saying why the route is unauthenticated.

Rules: `docs/layers/presentation.md`. HTTP behaviour needs an e2e spec.
