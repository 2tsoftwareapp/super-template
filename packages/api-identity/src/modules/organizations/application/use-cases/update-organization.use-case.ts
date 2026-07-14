import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';

import { assertOrganizationRole } from '../../domain/organization-access.policy';
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    organizationId: string,
    userId: string,
    input: { name: string },
    requestContext?: RequestContext,
  ) {
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

    assertOrganizationRole(membership, ['OWNER', 'ADMIN']);

    const organization = await this.organizationsRepository.updateOrganization(
      organizationId,
      { name: input.name.trim() },
    );

    if (!organization) {
      throw new AppError(
        ERROR_CODES.ORGANIZATION_NOT_FOUND,
        'Organization not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.auditWriter.log({
      actorId: userId,
      action: 'organization.update',
      entityType: 'organization',
      entityId: organizationId,
      metadata: { name: organization.name },
      requestContext,
    });

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role: membership.role,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }
}
