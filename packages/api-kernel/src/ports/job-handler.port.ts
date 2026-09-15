import type { JsonObject } from "../types/json-value";

/**
 * Kernel-owned job-handler port (moved from @repo/feature-jobs so that
 * features can register background-job handlers without depending on the
 * jobs feature). The jobs core binds the registry implementation; consumers
 * inject the token and register handlers for their own job types.
 */
export interface JobHandlerContext {
  jobId: string;
  payload: JsonObject;
  organizationId: string | null;
  createdById: string | null;
}

/**
 * Feature-contributed job handler. Features register handlers for their own
 * job types (e.g. mail.send, notification.send, auth.cleanup-tokens) via the
 * registry; the jobs core dispatches by `type` without importing the owning
 * feature.
 */
export interface JobHandlerContribution {
  /** Job type this handler processes, e.g. `"mail.send"`. */
  readonly type: string;
  readonly handle: (context: JobHandlerContext) => Promise<void>;
}

export const JOB_HANDLER = Symbol("JOB_HANDLER");
export const JOB_HANDLER_REGISTRY = Symbol("JOB_HANDLER_REGISTRY");
export interface JobHandlerRegistryPort {
  registerHandler(type: string, handler: JobHandlerContribution["handle"]): void;
}
