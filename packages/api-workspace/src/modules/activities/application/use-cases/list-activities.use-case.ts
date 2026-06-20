import { Injectable } from '@nestjs/common';

import type { ListActivitiesQuery } from '../activities.types';

import { ActivitiesRepository } from '../../infrastructure/activities.repository';

@Injectable()
export class ListActivitiesUseCase {
  constructor(private readonly activitiesRepository: ActivitiesRepository) {}

  async execute(query: ListActivitiesQuery) {
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
