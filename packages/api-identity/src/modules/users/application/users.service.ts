import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type {
  CreateAdminUserCommand,
  ListUsersQuery,
  UpdateAdminUserCommand,
  UpdateProfileCommand,
  UserStatus,
} from './users.types';

import { AdminUserManagementUseCase } from './admin-user-management.use-case';
import { ChangePasswordUseCase } from './change-password.use-case';
import { CreateAdminUserUseCase } from './create-admin-user.use-case';
import { GetUserUseCase } from './get-user.use-case';
import { ListUsersUseCase } from './list-users.use-case';
import { ReplaceUserRolesUseCase } from './replace-user-roles.use-case';
import { UpdateProfileUseCase } from './update-profile.use-case';

export type { UserView as UserDto } from './users.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly createAdminUserUseCase: CreateAdminUserUseCase,
    private readonly adminUserManagementUseCase: AdminUserManagementUseCase,
    private readonly replaceUserRolesUseCase: ReplaceUserRolesUseCase,
  ) {}

  getProfile(userId: string) {
    return this.getUserUseCase.execute(userId);
  }

  updateProfile(
    userId: string,
    input: UpdateProfileCommand,
    requestContext?: RequestContext,
  ) {
    return this.updateProfileUseCase.execute(userId, input, requestContext);
  }

  changePassword(
    actor: AuthenticatedRequestUser,
    currentPassword: string,
    newPassword: string,
    requestContext?: RequestContext,
  ) {
    return this.changePasswordUseCase.execute(
      actor,
      currentPassword,
      newPassword,
      requestContext,
    );
  }

  listUsers(query: ListUsersQuery) {
    return this.listUsersUseCase.execute(query);
  }

  getUserById(userId: string) {
    return this.getUserUseCase.execute(userId);
  }

  createAdminUser(
    actor: AuthenticatedRequestUser,
    input: CreateAdminUserCommand,
    requestContext?: RequestContext,
  ) {
    return this.createAdminUserUseCase.execute(actor, input, requestContext);
  }

  updateAdminUser(
    actor: AuthenticatedRequestUser,
    userId: string,
    input: UpdateAdminUserCommand,
    requestContext?: RequestContext,
  ) {
    return this.adminUserManagementUseCase.update(
      actor,
      userId,
      input,
      requestContext,
    );
  }

  deleteUser(
    actor: AuthenticatedRequestUser,
    userId: string,
    requestContext?: RequestContext,
  ) {
    return this.adminUserManagementUseCase.delete(
      actor,
      userId,
      requestContext,
    );
  }

  updateUserStatus(
    actor: AuthenticatedRequestUser,
    userId: string,
    status: UserStatus,
    requestContext?: RequestContext,
  ) {
    return this.adminUserManagementUseCase.updateStatus(
      actor,
      userId,
      status,
      requestContext,
    );
  }

  replaceUserRoles(
    actor: AuthenticatedRequestUser,
    userId: string,
    roleIds: string[],
    requestContext?: RequestContext,
  ) {
    return this.replaceUserRolesUseCase.execute(
      actor,
      userId,
      roleIds,
      requestContext,
    );
  }
}
