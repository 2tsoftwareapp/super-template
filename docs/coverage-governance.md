# Coverage governance

The root coverage gate is `pnpm run test:coverage`. It runs the declared
coverage-enabled workspaces sequentially and writes the combined summary to
`coverage/aggregate-summary.json`:

- `apps/api` unit and CLI tests
- `packages/config`
- `packages/utils`
- `packages/feature-upload`

The current aggregate baseline is 60% statements, 50% branches, 45%
functions, and 60% lines. The same thresholds run in the `quality` CI job.
They are stored centrally in `scripts/run-coverage.mjs`; package-level
thresholds remain local to the packages that define them.

To exercise the failure path locally, temporarily override one metric, for
example `COVERAGE_MIN_LINES=99 pnpm run test:coverage`. The override is an
explicit diagnostic input; normal CI uses the checked-in baseline.

Packages without a coverage summary are not silently counted as covered. Add a
workspace to `scripts/run-coverage.mjs` only after its test runner emits the
required JSON summary.
