import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  normalizeEmail,
} from '@repo/api-core';
import { DATABASE, runInTransaction } from '@repo/api-database';

import type { CreateAdminUserCommand, UserView } from './users.types';

import { ROLE_NAMES } from '../../access-control/access-control.constants';
import { AccessControlService } from '../../access-control/application/access-control.service';
import {
  assertCanAssignRoleTargets,
  assertRoleScopeCanBeAssigned,
} from '../../access-control/domain/role-assignment.policy';
import { hashPassword } from '../../auth/application/auth.helpers';
import { OrganizationsService } from '../../organizations/application/organizations.service';
import { GetUserUseCase } from './get-user.use-case';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from './users.repository.port';

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly organizationsService: OrganizationsService,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: CreateAdminUserCommand,
    requestContext?: RequestContext,
  ): Promise<UserView> {
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

        desiredRoleIds.forEach((role) => assertRoleScopeCanBeAssigned(role));
        assertCanAssignRoleTargets(actor, desiredRoleIds);
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
          actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)
            ? undefined
            : actor.organizationId,
          transaction,
        );

        await this.organizationsService.ensurePersonalOrganization(
          user.id,
          user.displayName,
          transaction,
        );

        await this.auditWriter.log(
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

    return this.getUserUseCase.execute(createdUserId);
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
