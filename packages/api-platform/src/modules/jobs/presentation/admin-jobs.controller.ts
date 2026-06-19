import type { AuthenticatedRequestUser } from '@repo/api-core';

import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {  ACTION, ApiDataResponse, ApiPaginatedResponse, perm } from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Authorize } from '@repo/api-core';

import { JobsService } from '../application/jobs.service';
import { JobDto, JobsQueryDto } from './jobs.dto';

@ApiTags('admin-jobs')
@ApiBearerAuth()
@Controller('admin/jobs')
export class AdminJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @Authorize({ permissions: [perm('jobs', ACTION.READ)] })
  @ApiPaginatedResponse(JobDto)
  async listJobs(@Query() query: JobsQueryDto) {
    const result = await this.jobsService.listJobs(query);

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit) } };
  }

  @Delete(':id')
  @Authorize({ permissions: [perm('jobs', ACTION.UPDATE)] })
  @ApiDataResponse(JobDto)
  cancelJob(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return this.jobsService.cancelJob(user, jobId);
  }
}
