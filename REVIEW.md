# Review backlog — status

Original review comments are kept verbatim below. Each is followed by (a) what it
pointed at, (b) the state of the code today, (c) what is left to do.
Last checked: 2026-09-15.

1. "In apps/api/drizzle: why migration appear here? it should be location in
   api-database in packages."
   - Pointed at `apps/api/drizzle` and a package called `api-database`. Neither exists.
   - Now: schema sources live in `packages/feature-*/src/infrastructure/persistence/`,
     drizzle-kit is configured in `packages/database-runtime/drizzle.config.ts` (schema
     glob + `out: "../../apps/api/migrations"`), and only the emitted SQL stays in
     `apps/api/migrations` because the API host owns the migrate runner
     (`apps/api/src/cli/migrations.ts`). Recorded in `ARCHITECTURE_RULES.md` §15.1.
   - Left: nothing to move. Relocating the SQL folder means touching the runner's
     resolution paths in `apps/api/src/cli/migrations.ts` for no gain.

2. "api-bootstrap is empty, if dont need anything, remove it."
   - Pointed at `packages/api-bootstrap`.
   - Now: the directory does not exist — already gone, nothing to remove.
   - Left: nothing.

3. "In packages/api-core/src/config/env.schema.ts, move utils, constant function out of
   schema."
   - Pointed at `packages/api-core`, which does not exist. The env layer is
     `packages/api-runtime/src/config/environment/`.
   - Now: split is done. `env-utils.ts` holds the zod preprocessors and validators
     (`booleanFromString`, `optionalUrl`, `commaSeparatedOrigins`, …), `env.constants.ts`
     holds the dev placeholder secrets/keys, and `env.schema.ts` only composes the schema
     and exports `validateEnvironment`.
   - Left: nothing.

4. "split layer env load without core"
   - Pointed at the same non-existent `api-core`.
   - Now: each surface loads and validates its own environment —
     `packages/api-runtime/src/config/environment/` (API),
     `apps/web/src/core/config/server-env.ts` (web), `apps/admin/src/lib/env.ts` (admin),
     with `@repo/env-loader` as the shared dotenv loader.
   - Left: nothing.
