import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  SuccessFlagDto,
} from '../../../common/decorators/api-response.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import type { AuthenticatedRequestUser } from '../../../common/types/request-context';
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
  @Permissions(PERMISSION_NAMES.USERS_READ)
  @ApiPaginatedResponse(UserDto)
  async listUsers(@Query() query: AdminUsersQueryDto) {
    const result = await this.usersService.listUsers(query);

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
  @Permissions(PERMISSION_NAMES.USERS_CREATE)
  @ApiDataResponse(UserDto, 201)
  createUser(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: CreateAdminUserDto,
    @Req() request: Request,
  ) {
    return this.usersService.createAdminUser(
      actor,
      input,
      request.requestContext,
    );
  }

  @Get(':id')
  @Permissions(PERMISSION_NAMES.USERS_READ)
  @ApiDataResponse(UserDto)
  getUser(@Param('id') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Patch(':id')
  @Permissions(PERMISSION_NAMES.USERS_UPDATE)
  @ApiDataResponse(UserDto)
  updateUser(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id') userId: string,
    @Body() input: UpdateAdminUserDto,
    @Req() request: Request,
  ) {
    return this.usersService.updateAdminUser(
      actor,
      userId,
      input,
      request.requestContext,
    );
  }

  @Delete(':id')
  @Permissions(PERMISSION_NAMES.USERS_DELETE)
  @ApiDataResponse(SuccessFlagDto)
  async deleteUser(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id') userId: string,
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
  @Permissions(PERMISSION_NAMES.USERS_UPDATE)
  @ApiDataResponse(UserDto)
  updateStatus(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id') userId: string,
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
  @Permissions(PERMISSION_NAMES.ROLES_MANAGE)
  @ApiDataResponse(UserDto)
  replaceRoles(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param('id') userId: string,
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
