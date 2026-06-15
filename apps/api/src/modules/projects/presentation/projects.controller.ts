import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  SuccessFlagDto,
} from '../../../common/decorators/api-response.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../../common/types/request-context';
import { ProjectsService } from '../application/projects.service';
import {
  CreateProjectDto,
  ProjectDto,
  ProjectsQueryDto,
  UpdateProjectDto,
} from './projects.dto';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiPaginatedResponse(ProjectDto)
  async list(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: ProjectsQueryDto,
  ) {
    const result = await this.projectsService.list(user, query);

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

  @Post()
  @ApiDataResponse(ProjectDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateProjectDto,
    @Req() request: Request,
  ) {
    return this.projectsService.create(user, input, request.requestContext);
  }

  @Get(':id')
  @ApiDataResponse(ProjectDto)
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') projectId: string,
  ) {
    return this.projectsService.getById(user, projectId);
  }

  @Patch(':id')
  @ApiDataResponse(ProjectDto)
  update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') projectId: string,
    @Body() input: UpdateProjectDto,
    @Req() request: Request,
  ) {
    return this.projectsService.update(
      user,
      projectId,
      input,
      request.requestContext,
    );
  }

  @Delete(':id')
  @ApiDataResponse(SuccessFlagDto)
  remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') projectId: string,
    @Req() request: Request,
  ) {
    return this.projectsService.remove(user, projectId, request.requestContext);
  }

  @Post(':id/restore')
  @ApiDataResponse(ProjectDto, 201)
  restore(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') projectId: string,
    @Req() request: Request,
  ) {
    return this.projectsService.restore(
      user,
      projectId,
      request.requestContext,
    );
  }
}
