# @repo/tsconfig

Shared TypeScript configs: `base.json` (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride`), `nest.json`, `next.json`. Extend, don't loosen — the strictness is the point.

## TypeScript 7 (native) toolchain

Type-checking and package emit run on **TypeScript 7** (native/Go `tsc`),
installed as the `typescript7` alias inside `tools/tsc7` and invoked by each
package's `typecheck`/`build` script. The `typescript@5.9.3` dependency that
every package still declares is a **library shim**: typescript-eslint,
eslint-plugin-perfectionist, ts-node, and Next's built-in checker consume the
old JS compiler API, which TS7 no longer ships. Keep both in place until those
tools support TS7, then collapse to a single dependency.

TS7 config notes (already applied): `baseUrl` is removed — use relative
`paths`; emitting packages must set an explicit `rootDir`.

## `tsconfig.spec.json` — test files are type-checked too

A package's `tsconfig.json` produces build output, so it excludes its tests
(`"exclude": ["src/**/*.spec.ts", "test"]`) and therefore never compiles them.
That exclusion used to be a blind spot: a spec could carry a real type error and
still pass every gate. Every package that owns at least one `*.spec.ts` under
`src/` now carries a sibling `tsconfig.spec.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.spec.ts", "src/__tests__/**/*.spec.ts"],
  "exclude": []
}
```

and its `typecheck` script runs both programs:

```json
"typecheck": "tsc -p tsconfig.json --noEmit && tsc -p tsconfig.spec.json --noEmit"
```

Rules of the convention:

- `build` must not pull tests in — only `typecheck` runs the spec program.
- `extends` inherits `compilerOptions` from the package config, so a spec is
  checked under the same strictness (`strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`) as the code it exercises.
- `extends` does **not** inherit `include`/`exclude`; both are re-declared.
- Two documented deviations exist: `@repo/api-sort` omits `"node"` from `types`
  because that package does not depend on `@types/node`; `@repo/feature-upload`
  adds `"test/**/*.spec.ts"` because its integration specs live outside `src/`.
- Fix a spec that fails this program. Never widen the config (loosening
  `strict`, adding `skipLibCheck`, or excluding the file) to silence it.
