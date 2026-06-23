import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';

import { assertOrganizationRole } from '../../domain/organization-access.policy';
import { OrganizationsRepository } from '../../infrastructure/organizations.repository';

@Injectable()
export class DeleteOrganizationUseCase {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
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

    assertOrganizationRole(membership, ['OWNER']);

    const organization =
      await this.organizationsRepository.softDeleteOrganization(organizationId);

    if (!organization) {
      throw new AppError(
        ERROR_CODES.ORGANIZATION_NOT_FOUND,
        'Organization not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.auditWriter.log({
      actorId: userId,
      action: 'organization.delete',
      entityType: 'organization',
      entityId: organizationId,
      requestContext,
    });
  }
}
