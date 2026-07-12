import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ACTION, ApiPaginatedResponse, perm } from '@repo/api-core';
import { Authorize } from '@repo/api-core';

import { ListActivitiesUseCase } from '../application/use-cases/list-activities.use-case';
import { ActivitiesQueryDto, ActivityDto } from './activities.dto';

@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly listActivities: ListActivitiesUseCase) {}

  @Get()
  @Authorize({ permissions: [perm('activities', ACTION.READ)] })
  @ApiPaginatedResponse(ActivityDto)
  async list(@Query() query: ActivitiesQueryDto) {
    const result = await this.listActivities.execute({
      page: query.page,
      limit: query.limit,
      ...(query.entityType !== undefined
        ? { entityType: query.entityType }
        : {}),
      ...(query.entityId !== undefined ? { entityId: query.entityId } : {}),
      ...(query.actorId !== undefined ? { actorId: query.actorId } : {}) });

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit) } };
  }
}
