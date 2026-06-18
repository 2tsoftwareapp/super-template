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

import { ImportsService } from '../application/imports.service';
import { CreateImportDto, ImportJobDto } from './imports.dto';

@ApiTags('imports')
@ApiBearerAuth()
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post()
  @Permissions(PERMISSION_NAMES.IMPORTS_MANAGE)
  @ApiDataResponse(ImportJobDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateImportDto,
    @Req() request: Request,
  ) {
    return this.importsService.create(user, input, request.requestContext);
  }

  @Get(':id')
  @Permissions(PERMISSION_NAMES.IMPORTS_MANAGE)
  @ApiDataResponse(ImportJobDto)
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
  ) {
    return this.importsService.getById(user, jobId);
  }

  @Post(':id/confirm')
  @Permissions(PERMISSION_NAMES.IMPORTS_MANAGE)
  @ApiDataResponse(ImportJobDto)
  confirm(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) jobId: string,
    @Req() request: Request,
  ) {
    return this.importsService.confirm(user, jobId, request.requestContext);
  }
}
