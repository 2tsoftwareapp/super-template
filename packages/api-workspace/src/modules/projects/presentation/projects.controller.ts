import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiArrayResponse,
  ApiDataResponse,
  ApiPaginatedResponse,
  SuccessFlagDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';

import { ProjectsService } from '../application/projects.service';
import {
  CreateProjectDto,
  ProjectAttachmentDto,
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
    const result = await this.projectsService.list(user, {
      page: query.page,
      limit: query.limit,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
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

  @Post()
  @ApiDataResponse(ProjectDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateProjectDto,
    @Req() request: Request,
  ) {
    return this.projectsService.create(
      user,
      {
        name: input.name,
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
      },
      request.requestContext,
    );
  }

  @Get(':id/attachments')
  @ApiArrayResponse(ProjectAttachmentDto)
  async listAttachments(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) projectId: string,
  ) {
    const attachments = await this.projectsService.listAttachments(
      user,
      projectId,
    );

    return {
      data: attachments,
      meta: {},
    };
  }

  @Get(':id')
  @ApiDataResponse(ProjectDto)
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) projectId: string,
  ) {
    return this.projectsService.getById(user, projectId);
  }

  @Patch(':id')
  @ApiDataResponse(ProjectDto)
  update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) projectId: string,
    @Body() input: UpdateProjectDto,
    @Req() request: Request,
  ) {
    return this.projectsService.update(
      user,
      projectId,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
      },
      request.requestContext,
    );
  }

  @Delete(':id')
  @ApiDataResponse(SuccessFlagDto)
  remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) projectId: string,
    @Req() request: Request,
  ) {
    return this.projectsService.remove(user, projectId, request.requestContext);
  }

  @Post(':id/restore')
  @ApiDataResponse(ProjectDto, 201)
  restore(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) projectId: string,
    @Req() request: Request,
  ) {
    return this.projectsService.restore(
      user,
      projectId,
      request.requestContext,
    );
  }
}
