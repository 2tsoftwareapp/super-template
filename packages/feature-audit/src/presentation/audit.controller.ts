import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ACTION, ApiDataResponse, ApiPaginatedResponse, perm } from "@repo/api-runtime";
import { Authorize, CurrentUser } from "@repo/api-runtime";

import { GetAuditLogUseCase } from "../application/use-cases/get-audit-log.use-case";
import { ListAuditLogsUseCase } from "../application/use-cases/list-audit-logs.use-case";
import { AuditLogDto, AuditLogsQueryDto } from "./audit.dto";

@ApiTags("admin-audit")
@ApiBearerAuth()
@Controller("admin/audit-logs")
export class AuditController {
  constructor(
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
    private readonly getAuditLogUseCase: GetAuditLogUseCase,
  ) {}

  @Get()
  @Authorize({ permissions: [perm("audit", ACTION.READ)] })
  @ApiPaginatedResponse(AuditLogDto)
  async listAuditLogs(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: AuditLogsQueryDto,
  ) {
    const result = await this.listAuditLogsUseCase.execute(user, {
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
      ...(query.actorId !== undefined ? { actorId: query.actorId } : {}),
      ...(query.action !== undefined ? { action: query.action } : {}),
      ...(query.resourceType !== undefined ? { resourceType: query.resourceType } : {}),
      ...(query.resourceId !== undefined ? { resourceId: query.resourceId } : {}),
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
      ...(query.q !== undefined ? { q: query.q } : {}),
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

  @Get(":id")
  @Authorize({ permissions: [perm("audit", ACTION.READ)] })
  @ApiDataResponse(AuditLogDto)
  async getAuditLog(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return { data: await this.getAuditLogUseCase.execute(user, id) };
  }
}
