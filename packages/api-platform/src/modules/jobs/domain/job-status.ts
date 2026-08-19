/**
 * Background-job lifecycle status. A framework-free domain type consumed by the
 * job lifecycle policy and re-exported by the application types for outer layers.
 */
export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "FAILED" | "BLOCKED";
