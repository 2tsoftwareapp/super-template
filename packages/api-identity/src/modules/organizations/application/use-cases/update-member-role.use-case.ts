import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';

import type { OrganizationMemberRole } from '../../domain/organization-access.policy';

import {
  assertCanManageTargetRole,
  assertNotLastOwner,
  assertOrganizationRole,
} from '../../domain/organization-access.policy';
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';

@Injectable()
export class UpdateMemberRoleUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    organizationId: string,
    actorUserId: string,
    targetUserId: string,
    role: OrganizationMemberRole,
    requestContext?: RequestContext,
  ) {
    const actorMembership = await this.organizationsRepository.findMembership(
      organizationId,
      actorUserId,
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

    if (targetMembership.role === 'OWNER' && role !== 'OWNER') {
      const remainingOwners = await this.organizationsRepository.countOwners(
        organizationId,
        { excludingUserId: targetUserId },
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
    );

    if (!updated) {
      throw new AppError(
        ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
        'This user is not a member of the organization',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.auditWriter.log({
      actorId: actorUserId,
      action: 'organization.member.role-update',
      entityType: 'organization_member',
      entityId: targetUserId,
      metadata: { organizationId, role },
      requestContext,
    });

    return {
      data: {
        userId: updated.userId,
        role: updated.role,
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }
}
