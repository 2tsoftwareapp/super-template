import type { JsonObject } from "../common/types/json-value";
import type { TransactionExecutor } from "../common/types/transaction-executor";

export interface ActivityEmitInput {
  organizationId: string;
  summary: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  visibility?: "PUBLIC" | "PRIVATE" | "INTERNAL";
  metadata?: JsonObject | null;
}

/**
 * Cross-context port for writing user-visible activity feed entries. Implemented
 * by the platform activities module (ActivitiesService) and consumed by any
 * bounded context that wants to surface events in the activity feed.
 */
export interface ActivityEmitter {
  emit(input: ActivityEmitInput, executor?: TransactionExecutor): Promise<void>;
}

export const ACTIVITY_EMITTER = Symbol("ACTIVITY_EMITTER");
