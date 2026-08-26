import type { AuthenticatedRequestUser } from "@repo/api-runtime";
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
  ApiDataResponse,
  ApiPaginatedResponse,
  perm,
  SuccessFlagDto,
} from "@repo/api-runtime";
import { CurrentUser } from "@repo/api-runtime";
import { Authorize } from "@repo/api-runtime";

import { CreateAdminUserUseCase } from "../application/use-cases/create-admin-user.use-case";
import { DeleteUserUseCase } from "../application/use-cases/delete-user.use-case";
import { GetUserUseCase } from "../application/use-cases/get-user.use-case";
import { ListUsersUseCase } from "../application/use-cases/list-users.use-case";
import { ReplaceUserRolesUseCase } from "../application/use-cases/replace-user-roles.use-case";
import { UpdateAdminUserUseCase } from "../application/use-cases/update-admin-user.use-case";
import { UpdateUserStatusUseCase } from "../application/use-cases/update-user-status.use-case";
import { userSortsFromQuery } from "../application/user-sort";
import {
  AdminUsersQueryDto,
  CreateAdminUserDto,
  ReplaceUserRolesDto,
  UpdateAdminUserDto,
  UpdateUserStatusDto,
  UserDto,
} from "./users.dto";

@ApiTags("admin-users")
@ApiBearerAuth()
@Controller("admin/users")
export class AdminUsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly createAdminUser: CreateAdminUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateAdminUser: UpdateAdminUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly replaceUserRolesUseCase: ReplaceUserRolesUseCase,
  ) {}

  @Get()
  @Authorize({ permissions: [perm("users", ACTION.READ)] })
  @ApiPaginatedResponse(UserDto)
  async listUsers(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Query() query: AdminUsersQueryDto,
  ) {
    const sort = userSortsFromQuery({
      sort: query.sort,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
    });

    const result = await this.listUsersUseCase.execute(actor, {
      page: query.page,
      limit: query.limit,
      sort,
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
  @Authorize({ permissions: [perm("users", ACTION.CREATE)] })
  @ApiDataResponse(UserDto, 201)
  createUser(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: CreateAdminUserDto,
    @Req() request: Request,
  ) {
    return this.createAdminUser.execute(
      actor,
      {
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.roleId !== undefined ? { roleId: input.roleId } : {}),
        ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
      },
      request.requestContext,
    );
  }

  @Get(":id")
  @Authorize({ permissions: [perm("users", ACTION.READ)] })
  @ApiDataResponse(UserDto)
  getUser(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) userId: string,
  ) {
    return this.getUserUseCase.execute(userId, actor);
  }

  @Patch(":id")
  @Authorize({ permissions: [perm("users", ACTION.UPDATE)] })
  @ApiDataResponse(UserDto)
  updateUser(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) userId: string,
    @Body() input: UpdateAdminUserDto,
    @Req() request: Request,
  ) {
    return this.updateAdminUser.execute(
      actor,
      userId,
      {
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      },
      request.requestContext,
    );
  }

  @Delete(":id")
  @Authorize({ permissions: [perm("users", ACTION.DELETE)] })
  @ApiDataResponse(SuccessFlagDto)
  async deleteUser(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) userId: string,
    @Req() request: Request,
  ) {
    await this.deleteUserUseCase.execute(actor, userId, request.requestContext);

    return {
      data: {
        success: true,
      },
    };
  }

  @Patch(":id/status")
  @Authorize({ permissions: [perm("users", ACTION.UPDATE)] })
  @ApiDataResponse(UserDto)
  updateStatus(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) userId: string,
    @Body() input: UpdateUserStatusDto,
    @Req() request: Request,
  ) {
    return this.updateUserStatusUseCase.execute(
      actor,
      userId,
      input.status,
      request.requestContext,
    );
  }

  @Put(":id/roles")
  @Authorize({ permissions: [perm("roles", ACTION.UPDATE)] })
  @ApiDataResponse(UserDto)
  replaceRoles(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) userId: string,
    @Body() input: ReplaceUserRolesDto,
    @Req() request: Request,
  ) {
    return this.replaceUserRolesUseCase.execute(
      actor,
      userId,
      input.roleId,
      input.organizationId ?? null,
      request.requestContext,
    );
  }
}
