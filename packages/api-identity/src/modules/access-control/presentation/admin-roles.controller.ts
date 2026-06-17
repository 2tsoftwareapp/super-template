import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiArrayResponse } from '@repo/api-core';
import { Permissions } from '@repo/api-core';

import { PERMISSION_NAMES } from '../access-control.constants';
import { AccessControlService } from '../application/access-control.service';
import { RoleDto } from './roles.dto';

@ApiTags('admin-roles')
@ApiBearerAuth()
@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get()
  @Permissions(PERMISSION_NAMES.ROLES_READ)
  @ApiArrayResponse(RoleDto)
  async listRoles() {
    const roles = await this.accessControlService.listRoles();

    return {
      data: roles,
    };
  }
}
