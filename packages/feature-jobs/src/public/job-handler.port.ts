import type { JsonObject } from "@repo/api-kernel";

/** Context handed to a job handler when its job is dispatched. */
export interface JobHandlerContext {
  jobId: string;
  payload: JsonObject;
  organizationId: string | null;
  createdById: string | null;
}

/**
 * Feature-contributed job handler. Features register handlers for their own
 * job types (e.g. mail.send, notification.send) via JOB_HANDLER multi-
 * providers; the jobs core dispatches by `type` without importing the owning
 * feature.
 */
export interface JobHandlerContribution {
  /** Job type this handler processes, e.g. `"mail.send"`. */
  readonly type: string;
  readonly handle: (context: JobHandlerContext) => Promise<void>;
}

export const JOB_HANDLER = Symbol("JOB_HANDLER");
