import type { AuthenticatedRequestUser } from "@repo/api-core";
import type { Request, Response } from "express";

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiProduces, ApiTags } from "@nestjs/swagger";
import { ACTION, ApiDataResponse, ApiPaginatedResponse, perm } from "@repo/api-core";
import { Authorize, CurrentUser, SkipEnvelope } from "@repo/api-core";

import { DownloadAuditExportUseCase } from "../application/use-cases/download-audit-export.use-case";
import { ExportAuditLogsUseCase } from "../application/use-cases/export-audit-logs.use-case";
import { GetAuditLogUseCase } from "../application/use-cases/get-audit-log.use-case";
import { ListAuditLogsUseCase } from "../application/use-cases/list-audit-logs.use-case";
import {
  AuditExportResultDto,
  AuditLogDto,
  AuditLogsQueryDto,
  ExportAuditLogsQueryDto,
} from "./audit.dto";

@ApiTags("admin-audit")
@ApiBearerAuth()
@Controller("admin/audit-logs")
export class AuditController {
  constructor(
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
    private readonly exportAuditLogsUseCase: ExportAuditLogsUseCase,
    private readonly getAuditLogUseCase: GetAuditLogUseCase,
    private readonly downloadAuditExportUseCase: DownloadAuditExportUseCase,
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

  @Post("export")
  @Authorize({ permissions: [perm("audit", ACTION.READ)] })
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
        ...(input.resourceType !== undefined ? { resourceType: input.resourceType } : {}),
        ...(input.resourceId !== undefined ? { resourceId: input.resourceId } : {}),
        ...(input.from !== undefined ? { from: input.from } : {}),
        ...(input.to !== undefined ? { to: input.to } : {}),
        ...(input.q !== undefined ? { q: input.q } : {}),
      },
      request.requestContext,
    );

    return { data: result };
  }

  @Get("exports/:fileId/download")
  @Authorize({ permissions: [perm("audit", ACTION.READ)] })
  @SkipEnvelope()
  @ApiProduces("text/csv")
  @ApiParam({ name: "fileId", format: "uuid" })
  @ApiOkResponse({
    description: "CSV audit-log export download",
    schema: { type: "string", format: "binary" },
  })
  async downloadExport(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("fileId", new ParseUUIDPipe()) fileId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { content, originalName } = await this.downloadAuditExportUseCase.execute(user, fileId);

    const safeFilename = originalName.replace(/["\\\r\n]/g, "_");
    response.setHeader("Content-Type", "text/csv");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(originalName)}`,
    );
    response.setHeader("Content-Length", content.length.toString());
    response.setHeader("X-Content-Type-Options", "nosniff");

    return new StreamableFile(content);
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
