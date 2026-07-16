import type { AuthenticatedRequestUser } from '@repo/api-core';

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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ACTION,
  ApiArrayResponse,
  ApiDataResponse,
  Authorize,
  CurrentUser,
  perm,
  SuccessFlagDto,
} from '@repo/api-core';

import { RoleManagementUseCase } from '../application/use-cases/role-management.use-case';
import { RoleQueryUseCase } from '../application/use-cases/role-query.use-case';
import {
  CreateRoleDto,
  PermissionDto,
  ReplaceRolePermissionsDto,
  RoleDto,
  UpdateRoleDto,
} from './roles.dto';

@ApiTags('admin-roles')
@ApiBearerAuth()
@Controller('admin/roles')
export class AdminRolesController {
  constructor(
    private readonly roleQuery: RoleQueryUseCase,
    private readonly roleManagement: RoleManagementUseCase,
  ) {}

  @Get()
  @Authorize({ permissions: [perm('roles', ACTION.READ)] })
  @ApiArrayResponse(RoleDto)
  async listRoles(@CurrentUser() actor: AuthenticatedRequestUser) {
    const roles = await this.roleQuery.listRoles(actor);

    return {
      data: roles,
    };
  }

  @Get('permissions')
  @Authorize({ permissions: [perm('roles', ACTION.READ)] })
  @ApiArrayResponse(PermissionDto)
  async listPermissions(@CurrentUser() actor: AuthenticatedRequestUser) {
    const permissions = await this.roleQuery.listPermissions(actor);

    return {
      data: permissions,
    };
  }

  @Post()
  @Authorize({ permissions: [perm('roles', ACTION.CREATE)] })
  @ApiDataResponse(RoleDto, 201)
  async createRole(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: CreateRoleDto,
  ) {
    const role = await this.roleManagement.createCustomRole(actor, input);

    return {
      data: role,
    };
  }

  @Patch(':id')
  @Authorize({ permissions: [perm('roles', ACTION.UPDATE)] })
  @ApiDataResponse(RoleDto)
  async updateRole(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', ParseUUIDPipe) roleId: string,
    @Body() input: UpdateRoleDto,
  ) {
    const role = await this.roleManagement.updateCustomRole(
      actor,
      roleId,
      input,
    );

    return {
      data: role,
    };
  }

  @Put(':id/permissions')
  @Authorize({ permissions: [perm('roles', ACTION.UPDATE)] })
  @ApiDataResponse(RoleDto)
  async replaceRolePermissions(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', ParseUUIDPipe) roleId: string,
    @Body() input: ReplaceRolePermissionsDto,
  ) {
    const role = await this.roleManagement.replaceCustomRolePermissions(
      actor,
      roleId,
      input.permissionIds,
    );

    return {
      data: role,
    };
  }

  @Delete(':id')
  @Authorize({ permissions: [perm('roles', ACTION.DELETE)] })
  @ApiDataResponse(SuccessFlagDto)
  async deleteRole(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', ParseUUIDPipe) roleId: string,
  ) {
    await this.roleManagement.deleteCustomRole(actor, roleId);

    return {
      data: { success: true },
    };
  }
}
