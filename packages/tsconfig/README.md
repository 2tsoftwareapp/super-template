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
