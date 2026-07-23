import type { AuthenticatedRequestUser } from '@repo/api-core';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ACTION, ApiArrayResponse, ApiDataResponse, ApiPaginatedResponse, perm } from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Authorize } from '@repo/api-core';

import type { JobScope } from '../application/ports/jobs.repository.port';

import { AddJobDependencyUseCase } from '../application/use-cases/add-job-dependency.use-case';
import { CancelJobUseCase } from '../application/use-cases/cancel-job.use-case';
import { GetJobLogsUseCase } from '../application/use-cases/get-job-logs.use-case';
import { GetJobMetricsUseCase } from '../application/use-cases/get-job-metrics.use-case';
import { GetJobUseCase } from '../application/use-cases/get-job.use-case';
import { ListJobDependenciesUseCase } from '../application/use-cases/list-job-dependencies.use-case';
import { ListJobsUseCase } from '../application/use-cases/list-jobs.use-case';
import {
  AddJobDependencyDto,
  AdminJobsQueryDto,
  JobDependencyDto,
  JobDto,
  JobEventDto,
  JobListDto,
  JobLogsQueryDto,
  JobMetricsDto,
  JobMetricsQueryDto,
} from './jobs.dto';

@ApiTags('admin-jobs')
@ApiBearerAuth()
@Controller('admin/jobs')
export class AdminJobsController {
  constructor(
    private readonly listJobsUseCase: ListJobsUseCase,
    private readonly getJobMetricsUseCase: GetJobMetricsUseCase,
    private readonly getJobUseCase: GetJobUseCase,
    private readonly getJobLogsUseCase: GetJobLogsUseCase,
    private readonly listJobDependenciesUseCase: ListJobDependenciesUseCase,
    private readonly addJobDependencyUseCase: AddJobDependencyUseCase,
    private readonly cancelJobUseCase: CancelJobUseCase,
  ) {}

  @Get()
  @Authorize({ permissions: [perm('jobs', ACTION.READ)] })
  @ApiPaginatedResponse(JobListDto)
  async listJobs(@Query() query: AdminJobsQueryDto) {
    const scope = query.organizationId
      ? { type: 'organization' as const, organizationId: query.organizationId }
      : undefined;

    const result = await this.listJobsUseCase.execute({ ...query, ...(scope ? { scope } : {}) });

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

  @Get('metrics')
  @Authorize({ permissions: [perm('jobs', ACTION.READ)] })
  @ApiDataResponse(JobMetricsDto)
  async getMetrics(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: JobMetricsQueryDto,
  ) {
    const scope = user.organizationId
      ? { type: 'organization' as const, organizationId: user.organizationId }
      : undefined;

    return { data: await this.getJobMetricsUseCase.execute({ ...query, ...(scope ? { scope } : {}) }) };
  }

  @Get(':id')
  @Authorize({ permissions: [perm('jobs', ACTION.READ)] })
  @ApiDataResponse(JobDto)
  async getJob(
    @Param('id', new ParseUUIDPipe()) jobId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    const scope = user.organizationId
      ? { type: 'organization' as const, organizationId: user.organizationId }
      : undefined;

    return { data: await this.getJobUseCase.execute(jobId, scope) };
  }

  @Get(':id/logs')
  @Authorize({ permissions: [perm('jobs', ACTION.READ)] })
  @ApiPaginatedResponse(JobEventDto)
  async getJobLogs(
    @Param('id', new ParseUUIDPipe()) jobId: string,
    @Query() query: JobLogsQueryDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    const scope = user.organizationId
      ? { type: 'organization' as const, organizationId: user.organizationId }
      : undefined;

    const result = await this.getJobLogsUseCase.execute(jobId, query, scope);

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

  @Get(':id/dependencies')
  @Authorize({ permissions: [perm('jobs', ACTION.READ)] })
  @ApiArrayResponse(JobDependencyDto)
  async listDependencies(
    @Param('id', new ParseUUIDPipe()) jobId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    const scope = user.organizationId
      ? { type: 'organization' as const, organizationId: user.organizationId }
      : undefined;

    return { data: await this.listJobDependenciesUseCase.execute(jobId, scope) };
  }

  @Post(':id/dependencies')
  @Authorize({ permissions: [perm('jobs', ACTION.UPDATE)] })
  @ApiDataResponse(JobDependencyDto, 201)
  async addDependency(
    @Param('id', new ParseUUIDPipe()) jobId: string,
    @Body() input: AddJobDependencyDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    const scope = user.organizationId
      ? { type: 'organization' as const, organizationId: user.organizationId }
      : undefined;

    return {
      data: await this.addJobDependencyUseCase.execute(jobId, input.dependsOnJobId, scope),
    };
  }

  @Delete(':id')
  @Authorize({ permissions: [perm('jobs', ACTION.UPDATE)] })
  @ApiDataResponse(JobDto)
  async cancelJob(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return { data: await this.cancelJobUseCase.execute(user, jobId) };
  }
}