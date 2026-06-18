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
  CurrentUser,
  SuccessFlagDto,
} from '@repo/api-core';
import { Authorize } from '@repo/api-core';

import { PERMISSION_NAMES } from '../access-control.constants';
import { AccessControlService } from '../application/access-control.service';
import {
  CreateRoleDto,
  CreatePermissionDto,
  PermissionDto,
  RoleDto,
  UpdatePermissionDto,
  UpdateRoleDto,
} from './roles.dto';

@ApiTags('admin-roles')
@ApiBearerAuth()
@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get()
  @Authorize({ permissions: [PERMISSION_NAMES.ROLES_READ] })
  @ApiArrayResponse(RoleDto)
  async listRoles(@CurrentUser() actor: AuthenticatedRequestUser) {
    const roles = await this.accessControlService.listRoles(actor);

    return {
      data: roles,
    };
  }

  @Get('permissions')
  @Authorize({ permissions: [PERMISSION_NAMES.ROLES_READ] })
  @ApiArrayResponse(PermissionDto)
  async listPermissions() {
    const permissions = await this.accessControlService.listPermissions();

    return {
      data: permissions,
    };
  }

  @Post('permissions')
  @Authorize({ permissions: [PERMISSION_NAMES.ROLES_MANAGE] })
  @ApiDataResponse(PermissionDto, 201)
  createPermission(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: CreatePermissionDto,
    @Req() request: Request,
  ) {
    return this.accessControlService.createPermission(
      actor,
      {
        name: input.name,
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
      },
      request.requestContext,
    );
  }

  @Patch('permissions/:id')
  @Authorize({ permissions: [PERMISSION_NAMES.ROLES_MANAGE] })
  @ApiDataResponse(PermissionDto)
  updatePermission(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) permissionId: string,
    @Body() input: UpdatePermissionDto,
    @Req() request: Request,
  ) {
    return this.accessControlService.updatePermission(
      actor,
      permissionId,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
      },
      request.requestContext,
    );
  }

  @Delete('permissions/:id')
  @Authorize({ permissions: [PERMISSION_NAMES.ROLES_MANAGE] })
  @ApiDataResponse(SuccessFlagDto)
  async deletePermission(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) permissionId: string,
    @Req() request: Request,
  ) {
    await this.accessControlService.deletePermission(
      actor,
      permissionId,
      request.requestContext,
    );

    return {
      data: {
        success: true,
      },
    };
  }

  @Post()
  @Authorize({ permissions: [PERMISSION_NAMES.ROLES_MANAGE] })
  @ApiDataResponse(RoleDto, 201)
  createRole(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: CreateRoleDto,
    @Req() request: Request,
  ) {
    return this.accessControlService.createRole(
      actor,
      {
        name: input.name,
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.organizationId !== undefined
          ? { organizationId: input.organizationId }
          : {}),
        permissionIds: input.permissionIds,
      },
      request.requestContext,
    );
  }

  @Patch(':id')
  @Authorize({ permissions: [PERMISSION_NAMES.ROLES_MANAGE] })
  @ApiDataResponse(RoleDto)
  updateRole(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) roleId: string,
    @Body() input: UpdateRoleDto,
    @Req() request: Request,
  ) {
    return this.accessControlService.updateRole(
      actor,
      roleId,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.permissionIds !== undefined
          ? { permissionIds: input.permissionIds }
          : {}),
      },
      request.requestContext,
    );
  }

  @Delete(':id')
  @Authorize({ permissions: [PERMISSION_NAMES.ROLES_MANAGE] })
  @ApiDataResponse(SuccessFlagDto)
  async deleteRole(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) roleId: string,
    @Req() request: Request,
  ) {
    await this.accessControlService.deleteRole(
      actor,
      roleId,
      request.requestContext,
    );

    return {
      data: {
        success: true,
      },
    };
  }
}
