import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiArrayResponse,
  ApiDataResponse,
  SuccessFlagDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';

import { OrganizationsService } from '../application/organizations.service';
import {
  CreateOrganizationDto,
  OrganizationDetailDto,
  OrganizationDto,
  OrganizationMemberDto,
  UpdateMemberRoleDto,
  UpdateOrganizationDto,
} from './organizations.dto';

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
    return this.organizationsService.create(user, { name: input.name });
  }

  @Get(':id')
  @ApiDataResponse(OrganizationDetailDto)
  getOne(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) organizationId: string,
  ) {
    return this.organizationsService.getOrganization(
      organizationId,
      user.userId,
    );
  }

  @Patch(':id')
  @ApiDataResponse(OrganizationDetailDto)
  update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) organizationId: string,
    @Body() input: UpdateOrganizationDto,
    @Req() request: Request,
  ) {
    return this.organizationsService.updateOrganization(
      organizationId,
      user.userId,
      { name: input.name },
      request.requestContext,
    );
  }

  @Delete(':id')
  @ApiDataResponse(SuccessFlagDto)
  async remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) organizationId: string,
    @Req() request: Request,
  ) {
    await this.organizationsService.deleteOrganization(
      organizationId,
      user.userId,
      request.requestContext,
    );

    return { data: { success: true } };
  }

  @Post(':id/leave')
  @ApiDataResponse(SuccessFlagDto)
  async leave(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) organizationId: string,
    @Req() request: Request,
  ) {
    await this.organizationsService.leave(
      organizationId,
      user.userId,
      request.requestContext,
    );

    return { data: { success: true } };
  }

  @Get(':id/members')
  @ApiArrayResponse(OrganizationMemberDto)
  listMembers(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) organizationId: string,
  ) {
    return this.organizationsService.listMembers(organizationId, user.userId);
  }

  @Patch(':id/members/:userId')
  @ApiDataResponse(OrganizationMemberDto)
  updateMemberRole(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) organizationId: string,
    @Param('userId', new ParseUUIDPipe()) targetUserId: string,
    @Body() input: UpdateMemberRoleDto,
    @Req() request: Request,
  ) {
    return this.organizationsService.updateMemberRole(
      organizationId,
      user.userId,
      targetUserId,
      input.role,
      request.requestContext,
    );
  }

  @Delete(':id/members/:userId')
  @ApiDataResponse(SuccessFlagDto)
  async removeMember(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) organizationId: string,
    @Param('userId', new ParseUUIDPipe()) targetUserId: string,
    @Req() request: Request,
  ) {
    await this.organizationsService.removeMember(
      organizationId,
      user.userId,
      targetUserId,
      request.requestContext,
    );

    return { data: { success: true } };
  }
}
