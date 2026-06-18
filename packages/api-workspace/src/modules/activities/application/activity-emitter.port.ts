import type { DatabaseExecutor } from '@repo/api-database';

export interface ActivityEmitInput {
  organizationId: string;
  summary: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  metadata?: Record<string, unknown> | null;
}

export interface ActivityEmitter {
  emit(
    input: ActivityEmitInput,
    executor?: DatabaseExecutor,
  ): Promise<unknown>;
}

export const ACTIVITY_EMITTER = Symbol('ACTIVITY_EMITTER');
