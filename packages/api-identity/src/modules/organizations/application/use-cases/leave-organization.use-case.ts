import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';

import { assertNotLastOwner } from '../../domain/organization-access.policy';
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';

@Injectable()
export class LeaveOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    requestContext?: RequestContext,
  ): Promise<void> {
    const membership = await this.organizationsRepository.findMembership(
      organizationId,
      userId,
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
        { excludingUserId: userId },
      );
      assertNotLastOwner(
        { userId, role: membership.role },
        remainingOwners,
      );
    }

    const removed = await this.organizationsRepository.removeMember(
      organizationId,
      userId,
    );

    if (!removed) {
      throw new AppError(
        ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
        'You are not a member of this organization',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.auditWriter.log({
      actorId: userId,
      action: 'organization.leave',
      entityType: 'organization_member',
      entityId: userId,
      metadata: { organizationId },
      requestContext,
    });
  }
}
