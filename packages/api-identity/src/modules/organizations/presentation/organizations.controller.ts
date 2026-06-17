import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiArrayResponse, ApiDataResponse } from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';

import { OrganizationsService } from '../application/organizations.service';
import { CreateOrganizationDto, OrganizationDto } from './organizations.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiArrayResponse(OrganizationDto)
  list(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.organizationsService.listForUser(user);
  }

  @Post()
  @ApiDataResponse(OrganizationDto)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(user, input);
  }
}
