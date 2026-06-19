import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {  ACTION, ApiDataResponse, perm } from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Authorize } from '@repo/api-core';

import { ImportsService } from '../application/imports.service';
import { CreateImportDto, ImportJobDto } from './imports.dto';

@ApiTags('imports')
@ApiBearerAuth()
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post()
  @Authorize({ permissions: [perm('imports', ACTION.CREATE)] })
  @ApiDataResponse(ImportJobDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateImportDto,
    @Req() request: Request,
  ) {
    return this.importsService.create(
      user,
      {
        type: input.type,
        fileId: input.fileId,
        ...(input.idempotencyKey !== undefined
          ? { idempotencyKey: input.idempotencyKey }
          : {}) },
      request.requestContext,
    );
  }

  @Get(':id')
  @Authorize({ permissions: [perm('imports', ACTION.READ)] })
  @ApiDataResponse(ImportJobDto)
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return this.importsService.getById(user, jobId);
  }

  @Post(':id/confirm')
  @Authorize({ permissions: [perm('imports', ACTION.UPDATE)] })
  @ApiDataResponse(ImportJobDto)
  confirm(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
    @Req() request: Request,
  ) {
    return this.importsService.confirm(user, jobId, request.requestContext);
  }
}
