/**
 * Vocabulary of the observability events written to `w_job_events`.
 *
 * Single source of truth: the persistence column enum, the repository union, the
 * application port and the API DTO enum all derive from this list, so a value
 * added here reaches the OpenAPI contract (and therefore the generated client)
 * instead of drifting out of the request/response schema.
 *
 * The column itself is plain `text` (migration 0013), so adding a value here
 * needs no migration.
 */
export const JOB_EVENT_TYPES = [
  "claimed",
  "completed",
  "failed",
  "processing_error",
  "retry_scheduled",
  "cancelled",
  "no_handler",
  "dependency_failed",
] as const;

export type JobEventType = (typeof JOB_EVENT_TYPES)[number];
