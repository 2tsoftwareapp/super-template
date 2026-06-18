import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '@repo/api-core';
import { Authorize } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-core';

import { AuditService } from '../application/audit.service';
import { AuditLogDto, AuditLogsQueryDto } from './audit.dto';

@ApiTags('admin-audit')
@ApiBearerAuth()
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Authorize({ permissions: [PERMISSION_NAMES.AUDIT_READ] })
  @ApiPaginatedResponse(AuditLogDto)
  async listAuditLogs(@Query() query: AuditLogsQueryDto) {
    const result = await this.auditService.listAuditLogs({
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
