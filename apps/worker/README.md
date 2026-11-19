# worker

Standalone background host (ADR 0003): no HTTP surface, consumes jobs and
outbox work with the same composed feature graph as the API.

- Register work through feature manifests; do not import feature internals.
- Long-running handlers must be idempotent: a timed-out attempt can be retried
  while the first one is still writing.

Commands: `pnpm --filter worker build|lint|test|typecheck`.
