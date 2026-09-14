import type { AuthenticatedRequestUser } from "@repo/api-kernel";
import type { Request } from "express";

import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiDataResponse, SuccessFlagDto } from "@repo/api-runtime";
import { CurrentUser } from "@repo/api-runtime";

import { CreateOrganizationUseCase } from "../application/use-cases/create-organization.use-case";
import { DeleteOrganizationUseCase } from "../application/use-cases/delete-organization.use-case";
import { LeaveOrganizationUseCase } from "../application/use-cases/leave-organization.use-case";
import { RemoveOrganizationMemberUseCase } from "../application/use-cases/remove-organization-member.use-case";
import { UpdateMemberRoleUseCase } from "../application/use-cases/update-member-role.use-case";
import {
  CreateOrganizationDto,
  OrganizationDto,
  UpdateMemberRoleDto,
} from "./dto/organization-management.dto";

@ApiTags("organizations")
@ApiBearerAuth()
@Controller("organizations")
export class OrganizationManagementController {
  constructor(
    private readonly createOrganization: CreateOrganizationUseCase,
    private readonly deleteOrganization: DeleteOrganizationUseCase,
    private readonly leaveOrganization: LeaveOrganizationUseCase,
    private readonly updateMemberRoleUseCase: UpdateMemberRoleUseCase,
    private readonly removeOrganizationMember: RemoveOrganizationMemberUseCase,
  ) {}

  @Post()
  @ApiDataResponse(OrganizationDto)
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() input: CreateOrganizationDto) {
    return this.createOrganization.execute(user, { name: input.name });
  }

  @Delete(":id")
  @ApiDataResponse(SuccessFlagDto)
  async remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) organizationId: string,
    @Req() request: Request,
  ) {
    await this.deleteOrganization.execute(organizationId, user, request.requestContext);
    return { data: { success: true } };
  }

  @Post(":id/leave")
  @ApiDataResponse(SuccessFlagDto)
  async leave(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) organizationId: string,
    @Req() request: Request,
  ) {
    await this.leaveOrganization.execute(organizationId, user, request.requestContext);
    return { data: { success: true } };
  }

  @Patch(":id/members/:userId")
  @ApiDataResponse(OrganizationDto)
  updateMemberRole(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) organizationId: string,
    @Param("userId", new ParseUUIDPipe()) targetUserId: string,
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

  @Delete(":id/members/:userId")
  @ApiDataResponse(SuccessFlagDto)
  async removeMember(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) organizationId: string,
    @Param("userId", new ParseUUIDPipe()) targetUserId: string,
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
