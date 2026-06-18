import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '@repo/api-core';
import { Authorize } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-core';

import { ActivitiesService } from '../application/activities.service';
import { ActivitiesQueryDto, ActivityDto } from './activities.dto';

@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @Authorize({ permissions: [PERMISSION_NAMES.ACTIVITIES_READ] })
  @ApiPaginatedResponse(ActivityDto)
  async list(@Query() query: ActivitiesQueryDto) {
    const result = await this.activitiesService.list({
      page: query.page,
      limit: query.limit,
      ...(query.entityType !== undefined
        ? { entityType: query.entityType }
        : {}),
      ...(query.entityId !== undefined ? { entityId: query.entityId } : {}),
      ...(query.actorId !== undefined ? { actorId: query.actorId } : {}),
    });

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }
}
