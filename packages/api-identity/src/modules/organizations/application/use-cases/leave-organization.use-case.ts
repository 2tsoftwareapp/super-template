import type { RequestContext, AuthenticatedRequestUser } from '@repo/api-core';
import type { TransactionPort } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  TRANSACTION_PORT,
} from '@repo/api-core';

import { assertNotLastOwner } from '../../domain/organization-access.policy';
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';
import { AccessControlService } from '../../../access-control/application/access-control.service';

@Injectable()
export class LeaveOrganizationUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    organizationId: string,
    actor: string | AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ): Promise<void> {
    const userId = typeof actor === 'string' ? actor : actor.userId;

    await this.transactionPort.run(async (transaction) => {
      const membership = await this.organizationsRepository.findMembership(
        organizationId,
        userId,
        transaction,
      );

      if (!membership) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          'You are not a member of this organization',
          HttpStatus.FORBIDDEN,
        );
      }

      if (membership.role === 'OWNER') {
        const remainingOwners = await this.organizationsRepository.countOwners(
          organizationId,
          { excludingUserId: userId, executor: transaction, lock: true },
        );
        assertNotLastOwner(
          { userId, role: membership.role },
          remainingOwners,
        );
      }

      const removed = await this.organizationsRepository.removeMember(
        organizationId,
        userId,
        transaction,
      );

      if (!removed) {
        throw new AppError(
          ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
          'You are not a member of this organization',
          HttpStatus.NOT_FOUND,
        );
      }

      // Cleanup user roles scoped to organization
      await this.accessControlService.replaceUserRoles(
        userId,
        [],
        organizationId,
        transaction,
      );

      // Invalidate access profile cache
      await this.accessControlService.invalidateAccessProfile(userId);

      await this.auditWriter.log({
        actorId: userId,
        action: 'organization.leave',
        entityType: 'organization_member',
        entityId: userId,
        organizationId,
        metadata: { organizationId },
        requestContext,
      });
    });
  }
}
