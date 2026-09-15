/**
 * Kernel-owned job-handler port. Re-exported here so `@repo/feature-jobs`
 * keeps its public surface stable; new consumers should import from
 * `@repo/api-kernel` directly.
 */
export {
  JOB_HANDLER,
  JOB_HANDLER_REGISTRY,
  type JobHandlerContext,
  type JobHandlerContribution,
  type JobHandlerRegistryPort,
} from "@repo/api-kernel";
