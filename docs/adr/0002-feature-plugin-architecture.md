# ADR 0002 — Features as compile-time plugin packages across four surfaces

Date: 2026-08-25 · Status: accepted

## Context

The template shipped every capability inside `apps/*`: identity + platform Nest
modules in `apps/api/src/{identity,platform}`, one monolithic Drizzle schema in
`@repo/database-runtime`, admin/web slices under `apps/*/src/features`, and Flutter
features under `apps/mobile/lib/features`. Only `@repo/feature-health` was an optional
add-on package. Consumers who wanted "no mail" or "no import/export" had to hand-
edit core code across four platforms with no contract telling them what a feature
actually owns.

Principle 8 of the architecture rules deferred optional-module extraction until
the full template was validated. That validation is done; this ADR supersedes the
"defer extraction" stance.

## Decision

Every capability — including identity — becomes a **compile-time feature plugin**
package under `packages/features/<id>/`. The kernel stays thin.

- **Kernel (always on):** `api-kernel` (ports, errors, types), `api-plugin-kit`
  (`FeatureManifest` + compose helpers), `api-runtime` (Nest HTTP guards/filters/
  env schema), `database-runtime` (pool, RLS/GUC, transactions, drizzle-kit
  config), `web-ui`/`web-hooks`/`web-utils`/`web-server` (design system), and a
  Flutter `mobile_core`. The kernel contains **no** identity/platform tables.
- **Feature plugin:** owns a vertical slice across all four surfaces and exports a
  single typed `FeatureManifest` (`@repo/api-plugin-kit`) for the backend surface:
  `{ id, nestModule, schema?, permissions? }`. Frontend surfaces are exposed
  through per-surface package entrypoints (`./admin`, `./web`) and a Flutter
  sub-package.
- **Composition is explicit and compile-time.** Apps import each manifest in one
  place: `apps/api/src/composition/feature-registry.ts` builds `composedSchema` for
  `DatabaseModule.forRoot({ schema })` and the module list for `AppModule`. Admin
  concatenates each feature's `resource.ts`; Flutter lists path dependencies and
  registers routes. Disabling a feature = remove the workspace dependency + the
  one composition line + the thin route file. No kernel edit.
- **Plugins never import another plugin's internals.** Cross-feature needs go
  through kernel ports (`USER_LOOKUP`, `AUDIT_WRITER`,
  `BACKGROUND_JOB_ENQUEUER`, …) or a peer's single public module surface.

## How each surface participates

| Surface  | Contribution                        | Composed in |
| -------- | ----------------------------------- | ----------- |
| API      | `nestModule` in `FeatureManifest`   | `apps/api/src/composition/feature-registry.ts` → `AppModule` |
| Database | `schema` + SQL migrations           | `composeFeatureSchemas` → `DatabaseModule.forRoot` |
| Admin/Web| `resource.ts` + feature slice       | `apps/admin/src/lib/admin-resources.ts` + thin `page.tsx` |
| Mobile   | Dart sub-package + routes           | `apps/mobile/pubspec.yaml` + `GoRouter` |

## Data caveat

Removing a plugin does **not** drop its tables. Pick the feature set before the
first migration; disabling a feature in an already-migrated database is a separate
data decision (write a drop migration deliberately).

## Consequences

- `DatabaseModule.forRoot({ schema })` and `ACCESS_TOKEN_AUTHENTICATOR` (so the
  app-shell auth guard no longer depends on the identity package) are the enabling
  kernel changes.
- A new `layer:feature` turbo boundary tag lets feature packages depend on kernel
  and peer public surfaces, never on `apps/*`.
- The migration is incremental and stays green: features are relocated one at a
  time; the built-in schema shrinks as feature schemas move out, keeping
  `composedSchema` identical at every step.
- Enforcement is by tooling: source-policy for `packages/features/*`,
  `eslint-plugin-boundaries` per layer, and a CI smoke build that composes the app
  without one plugin.
