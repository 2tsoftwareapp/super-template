import type { AuthenticatedRequestUser } from '@repo/api-core';

import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Authorize } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-core';

import { JobsService } from '../application/jobs.service';
import { JobDto, JobsQueryDto } from './jobs.dto';

@ApiTags('admin-jobs')
@ApiBearerAuth()
@Controller('admin/jobs')
export class AdminJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @Authorize({ permissions: [PERMISSION_NAMES.JOBS_READ] })
  @ApiPaginatedResponse(JobDto)
  async listJobs(@Query() query: JobsQueryDto) {
    const result = await this.jobsService.listJobs(query);

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

  @Delete(':id')
  @Authorize({ permissions: [PERMISSION_NAMES.JOBS_MANAGE] })
  @ApiDataResponse(JobDto)
  cancelJob(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return this.jobsService.cancelJob(user, jobId);
  }
}
