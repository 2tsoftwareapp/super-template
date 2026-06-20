import type { JsonObject } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import type { ListActivitiesQuery } from './activities.types';

import { EmitActivityUseCase } from './use-cases/emit-activity.use-case';
import { ListActivitiesUseCase } from './use-cases/list-activities.use-case';

interface EmitActivityInput {
  organizationId: string;
  summary: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  metadata?: JsonObject | null;
}

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly emitActivityUseCase: EmitActivityUseCase,
    private readonly listActivitiesUseCase: ListActivitiesUseCase,
  ) {}

  async emit(input: EmitActivityInput, executor?: DatabaseExecutor) {
    return this.emitActivityUseCase.execute(input, executor);
  }

  async list(query: ListActivitiesQuery) {
    return this.listActivitiesUseCase.execute(query);
  }
}
