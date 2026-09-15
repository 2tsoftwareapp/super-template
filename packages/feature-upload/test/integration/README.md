# feature-upload integration tests

Integration tests for the object-storage boundary live here. They run against real
infrastructure instead of mocks, so they are opt-in and stay out of the default
`pnpm --filter @repo/feature-upload test` run.

| Spec                                       | Requires                                   | Default run                      |
| ------------------------------------------ | ------------------------------------------ | -------------------------------- |
| `local-object-storage.integration.spec.ts` | nothing (writes to a temp directory)       | runs always                      |
| `s3-object-storage.integration.spec.ts`    | a reachable S3-compatible endpoint (MinIO) | only when `RUN_S3_INTEGRATION=1` |

## Running

```sh
# both integration specs, with the S3 spec enabled
pnpm --filter @repo/feature-upload test:integration

# only the S3 round-trip
pnpm --filter @repo/feature-upload test:s3
```

`test:integration` is the canonical entry point; the underlying command is
`RUN_S3_INTEGRATION=1 vitest run test/integration`.

Without `RUN_S3_INTEGRATION=1` the S3 suite is reported as skipped, so a green
default run is not evidence that the S3 boundary works.

## Prerequisites for the S3 spec

1. MinIO reachable at the configured endpoint (default `http://localhost:9000`,
   health probe `GET /minio/health/live`).
2. The target bucket must already exist. The S3 API does not create buckets on
   `PutObject`, so a missing bucket fails with `NoSuchBucket`.

Start both with the repository compose file:

```sh
docker compose -f infra/docker-compose.yml up -d minio minio-init
```

`minio-init` is the container that creates the bucket (`mc mb --ignore-existing`)
and disables anonymous access. If MinIO is already running but the bucket is
missing, re-run just the initialiser:

```sh
docker compose -f infra/docker-compose.yml up minio-init
```

## Configuration

The spec reads its settings from `process.env` and falls back to the values in
the repository `.env`. It does not load `.env` itself, so exporting the variables
is how you point it at a different endpoint:

| Variable               | Default                  |
| ---------------------- | ------------------------ |
| `S3_BUCKET`            | `super-template-uploads` |
| `S3_REGION`            | `us-east-1`              |
| `S3_ENDPOINT`          | `http://localhost:9000`  |
| `S3_ACCESS_KEY_ID`     | `minioadmin`             |
| `S3_SECRET_ACCESS_KEY` | `minioadminsecret`       |

## What the S3 spec asserts

A single test round-trips a uniquely named object through the real
`S3ObjectStorage` adapter: `upload` returns the key, `read` returns the exact
bytes, `getSignedUrl` produces a URL carrying `X-Amz-Signature=`, and after
`delete` the object is no longer readable. The object is deleted in a `finally`
block so a failing assertion does not leave data behind.
