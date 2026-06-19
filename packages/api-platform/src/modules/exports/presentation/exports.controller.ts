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

import { ExportsService } from '../application/exports.service';
import { CreateExportDto, ExportJobDto } from './exports.dto';

@ApiTags('exports')
@ApiBearerAuth()
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Post()
  @Authorize({ permissions: [perm('exports', ACTION.CREATE)] })
  @ApiDataResponse(ExportJobDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateExportDto,
    @Req() request: Request,
  ) {
    return this.exportsService.create(
      user,
      {
        type: input.type,
        ...(input.filters !== undefined ? { filters: input.filters } : {}),
        ...(input.idempotencyKey !== undefined
          ? { idempotencyKey: input.idempotencyKey }
          : {}) },
      request.requestContext,
    );
  }

  @Get(':id')
  @Authorize({ permissions: [perm('exports', ACTION.READ)] })
  @ApiDataResponse(ExportJobDto)
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return this.exportsService.getById(user, jobId);
  }
}
