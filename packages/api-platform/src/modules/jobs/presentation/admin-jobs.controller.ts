import type { AuthenticatedRequestUser } from '@repo/api-core';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {  ACTION, ApiArrayResponse, ApiDataResponse, ApiPaginatedResponse, perm } from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Authorize } from '@repo/api-core';

import { JobsService } from '../application/jobs.service';
import {
  AddJobDependencyDto,
  JobDependencyDto,
  JobDto,
  JobEventDto,
  JobLogsQueryDto,
  JobMetricsDto,
  JobMetricsQueryDto,
  JobsQueryDto } from './jobs.dto';

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

  @Get('metrics')
  @Authorize({ permissions: [perm('jobs', ACTION.READ)] })
  @ApiDataResponse(JobMetricsDto)
  async getMetrics(@Query() query: JobMetricsQueryDto) {
    return { data: await this.jobsService.getJobMetrics(query) };
  }

  @Get(':id')
  @Authorize({ permissions: [perm('jobs', ACTION.READ)] })
  @ApiDataResponse(JobDto)
  async getJob(@Param('id', new ParseUUIDPipe()) jobId: string) {
    return { data: await this.jobsService.getJob(jobId) };
  }

  @Get(':id/logs')
  @Authorize({ permissions: [perm('jobs', ACTION.READ)] })
  @ApiPaginatedResponse(JobEventDto)
  async getJobLogs(
    @Param('id', new ParseUUIDPipe()) jobId: string,
    @Query() query: JobLogsQueryDto,
  ) {
    const result = await this.jobsService.getJobLogs(jobId, query);

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit) } };
  }

  @Get(':id/dependencies')
  @Authorize({ permissions: [perm('jobs', ACTION.READ)] })
  @ApiArrayResponse(JobDependencyDto)
  async listDependencies(@Param('id', new ParseUUIDPipe()) jobId: string) {
    return { data: await this.jobsService.listJobDependencies(jobId) };
  }

  @Post(':id/dependencies')
  @Authorize({ permissions: [perm('jobs', ACTION.UPDATE)] })
  @ApiDataResponse(JobDependencyDto, 201)
  async addDependency(
    @Param('id', new ParseUUIDPipe()) jobId: string,
    @Body() input: AddJobDependencyDto,
  ) {
    return {
      data: await this.jobsService.addJobDependency(
        jobId,
        input.dependsOnJobId,
      ),
    };
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
