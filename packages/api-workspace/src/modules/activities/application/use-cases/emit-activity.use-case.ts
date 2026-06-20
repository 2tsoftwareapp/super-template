import type { JsonObject } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import { ActivitiesRepository } from '../../infrastructure/activities.repository';

export interface EmitActivityInput {
  organizationId: string;
  summary: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  metadata?: JsonObject | null;
}

@Injectable()
export class EmitActivityUseCase {
  constructor(private readonly activitiesRepository: ActivitiesRepository) {}

  async execute(input: EmitActivityInput, executor?: DatabaseExecutor) {
    return this.activitiesRepository.create(
      {
        organizationId: input.organizationId,
        summary: input.summary,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? null,
        visibility: input.visibility ?? 'INTERNAL',
        metadata: input.metadata ?? null,
      },
      executor,
    );
  }
}
