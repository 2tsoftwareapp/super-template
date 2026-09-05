import type { AuthenticatedRequestUser } from "@repo/api-kernel";
import type { Request } from "express";

import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiArrayResponse, ApiDataResponse } from "@repo/api-runtime";
import { CurrentUser } from "@repo/api-runtime";

import { GetOrganizationUseCase } from "../application/use-cases/get-organization.use-case";
import { ListOrganizationMembersUseCase } from "../application/use-cases/list-organization-members.use-case";
import { ListOrganizationsForUserUseCase } from "../application/use-cases/list-organizations-for-user.use-case";
import { UpdateOrganizationUseCase } from "../application/use-cases/update-organization.use-case";
import {
  OrganizationDetailDto,
  OrganizationMemberDto,
  UpdateOrganizationDto,
  UserOrganizationDto,
} from "./organizations.dto";

@ApiTags("organizations")
@ApiBearerAuth()
@Controller("organizations")
export class OrganizationsController {
  constructor(
    private readonly listOrganizationsForUser: ListOrganizationsForUserUseCase,
    private readonly getOrganization: GetOrganizationUseCase,
    private readonly updateOrganization: UpdateOrganizationUseCase,
    private readonly listOrganizationMembers: ListOrganizationMembersUseCase,
  ) {}

  @Get()
  @ApiArrayResponse(UserOrganizationDto)
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query("memberOnly") memberOnly?: string) {
    return this.listOrganizationsForUser.execute(user, memberOnly === "true");
  }

  @Get(":id")
  @ApiDataResponse(OrganizationDetailDto)
  getOne(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) organizationId: string,
  ) {
    return this.getOrganization.execute(organizationId, user);
  }

  @Patch(":id")
  @ApiDataResponse(OrganizationDetailDto)
  update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) organizationId: string,
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

  @Get(":id/members")
  @ApiArrayResponse(OrganizationMemberDto)
  listMembers(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) organizationId: string,
  ) {
    return this.listOrganizationMembers.execute(organizationId, user);
  }
}
