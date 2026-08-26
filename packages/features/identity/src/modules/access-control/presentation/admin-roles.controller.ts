import type { AuthenticatedRequestUser } from "@repo/api-core";
import type { Request } from "express";

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  ACTION,
  ApiArrayResponse,
  ApiDataResponse,
  ApiPaginatedResponse,
  Authorize,
  CurrentUser,
  perm,
  SuccessFlagDto,
} from "@repo/api-core";

import { RoleManagementUseCase } from "../application/use-cases/role-management.use-case";
import { RoleQueryUseCase } from "../application/use-cases/role-query.use-case";
import {
  CreateRoleDto,
  ListRolesQueryDto,
  PermissionDto,
  ReplaceRolePermissionsDto,
  RoleDto,
  UpdateRoleDto,
} from "./roles.dto";

@ApiTags("admin-roles")
@ApiBearerAuth()
@Controller("admin/roles")
export class AdminRolesController {
  constructor(
    private readonly roleQuery: RoleQueryUseCase,
    private readonly roleManagement: RoleManagementUseCase,
  ) {}

  @Get()
  @Authorize({ permissions: [perm("roles", ACTION.READ)] })
  @ApiPaginatedResponse(RoleDto)
  async listRoles(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Query() query: ListRolesQueryDto,
  ) {
    const result = await this.roleQuery.listRoles(actor, {
      page: query.page ?? 1,
      limit: query.limit ?? 50,
      organizationId: query.organizationId ?? undefined,
      search: query.search ?? undefined,
      scope: query.scope,
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    return {
      data: result.rows,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Get("permissions")
  @Authorize({ permissions: [perm("roles", ACTION.READ)] })
  @ApiArrayResponse(PermissionDto)
  async listPermissions(@CurrentUser() actor: AuthenticatedRequestUser) {
    const permissions = await this.roleQuery.listPermissions(actor);

    return {
      data: permissions,
    };
  }

  @Post()
  @Authorize({ permissions: [perm("roles", ACTION.CREATE)] })
  @ApiDataResponse(RoleDto, 201)
  async createRole(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: CreateRoleDto,
    @Req() request: Request,
  ) {
    const role = await this.roleManagement.createCustomRole(actor, input, request.requestContext);

    return {
      data: role,
    };
  }

  @Patch(":id")
  @Authorize({ permissions: [perm("roles", ACTION.UPDATE)] })
  @ApiDataResponse(RoleDto)
  async updateRole(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param("id", ParseUUIDPipe) roleId: string,
    @Body() input: UpdateRoleDto,
    @Req() request: Request,
  ) {
    const role = await this.roleManagement.updateCustomRole(
      actor,
      roleId,
      input,
      request.requestContext,
    );

    return {
      data: role,
    };
  }

  @Put(":id/permissions")
  @Authorize({ permissions: [perm("roles", ACTION.UPDATE)] })
  @ApiDataResponse(RoleDto)
  async replaceRolePermissions(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param("id", ParseUUIDPipe) roleId: string,
    @Body() input: ReplaceRolePermissionsDto,
    @Req() request: Request,
  ) {
    const role = await this.roleManagement.replaceCustomRolePermissions(
      actor,
      roleId,
      input.permissionIds,
      request.requestContext,
    );

    return {
      data: role,
    };
  }

  @Delete(":id")
  @Authorize({ permissions: [perm("roles", ACTION.DELETE)] })
  @ApiDataResponse(SuccessFlagDto)
  async deleteRole(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param("id", ParseUUIDPipe) roleId: string,
    @Req() request: Request,
  ) {
    await this.roleManagement.deleteCustomRole(actor, roleId, request.requestContext);

    return {
      data: { success: true },
    };
  }
}
