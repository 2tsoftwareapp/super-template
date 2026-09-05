import type { AuthenticatedRequestUser } from "@repo/api-kernel";
import type { Request, Response } from "express";

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiProduces, ApiTags } from "@nestjs/swagger";
import {
  ACTION,
  ApiDataResponse,
  Authorize,
  CurrentUser,
  perm,
  SkipEnvelope,
} from "@repo/api-runtime";

import { DownloadAuditExportUseCase } from "../application/download-audit-export.use-case";
import { ExportAuditLogsUseCase } from "../application/export-audit-logs.use-case";
import { AuditExportResultDto, ExportAuditLogsQueryDto } from "./audit-export.dto";

@ApiTags("admin-audit")
@ApiBearerAuth()
@Controller("admin/audit-logs")
export class AuditExportController {
  constructor(
    private readonly exportAuditLogsUseCase: ExportAuditLogsUseCase,
    private readonly downloadAuditExportUseCase: DownloadAuditExportUseCase,
  ) {}

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
}
