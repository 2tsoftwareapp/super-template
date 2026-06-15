import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import { AppError } from '../../../common/errors/app-error';
import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '../../../common/types/request-context';
import { normalizeEmail } from '../../../common/utils/normalize-email';
import { DATABASE } from '../../../database/database.provider';
import type { DatabaseClient } from '../../../database/database.types';
import { runInTransaction } from '../../../database/transaction';
import { AccessControlService } from '../../access-control/application/access-control.service';
import { AuditService } from '../../audit/application/audit.service';
import {
  hashPassword,
  verifyPassword,
} from '../../auth/application/auth.helpers';
import { AuthRepository } from '../../auth/infrastructure/auth.repository';
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
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const accessProfile =
      await this.accessControlService.getAccessProfile(userId);

    return this.toUserDto(user, accessProfile.roles);
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

    const updated = await this.usersRepository.update(userId, {
      displayName: input.displayName ?? user.displayName,
      avatarUrl:
        input.avatarUrl === undefined ? user.avatarUrl : input.avatarUrl,
    });

    await this.auditService.log({
      actorId: userId,
      action: 'user.profile.updated',
      entityType: 'user',
      entityId: userId,
      requestContext,
    });

    const accessProfile =
      await this.accessControlService.getAccessProfile(userId);
    return this.toUserDto(updated ?? user, accessProfile.roles);
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
    const rolesByUserId = await this.accessControlService.getRoleNamesForUsers(
      result.rows.map((row) => row.id),
    );

    return {
      rows: result.rows.map((row) =>
        this.toUserDto(row, rolesByUserId.get(row.id) ?? []),
      ),
      total: result.total,
    };
  }

  async getUserById(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const accessProfile =
      await this.accessControlService.getAccessProfile(userId);
    return this.toUserDto(user, accessProfile.roles);
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
        const foundRoles =
          await this.accessControlService.validateRoleIds(roleIds);
        this.accessControlService.assertCanAssignRoles(
          actor,
          [],
          foundRoles.map((role) => role.name),
        );
        await this.accessControlService.replaceUserRoles(
          user.id,
          roleIds,
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

    const [currentAccess, desiredRoles] = await Promise.all([
      this.accessControlService.getAccessProfile(userId),
      this.accessControlService.validateRoleIds(roleIds),
    ]);

    this.accessControlService.assertCanAssignRoles(
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
  ) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      roles,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
