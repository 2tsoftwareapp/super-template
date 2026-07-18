import type { RequestContext, AuthenticatedRequestUser } from '@repo/api-core';
import type { TransactionPort } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {  
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  TRANSACTION_PORT, SYSTEM_SCOPE , ROLE_NAMES } from '@repo/api-core';

import type { OrganizationMemberRole } from '../../domain/organization-access.policy';

import {
  assertCanManageTargetRole,
  assertNotLastOwner,
  assertOrganizationRole,
} from '../../domain/organization-access.policy';
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';
import { AccessControlService } from '../../../access-control/application/access-control.service';

@Injectable()
export class UpdateMemberRoleUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    organizationId: string,
    actor: string | AuthenticatedRequestUser,
    targetUserId: string,
    role: OrganizationMemberRole,
    requestContext?: RequestContext,
  ) {
    const { userId: actorUserId, isSuperAdmin } = typeof actor === 'string'
      ? { userId: actor, isSuperAdmin: false }
      : { userId: actor.userId, isSuperAdmin: actor.roles?.includes(ROLE_NAMES.SUPER_ADMIN) ?? false };

    return this.transactionPort.run(async (transaction) => {
      if (!isSuperAdmin) {
        const actorMembership = await this.organizationsRepository.findMembership(
          organizationId,
          actorUserId,
          transaction,
        );

        if (!actorMembership) {
          throw new AppError(
            ERROR_CODES.AUTH_FORBIDDEN,
            'You are not a member of this organization',
            HttpStatus.FORBIDDEN,
          );
        }

        assertOrganizationRole(actorMembership, ['OWNER', 'ADMIN']);

        const targetMembership = await this.organizationsRepository.findMembership(
          organizationId,
          targetUserId,
          transaction,
        );

        if (!targetMembership) {
          throw new AppError(
            ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
            'This user is not a member of the organization',
            HttpStatus.NOT_FOUND,
          );
        }

        assertCanManageTargetRole(actorMembership.role, targetMembership.role);
        assertCanManageTargetRole(actorMembership.role, role);
      }

      const targetMembership = await this.organizationsRepository.findMembership(
        organizationId,
        targetUserId,
        transaction,
      );

      if (!targetMembership) {
        throw new AppError(
          ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
          'This user is not a member of the organization',
          HttpStatus.NOT_FOUND,
        );
      }

      if (targetMembership.role === 'OWNER' && role !== 'OWNER') {
        const remainingOwners = await this.organizationsRepository.countOwners(
          organizationId,
          { excludingUserId: targetUserId, executor: transaction, lock: true },
        );
        assertNotLastOwner(
          { userId: targetUserId, role: targetMembership.role },
          remainingOwners,
        );
      }

      const updated = await this.organizationsRepository.updateMemberRole(
        organizationId,
        targetUserId,
        role,
        transaction,
      );

      if (!updated) {
        throw new AppError(
          ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
          'This user is not a member of the organization',
          HttpStatus.NOT_FOUND,
        );
      }

      // Synchronize RBAC roles
      if (role === 'MEMBER') {
        await this.accessControlService.replaceUserRoles(
          targetUserId,
          [],
          organizationId,
          transaction,
        );
      } else if (role === 'ADMIN' || role === 'OWNER') {
        await this.accessControlService.ensureOrganizationAdminRole(
          organizationId,
          targetUserId,
          transaction,
        );
      }

      await this.accessControlService.invalidateAccessProfile(targetUserId);

      await this.auditWriter.log({
        actorId: actorUserId,
        action: 'organization.member.role-update',
        entityType: 'organization_member',
        entityId: targetUserId,
        metadata: { organizationId, role },
        requestContext,
          ...(organizationId ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: organizationId } : { scope: SYSTEM_SCOPE.PLATFORM })
    });

      return {
        userId: updated.userId,
        role: updated.role,
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  }
}
