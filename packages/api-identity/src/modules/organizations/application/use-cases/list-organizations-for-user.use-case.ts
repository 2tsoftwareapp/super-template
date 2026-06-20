import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import { OrganizationsRepository } from '../../infrastructure/organizations.repository';

@Injectable()
export class ListOrganizationsForUserUseCase {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
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
