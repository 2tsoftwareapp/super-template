import type { AuthenticatedRequestUser } from "@repo/api-kernel";
import type { Request } from "express";

import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ACTION, ApiDataResponse, perm } from "@repo/api-runtime";
import { CurrentUser } from "@repo/api-runtime";
import { Authorize } from "@repo/api-runtime";

import { ConfirmImportUseCase } from "../application/use-cases/confirm-import.use-case";
import { CreateImportUseCase } from "../application/use-cases/create-import.use-case";
import { GetImportUseCase } from "../application/use-cases/get-import.use-case";
import { CreateImportDto, ImportJobDto } from "./imports.dto";

@ApiTags("imports")
@ApiBearerAuth()
@Controller("imports")
export class ImportsController {
  constructor(
    private readonly createImport: CreateImportUseCase,
    private readonly getImport: GetImportUseCase,
    private readonly confirmImport: ConfirmImportUseCase,
  ) {}

  @Post()
  @Authorize({ permissions: [perm("imports", ACTION.CREATE)] })
  @ApiDataResponse(ImportJobDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateImportDto,
    @Req() request: Request,
  ) {
    return this.createImport.execute(
      user,
      {
        type: input.type,
        fileId: input.fileId,
        ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
      },
      request.requestContext,
    );
  }

  @Get(":id")
  @Authorize({ permissions: [perm("imports", ACTION.READ)] })
  @ApiDataResponse(ImportJobDto)
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) jobId: string,
  ) {
    return this.getImport.execute(user, jobId);
  }

  @Post(":id/confirm")
  @Authorize({ permissions: [perm("imports", ACTION.UPDATE)] })
  @ApiDataResponse(ImportJobDto)
  confirm(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) jobId: string,
    @Req() request: Request,
  ) {
    return this.confirmImport.execute(user, jobId, request.requestContext);
  }
}
