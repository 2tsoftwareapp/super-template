import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Permissions } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-core';

import { ExportsService } from '../application/exports.service';
import { CreateExportDto, ExportJobDto } from './exports.dto';

@ApiTags('exports')
@ApiBearerAuth()
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Post()
  @Permissions(PERMISSION_NAMES.EXPORTS_MANAGE)
  @ApiDataResponse(ExportJobDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateExportDto,
    @Req() request: Request,
  ) {
    return this.exportsService.create(user, input, request.requestContext);
  }

  @Get(':id')
  @Permissions(PERMISSION_NAMES.EXPORTS_MANAGE)
  @ApiDataResponse(ExportJobDto)
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return this.exportsService.getById(user, jobId);
  }
}
