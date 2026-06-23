import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { OrganizationsRepository } from '../../infrastructure/organizations.repository';

@Injectable()
export class GetOrganizationUseCase {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async execute(organizationId: string, userId: string) {
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
      data: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: membership.role,
        memberCount,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      },
    };
  }
}
