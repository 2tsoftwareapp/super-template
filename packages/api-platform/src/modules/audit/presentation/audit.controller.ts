import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {  ACTION, ApiDataResponse, ApiPaginatedResponse, perm } from '@repo/api-core';
import { Authorize, CurrentUser } from '@repo/api-core';

import { ExportAuditLogsUseCase } from '../application/use-cases/export-audit-logs.use-case';
import { GetAuditLogUseCase } from '../application/use-cases/get-audit-log.use-case';
import { ListAuditLogsUseCase } from '../application/use-cases/list-audit-logs.use-case';
import {
  AuditExportResultDto,
  AuditLogDto,
  AuditLogsQueryDto,
  ExportAuditLogsQueryDto,
} from './audit.dto';

@ApiTags('admin-audit')
@ApiBearerAuth()
@Controller('admin/audit-logs')
export class AuditController {
  constructor(
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
    private readonly exportAuditLogsUseCase: ExportAuditLogsUseCase,
    private readonly getAuditLogUseCase: GetAuditLogUseCase,
  ) {}

  @Get()
  @Authorize({ permissions: [perm('audit', ACTION.READ)] })
  @ApiPaginatedResponse(AuditLogDto)
  async listAuditLogs(@Query() query: AuditLogsQueryDto) {
    const result = await this.listAuditLogsUseCase.execute({
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
      ...(query.actorId !== undefined ? { actorId: query.actorId } : {}),
      ...(query.action !== undefined ? { action: query.action } : {}),
      ...(query.resourceType !== undefined
        ? { resourceType: query.resourceType }
        : {}),
      ...(query.resourceId !== undefined
        ? { resourceId: query.resourceId }
        : {}),
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
      ...(query.q !== undefined ? { q: query.q } : {}) });

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit) } };
  }

  @Post('export')
  @Authorize({ permissions: [perm('audit', ACTION.READ)] })
  @ApiDataResponse(AuditExportResultDto, 201)
  async exportAuditLogs(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: ExportAuditLogsQueryDto,
    @Req() request: Request,
  ) {
    const result = await this.exportAuditLogsUseCase.execute(
      user,
      {
        ...(input.actorId !== undefined ? { actorId: input.actorId } : {}),
        ...(input.action !== undefined ? { action: input.action } : {}),
        ...(input.resourceType !== undefined
          ? { resourceType: input.resourceType }
          : {}),
        ...(input.resourceId !== undefined
          ? { resourceId: input.resourceId }
          : {}),
        ...(input.from !== undefined ? { from: input.from } : {}),
        ...(input.to !== undefined ? { to: input.to } : {}),
        ...(input.q !== undefined ? { q: input.q } : {}),
      },
      request.requestContext,
    );

    return { data: result };
  }

  @Get(':id')
  @Authorize({ permissions: [perm('audit', ACTION.READ)] })
  @ApiDataResponse(AuditLogDto)
  async getAuditLog(@Param('id', new ParseUUIDPipe()) id: string) {
    return { data: await this.getAuditLogUseCase.execute(id) };
  }
}
