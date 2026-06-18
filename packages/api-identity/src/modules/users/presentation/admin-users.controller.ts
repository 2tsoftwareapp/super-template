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
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  SuccessFlagDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Authorize } from '@repo/api-core';

import { PERMISSION_NAMES } from '../../access-control/access-control.constants';
import { UsersService } from '../application/users.service';
import {
  AdminUsersQueryDto,
  CreateAdminUserDto,
  ReplaceUserRolesDto,
  UpdateAdminUserDto,
  UpdateUserStatusDto,
  UserDto,
} from './users.dto';

@ApiTags('admin-users')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Authorize({ permissions: [PERMISSION_NAMES.USERS_READ] })
  @ApiPaginatedResponse(UserDto)
  async listUsers(@Query() query: AdminUsersQueryDto) {
    const result = await this.usersService.listUsers({
      page: query.page,
      limit: query.limit,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.role !== undefined ? { role: query.role } : {}),
    });

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }

  @Post()
  @Authorize({ permissions: [PERMISSION_NAMES.USERS_CREATE] })
  @ApiDataResponse(UserDto, 201)
  createUser(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: CreateAdminUserDto,
    @Req() request: Request,
  ) {
    return this.usersService.createAdminUser(
      actor,
      {
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.roleIds !== undefined ? { roleIds: input.roleIds } : {}),
      },
      request.requestContext,
    );
  }

  @Get(':id')
  @Authorize({ permissions: [PERMISSION_NAMES.USERS_READ] })
  @ApiDataResponse(UserDto)
  getUser(@Param('id', new ParseUUIDPipe()) userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Patch(':id')
  @Authorize({ permissions: [PERMISSION_NAMES.USERS_UPDATE] })
  @ApiDataResponse(UserDto)
  updateUser(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() input: UpdateAdminUserDto,
    @Req() request: Request,
  ) {
    return this.usersService.updateAdminUser(
      actor,
      userId,
      {
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.password !== undefined ? { password: input.password } : {}),
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      request.requestContext,
    );
  }

  @Delete(':id')
  @Authorize({ permissions: [PERMISSION_NAMES.USERS_DELETE] })
  @ApiDataResponse(SuccessFlagDto)
  async deleteUser(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Req() request: Request,
  ) {
    await this.usersService.deleteUser(actor, userId, request.requestContext);

    return {
      data: {
        success: true,
      },
    };
  }

  @Patch(':id/status')
  @Authorize({ permissions: [PERMISSION_NAMES.USERS_UPDATE] })
  @ApiDataResponse(UserDto)
  updateStatus(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() input: UpdateUserStatusDto,
    @Req() request: Request,
  ) {
    return this.usersService.updateUserStatus(
      actor,
      userId,
      input.status,
      request.requestContext,
    );
  }

  @Put(':id/roles')
  @Authorize({ permissions: [PERMISSION_NAMES.ROLES_MANAGE] })
  @ApiDataResponse(UserDto)
  replaceRoles(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() input: ReplaceUserRolesDto,
    @Req() request: Request,
  ) {
    return this.usersService.replaceUserRoles(
      actor,
      userId,
      input.roleIds,
      request.requestContext,
    );
  }
}
