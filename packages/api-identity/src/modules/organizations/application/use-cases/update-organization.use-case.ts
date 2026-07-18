import type { RequestContext, AuthenticatedRequestUser } from '@repo/api-core';
import type { TransactionPort } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {  
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  TRANSACTION_PORT, SYSTEM_SCOPE , ROLE_NAMES } from '@repo/api-core';

import { assertOrganizationRole } from '../../domain/organization-access.policy';
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    organizationId: string,
    actor: string | AuthenticatedRequestUser,
    input: { name: string },
    requestContext?: RequestContext,
  ) {
    const { userId: actorUserId, isSuperAdmin } = typeof actor === 'string'
      ? { userId: actor, isSuperAdmin: false }
      : { userId: actor.userId, isSuperAdmin: actor.roles?.includes(ROLE_NAMES.SUPER_ADMIN) ?? false };

    let membership = null;
    if (!isSuperAdmin) {
      membership = await this.organizationsRepository.findMembership(
        organizationId,
        actorUserId,
      );

      if (!membership) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          'You are not a member of this organization',
          HttpStatus.FORBIDDEN,
        );
      }

      assertOrganizationRole(membership, ['OWNER', 'ADMIN']);
    }

    const result = await this.transactionPort.run(async (transaction) => {
      const organization = await this.organizationsRepository.updateOrganization(
        organizationId,
        { name: input.name.trim() },
        transaction,
      );

      if (!organization) {
        throw new AppError(
          ERROR_CODES.ORGANIZATION_NOT_FOUND,
          'Organization not found',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.auditWriter.log({
        actorId: actorUserId,
        action: 'organization.update',
        entityType: 'organization',
        entityId: organizationId,
        metadata: { name: organization.name },
        requestContext,
          ...(organizationId ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: organizationId } : { scope: SYSTEM_SCOPE.PLATFORM })
    }, transaction);

      return organization;
    });

    return {
      id: result.id,
      name: result.name,
      slug: result.slug,
      role: isSuperAdmin ? ('ADMIN' as const) : membership!.role,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  }
}
