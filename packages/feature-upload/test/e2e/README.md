# feature-upload end-to-end tests

Package-level HTTP end-to-end tests belong here; composed API tests remain under apps/api/test.

There is no package-level HTTP e2e spec today, and that is deliberate. The upload
HTTP surface (`POST /api/v1/files`, versioning, batch operations) only exists once
the feature is composed into the API host — the controller is wired through the
feature manifest, the global pipeline (validation, auth, RLS guard, response
envelope) and the composed Drizzle schema. A package-level spec would have to
rebuild that composition with a test-only bootstrap, which is a second
implementation of the host: it would drift, and it would not prove what the
composed path does.

The composition-level coverage lives in the API host:

| Spec                                      | What it covers                                                     |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `apps/api/test/files-catalog.e2e.spec.ts` | Upload, versioning and batch operations over the composed HTTP API |

## Running

```sh
# the whole API e2e suite (PostgreSQL required, restricted role)
pnpm --filter api test:e2e

# just the upload/filing surface
pnpm --filter api exec vitest run test/files-catalog.e2e.spec.ts --maxWorkers=1
```

`pnpm run test:e2e:preflight` first, if the database has not been migrated or the
`.env` points at a superuser: the API e2e bootstrap refuses to run under a role
that bypasses RLS. See `docs/development.md` → "Opt-in integration and e2e suites".

The storage boundary itself is covered separately by
`test/integration/s3-object-storage.integration.spec.ts`, which talks to a real
S3-compatible endpoint through `S3ObjectStorage` and asserts upload, read,
presigned URL and delete. It does not go through HTTP, so it is an integration
test rather than an e2e one — see `test/integration/README.md`.
