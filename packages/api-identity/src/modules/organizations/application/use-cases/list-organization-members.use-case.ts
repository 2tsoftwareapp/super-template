import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {  AppError, ERROR_CODES , ROLE_NAMES } from '@repo/api-core';

import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';

@Injectable()
export class ListOrganizationMembersUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) {}

  async execute(organizationId: string, actor: string | AuthenticatedRequestUser) {
    const { userId: actorUserId, isSuperAdmin } = typeof actor === 'string'
      ? { userId: actor, isSuperAdmin: false }
      : { userId: actor.userId, isSuperAdmin: actor.roles?.includes(ROLE_NAMES.SUPER_ADMIN) ?? false };

    if (!isSuperAdmin) {
      const membership = await this.organizationsRepository.findMembership(
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

    const members = await this.organizationsRepository.listMembers(organizationId);

    return members.map((member) => ({
      userId: member.userId,
      email: member.email,
      displayName: member.displayName,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    }));
  }
}
