import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
} from '@repo/api-core/common/decorators/api-response.decorator';
import { CurrentUser } from '@repo/api-core/common/decorators/current-user.decorator';
import { Permissions } from '@repo/api-core/common/decorators/permissions.decorator';
import type { AuthenticatedRequestUser } from '@repo/api-core/common/types/request-context';
import { PERMISSION_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';
import { JobsService } from '../application/jobs.service';
import { JobDto, JobsQueryDto } from './jobs.dto';

@ApiTags('admin-jobs')
@ApiBearerAuth()
@Controller('admin/jobs')
export class AdminJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @Permissions(PERMISSION_NAMES.JOBS_READ)
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
  @Permissions(PERMISSION_NAMES.JOBS_MANAGE)
  @ApiDataResponse(JobDto)
  cancelJob(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') jobId: string,
  ) {
    return this.jobsService.cancelJob(user, jobId);
  }
}
