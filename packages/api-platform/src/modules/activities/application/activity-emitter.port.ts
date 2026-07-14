import type { JsonObject } from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';

export interface ActivityEmitInput {
  organizationId: string;
  summary: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  metadata?: JsonObject | null;
}

export interface ActivityEmitter {
  emit(
    input: ActivityEmitInput,
    executor?: TransactionExecutor,
  ): Promise<void>;
}

export const ACTIVITY_EMITTER = Symbol('ACTIVITY_EMITTER');
