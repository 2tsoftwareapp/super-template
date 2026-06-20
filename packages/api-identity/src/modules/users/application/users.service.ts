import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type {
  AssignableRoleName,
  CreateAdminUserCommand,
  ListUsersQuery,
  UpdateAdminUserCommand,
  UpdateProfileCommand,
  UserStatus,
} from './users.types';

import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { CreateAdminUserUseCase } from './use-cases/create-admin-user.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { ListUsersUseCase } from './use-cases/list-users.use-case';
import { ReplaceUserRolesUseCase } from './use-cases/replace-user-roles.use-case';
import { UpdateAdminUserUseCase } from './use-cases/update-admin-user.use-case';
import { UpdateProfileUseCase } from './use-cases/update-profile.use-case';
import { UpdateUserStatusUseCase } from './use-cases/update-user-status.use-case';

export type { UserView as UserDto } from './users.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly createAdminUserUseCase: CreateAdminUserUseCase,
    private readonly updateAdminUserUseCase: UpdateAdminUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
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

  listUsers(actor: AuthenticatedRequestUser, query: ListUsersQuery) {
    return this.listUsersUseCase.execute(actor, query);
  }

  getUserById(actor: AuthenticatedRequestUser, userId: string) {
    return this.getUserUseCase.execute(userId, actor);
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
    return this.updateAdminUserUseCase.execute(
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
    return this.deleteUserUseCase.execute(actor, userId, requestContext);
  }

  updateUserStatus(
    actor: AuthenticatedRequestUser,
    userId: string,
    status: UserStatus,
    requestContext?: RequestContext,
  ) {
    return this.updateUserStatusUseCase.execute(
      actor,
      userId,
      status,
      requestContext,
    );
  }

  replaceUserRoles(
    actor: AuthenticatedRequestUser,
    userId: string,
    role: AssignableRoleName,
    organizationId: string | undefined,
    requestContext?: RequestContext,
  ) {
    return this.replaceUserRolesUseCase.execute(
      actor,
      userId,
      role,
      organizationId,
      requestContext,
    );
  }
}
