import type { JsonObject } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

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
    executor?: DatabaseExecutor,
  ): Promise<void>;
}

export const ACTIVITY_EMITTER = Symbol('ACTIVITY_EMITTER');
