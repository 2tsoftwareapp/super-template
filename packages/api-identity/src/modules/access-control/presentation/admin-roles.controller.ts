import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiArrayResponse,
  CurrentUser,
} from '@repo/api-core';
import { Authorize } from '@repo/api-core';

import { PERMISSION_NAMES } from '../access-control.constants';
import { AccessControlService } from '../application/access-control.service';
import { PermissionDto, RoleDto } from './roles.dto';

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
}
