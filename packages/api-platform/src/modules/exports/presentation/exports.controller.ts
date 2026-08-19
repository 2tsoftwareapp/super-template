import type { AuthenticatedRequestUser } from "@repo/api-core";
import type { Request } from "express";

import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ACTION, ApiDataResponse, perm } from "@repo/api-core";
import { CurrentUser } from "@repo/api-core";
import { Authorize } from "@repo/api-core";

import { CreateExportUseCase } from "../application/use-cases/create-export.use-case";
import { GetExportUseCase } from "../application/use-cases/get-export.use-case";
import { CreateExportDto, ExportJobDto } from "./exports.dto";

@ApiTags("exports")
@ApiBearerAuth()
@Controller("exports")
export class ExportsController {
  constructor(
    private readonly createExport: CreateExportUseCase,
    private readonly getExport: GetExportUseCase,
  ) {}

  @Post()
  @Authorize({ permissions: [perm("exports", ACTION.CREATE)] })
  @ApiDataResponse(ExportJobDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateExportDto,
    @Req() request: Request,
  ) {
    return this.createExport.execute(
      user,
      {
        type: input.type,
        ...(input.filters !== undefined ? { filters: input.filters } : {}),
        ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
      },
      request.requestContext,
    );
  }

  @Get(":id")
  @Authorize({ permissions: [perm("exports", ACTION.READ)] })
  @ApiDataResponse(ExportJobDto)
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) jobId: string,
  ) {
    return this.getExport.execute(user, jobId);
  }
}
