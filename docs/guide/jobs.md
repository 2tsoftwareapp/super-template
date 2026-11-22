# Jobs and worker

Jobs are rows in the `jobs` table. The API inserts them; `apps/worker` claims
them with `FOR UPDATE SKIP LOCKED`, so several workers can run side by side
without Redis.

## Lifecycle

```
PENDING ──claim──▶ PROCESSING ──ok──▶ DONE
                        │
                        ├─error, attempts left──▶ PENDING (backoff)
                        └─error, no attempts / permanent──▶ FAILED
```

- Default budget: 5 attempts (`max_attempts`).
- Backoff: 15 s × 2^attempts, capped at 300 s.
- A `PROCESSING` row idle for more than 600 s (`JOB_LOCK_TIMEOUT_SECONDS`) is
  reclaimed, or failed if it has no attempts left. A stale worker cannot
  overwrite the result of a newer claim.
- Unknown job types and invalid payloads throw `PermanentJobError` and fail
  immediately without retries.
- The worker claims 5 jobs at a time and sleeps 500 ms when the queue is empty.
  On SIGTERM or SIGINT it stops claiming, finishes the batch in hand and exits.

## Job types

| Type        | Payload                 | Effect                    |
| ----------- | ----------------------- | ------------------------- |
| `demo.echo` | any JSON                | returns the payload       |
| `demo.fail` | any JSON                | always fails (retry demo) |
| `mail.send` | `{ to, subject, text }` | sends through `SMTP_URL`  |

## Add a job type

1. Add a handler to `apps/worker/src/handlers.ts`. Validate the payload and
   throw `PermanentJobError` when it cannot ever succeed.
2. Add the type to `JOB_TYPES` in `apps/api/src/modules/jobs/jobs.dto.ts`.
3. Add a spec under `apps/worker/src/__tests__/`.
