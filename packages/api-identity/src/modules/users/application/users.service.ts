import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';
import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import { normalizeEmail } from '@repo/api-core';
import { DATABASE } from '@repo/api-database';
import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';
import { runInTransaction } from '@repo/api-database';
import { AccessControlService } from '../../access-control/application/access-control.service';
import { ROLE_NAMES } from '../../access-control/access-control.constants';
import { AuditService } from '@repo/api-platform/modules/audit/application/audit.service';
import {
  hashPassword,
  verifyPassword,
} from '../../auth/application/auth.helpers';
import { AuthRepository } from '../../auth/infrastructure/auth.repository';
import { FilesRepository } from '@repo/api-platform/modules/files/infrastructure/files.repository';
import { OrganizationsService } from '../../organizations/application/organizations.service';
import { UsersRepository } from '../infrastructure/users.repository';
import type {
  CreateAdminUserDto,
  UpdateAdminUserDto,
  UpdateProfileDto,
} from '../presentation/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly usersRepository: UsersRepository,
    private readonly accessControlService: AccessControlService,
    private readonly auditService: AuditService,
    private readonly authRepository: AuthRepository,
    private readonly filesRepository: FilesRepository,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async getProfile(userId: string) {
    return this.getUserDetails(userId);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileDto,
    requestContext?: RequestContext,
  ) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (input.avatarFileId) {
      const file = await this.filesRepository.findById(input.avatarFileId);

      if (!file || file.uploadedById !== userId) {
        throw new AppError(
          ERROR_CODES.FILE_NOT_FOUND,
          'Avatar file not found',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    await this.usersRepository.update(userId, {
      displayName: input.displayName ?? user.displayName,
      avatarUrl:
        input.avatarUrl === undefined ? user.avatarUrl : input.avatarUrl,
      avatarFileId:
        input.avatarFileId === undefined
          ? user.avatarFileId
          : input.avatarFileId,
    });

    await this.auditService.log({
      actorId: userId,
      action: 'user.profile.updated',
      entityType: 'user',
      entityId: userId,
      requestContext,
    });

    return this.getUserDetails(userId);
  }

  async changePassword(
    actor: AuthenticatedRequestUser,
    currentPassword: string,
    newPassword: string,
    requestContext?: RequestContext,
  ) {
    const user = await this.usersRepository.findById(actor.userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const passwordMatches = await verifyPassword(
      user.passwordHash,
      currentPassword,
    );

    if (!passwordMatches) {
      throw new AppError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        'Current password is incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await runInTransaction(this.database, async (transaction) => {
      await this.usersRepository.update(
        actor.userId,
        {
          passwordHash: await hashPassword(newPassword),
        },
        transaction,
      );
      await this.authRepository.revokeAllSessionsForUser(
        actor.userId,
        transaction,
      );
      await this.auditService.log(
        {
          actorId: actor.userId,
          action: 'user.password.changed',
          entityType: 'user',
          entityId: actor.userId,
          requestContext,
        },
        transaction,
      );
    });
  }

  async listUsers(query: {
    page: number;
    limit: number;
    search?: string;
    status?: 'PENDING' | 'ACTIVE' | 'BLOCKED';
    role?: string;
    sortField: 'createdAt' | 'displayName' | 'email' | 'status';
    sortOrder: 'asc' | 'desc';
  }) {
    const result = await this.usersRepository.list(query);
    const [rolesByUserId, roleIdsByUserId] = await Promise.all([
      this.accessControlService.getRoleNamesForUsers(
        result.rows.map((row) => row.id),
      ),
      this.accessControlService.getRoleIdsForUsers(
        result.rows.map((row) => row.id),
      ),
    ]);

    return {
      rows: result.rows.map((row) =>
        this.toUserDto(
          row,
          rolesByUserId.get(row.id) ?? [],
          roleIdsByUserId.get(row.id) ?? [],
        ),
      ),
      total: result.total,
    };
  }

  async getUserById(userId: string) {
    return this.getUserDetails(userId);
  }

  async createAdminUser(
    actor: AuthenticatedRequestUser,
    input: CreateAdminUserDto,
    requestContext?: RequestContext,
  ) {
    const email = normalizeEmail(input.email);
    await this.usersRepository.assertEmailAvailable(email);

    const createdUserId = await runInTransaction(
      this.database,
      async (transaction) => {
        const user = await this.usersRepository.create(
          {
            email,
            passwordHash: await hashPassword(input.password),
            displayName: input.displayName,
            avatarUrl: input.avatarUrl ?? null,
            status: input.status ?? 'ACTIVE',
            emailVerifiedAt: input.status === 'PENDING' ? null : new Date(),
          },
          transaction,
        );

        const roleIds = input.roleIds ?? [];
        const foundRoles = await this.accessControlService.validateRoleIds(
          roleIds,
        );
        const desiredRoleIds = foundRoles.length > 0 ? foundRoles : [];
        const desiredRoles =
          desiredRoleIds.length > 0
            ? desiredRoleIds.map((role) => role.name)
            : [ROLE_NAMES.USER];

        this.accessControlService.assertCanAssignUserRoles(
          actor,
          [],
          desiredRoles,
        );
        await this.accessControlService.replaceUserRoles(
          user.id,
          desiredRoleIds.length > 0
            ? desiredRoleIds.map((role) => role.id)
            : [await this.resolveRoleIdByName(ROLE_NAMES.USER, transaction)],
          transaction,
        );

        await this.organizationsService.ensurePersonalOrganization(
          user.id,
          user.displayName,
          transaction,
        );

        await this.auditService.log(
          {
            actorId: actor.userId,
            action: 'admin.user.created',
            entityType: 'user',
            entityId: user.id,
            metadata: {
              email,
              status: user.status,
            },
            requestContext,
          },
          transaction,
        );

        return user.id;
      },
    );

    return this.getUserById(createdUserId);
  }

  async updateAdminUser(
    actor: AuthenticatedRequestUser,
    userId: string,
    input: UpdateAdminUserDto,
    requestContext?: RequestContext,
  ) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const targetProfile =
      await this.accessControlService.getAccessProfile(userId);
    this.accessControlService.assertCanManageUserAccount(
      actor,
      targetProfile.roles,
    );

    if (input.email) {
      await this.usersRepository.assertEmailAvailable(
        normalizeEmail(input.email),
        undefined,
        userId,
      );
    }

    const updated = await this.usersRepository.update(userId, {
      email: input.email ? normalizeEmail(input.email) : user.email,
      displayName: input.displayName ?? user.displayName,
      avatarUrl:
        input.avatarUrl === undefined ? user.avatarUrl : input.avatarUrl,
      status: input.status ?? user.status,
      passwordHash: input.password
        ? await hashPassword(input.password)
        : user.passwordHash,
      emailVerifiedAt:
        input.status === 'PENDING'
          ? null
          : (user.emailVerifiedAt ?? new Date()),
    });

    await this.auditService.log({
      actorId: actor.userId,
      action: 'admin.user.updated',
      entityType: 'user',
      entityId: userId,
      requestContext,
    });

    return this.getUserById(updated?.id ?? userId);
  }

  async deleteUser(
    actor: AuthenticatedRequestUser,
    userId: string,
    requestContext?: RequestContext,
  ) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (actor.userId === userId) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You cannot delete your own account',
        HttpStatus.FORBIDDEN,
      );
    }

    const targetProfile =
      await this.accessControlService.getAccessProfile(userId);
    this.accessControlService.assertCanManageUserAccount(
      actor,
      targetProfile.roles,
    );

    await runInTransaction(this.database, async (transaction) => {
      await this.usersRepository.softDelete(userId, transaction);
      await this.authRepository.revokeAllSessionsForUser(userId, transaction);
      await this.auditService.log(
        {
          actorId: actor.userId,
          action: 'admin.user.deleted',
          entityType: 'user',
          entityId: userId,
          requestContext,
        },
        transaction,
      );
    });
  }

  async updateUserStatus(
    actor: AuthenticatedRequestUser,
    userId: string,
    status: 'PENDING' | 'ACTIVE' | 'BLOCKED',
    requestContext?: RequestContext,
  ) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (actor.userId === userId) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You cannot change your own account status',
        HttpStatus.FORBIDDEN,
      );
    }

    const targetProfile =
      await this.accessControlService.getAccessProfile(userId);
    this.accessControlService.assertCanManageUserAccount(
      actor,
      targetProfile.roles,
    );

    await runInTransaction(this.database, async (transaction) => {
      await this.usersRepository.update(
        userId,
        {
          status,
          emailVerifiedAt:
            status === 'ACTIVE'
              ? (user.emailVerifiedAt ?? new Date())
              : user.emailVerifiedAt,
        },
        transaction,
      );

      if (status === 'BLOCKED') {
        await this.authRepository.revokeAllSessionsForUser(userId, transaction);
      }

      await this.auditService.log(
        {
          actorId: actor.userId,
          action: status === 'BLOCKED' ? 'user.blocked' : 'user.unblocked',
          entityType: 'user',
          entityId: userId,
          metadata: { status },
          requestContext,
        },
        transaction,
      );
    });

    return this.getUserById(userId);
  }

  async replaceUserRoles(
    actor: AuthenticatedRequestUser,
    userId: string,
    roleIds: string[],
    requestContext?: RequestContext,
  ) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Self role changes are forbidden so an admin cannot silently downgrade or lock out their own session.
    if (actor.userId === userId) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You cannot change your own roles',
        HttpStatus.FORBIDDEN,
      );
    }

    const [currentAccess, desiredRoles] = await Promise.all([
      this.accessControlService.getAccessProfile(userId),
      this.accessControlService.validateRoleIds(roleIds),
    ]);

    // The final authorization check compares the target's current roles against the proposed ones.
    this.accessControlService.assertCanAssignUserRoles(
      actor,
      currentAccess.roles,
      desiredRoles.map((role) => role.name),
    );

    await runInTransaction(this.database, async (transaction) => {
      await this.accessControlService.replaceUserRoles(
        userId,
        roleIds,
        transaction,
      );
      await this.auditService.log(
        {
          actorId: actor.userId,
          action: 'user.roles.replaced',
          entityType: 'user',
          entityId: userId,
          metadata: {
            roleIds,
          },
          requestContext,
        },
        transaction,
      );
    });

    return this.getUserById(userId);
  }

  private toUserDto(
    user: Awaited<ReturnType<UsersRepository['findById']>> extends infer T
      ? Exclude<T, null>
      : never,
    roles: string[],
    roleIds: string[],
  ) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      roles,
      roleIds,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async getUserDetails(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const [accessProfile, roleIds] = await Promise.all([
      this.accessControlService.getAccessProfile(userId),
      this.accessControlService.getRoleIdsForUser(userId),
    ]);

    return this.toUserDto(user, accessProfile.roles, roleIds);
  }

  private async resolveRoleIdByName(
    roleName: string,
    executor?: DatabaseExecutor,
  ) {
    const role = await this.accessControlService.getRoleByName(
      roleName,
      executor,
    );

    if (!role) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        `Role ${roleName} is missing`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return role.id;
  }
}
