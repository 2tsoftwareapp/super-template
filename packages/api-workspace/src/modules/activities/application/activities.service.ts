import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import type { ListActivitiesQuery } from './activities.types';

import { ActivitiesRepository } from '../infrastructure/activities.repository';

interface EmitActivityInput {
  organizationId: string;
  summary: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class ActivitiesService {
  constructor(private readonly activitiesRepository: ActivitiesRepository) {}

  async emit(input: EmitActivityInput, executor?: DatabaseExecutor) {
    const activity = await this.activitiesRepository.create(
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

    return activity;
  }

  async list(query: ListActivitiesQuery) {
    const result = await this.activitiesRepository.list({
      page: query.page,
      limit: query.limit,
      ...(query.entityType !== undefined
        ? { entityType: query.entityType }
        : {}),
      ...(query.entityId !== undefined ? { entityId: query.entityId } : {}),
      ...(query.actorId !== undefined ? { actorId: query.actorId } : {}),
    });

    return {
      rows: result.rows.map((row) => ({
        id: row.id,
        summary: row.summary,
        entityType: row.entityType,
        entityId: row.entityId,
        actorId: row.actorId ?? null,
        visibility: row.visibility,
        metadata: row.metadata ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      total: result.total,
    };
  }
}
