import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '@repo/api-core';
import { Permissions } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';

import { AuditService } from '../application/audit.service';
import { AuditLogDto, AuditLogsQueryDto } from './audit.dto';

@ApiTags('admin-audit')
@ApiBearerAuth()
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions(PERMISSION_NAMES.AUDIT_READ)
  @ApiPaginatedResponse(AuditLogDto)
  async listAuditLogs(@Query() query: AuditLogsQueryDto) {
    const result = await this.auditService.listAuditLogs(query);

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
