import type { AuthenticatedRequestUser } from '@repo/api-core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';

@Injectable()
export class GetOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) {}

  async execute(organizationId: string, actor: string | AuthenticatedRequestUser) {
    const { userId: actorUserId, isSuperAdmin } = typeof actor === 'string'
      ? { userId: actor, isSuperAdmin: false }
      : { userId: actor.userId, isSuperAdmin: actor.roles?.includes('SUPER_ADMIN') ?? false };

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
    }

    const organization =
      await this.organizationsRepository.findById(organizationId);

    if (!organization) {
      throw new AppError(
        ERROR_CODES.ORGANIZATION_NOT_FOUND,
        'Organization not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const memberCount =
      await this.organizationsRepository.countMembers(organizationId);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role: isSuperAdmin ? ('ADMIN' as const) : membership!.role,
      memberCount,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }
}
