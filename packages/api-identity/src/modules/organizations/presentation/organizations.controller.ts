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

import { CreateOrganizationUseCase } from '../application/use-cases/create-organization.use-case';
import { DeleteOrganizationUseCase } from '../application/use-cases/delete-organization.use-case';
import { GetOrganizationUseCase } from '../application/use-cases/get-organization.use-case';
import { LeaveOrganizationUseCase } from '../application/use-cases/leave-organization.use-case';
import { ListOrganizationMembersUseCase } from '../application/use-cases/list-organization-members.use-case';
import { ListOrganizationsForUserUseCase } from '../application/use-cases/list-organizations-for-user.use-case';
import { RemoveOrganizationMemberUseCase } from '../application/use-cases/remove-organization-member.use-case';
import { UpdateMemberRoleUseCase } from '../application/use-cases/update-member-role.use-case';
import { UpdateOrganizationUseCase } from '../application/use-cases/update-organization.use-case';
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
  constructor(
    private readonly listOrganizationsForUser: ListOrganizationsForUserUseCase,
    private readonly createOrganization: CreateOrganizationUseCase,
    private readonly getOrganization: GetOrganizationUseCase,
    private readonly updateOrganization: UpdateOrganizationUseCase,
    private readonly deleteOrganization: DeleteOrganizationUseCase,
    private readonly leaveOrganization: LeaveOrganizationUseCase,
    private readonly listOrganizationMembers: ListOrganizationMembersUseCase,
    private readonly updateMemberRoleUseCase: UpdateMemberRoleUseCase,
    private readonly removeOrganizationMember: RemoveOrganizationMemberUseCase,
  ) {}

  @Get()
  @ApiArrayResponse(OrganizationDto)
  list(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.listOrganizationsForUser.execute(user);
  }

  @Post()
  @ApiDataResponse(OrganizationDto)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateOrganizationDto,
  ) {
    return this.createOrganization.execute(user, { name: input.name });
  }

  @Get(':id')
  @ApiDataResponse(OrganizationDetailDto)
  getOne(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) organizationId: string,
  ) {
    return this.getOrganization.execute(
      organizationId,
      user,
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
    return this.updateOrganization.execute(
      organizationId,
      user,
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
    await this.deleteOrganization.execute(
      organizationId,
      user,
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
    await this.leaveOrganization.execute(
      organizationId,
      user,
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
    return this.listOrganizationMembers.execute(organizationId, user);
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
    return this.updateMemberRoleUseCase.execute(
      organizationId,
      user,
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
    await this.removeOrganizationMember.execute(
      organizationId,
      user,
      targetUserId,
      request.requestContext,
    );

    return { data: { success: true } };
  }
}
