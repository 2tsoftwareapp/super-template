import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';

import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';

@Injectable()
export class ListOrganizationsForUserUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) {}

  async execute(user: AuthenticatedRequestUser) {
    const rows = await this.organizationsRepository.listForUser(user.userId);
    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        role: row.role,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        current: row.id === user.organizationId,
      })),
    };
  }
}
