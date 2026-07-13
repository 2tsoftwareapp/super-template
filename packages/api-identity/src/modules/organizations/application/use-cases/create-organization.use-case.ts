import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { DatabaseClient } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';
import { DATABASE, runInTransaction } from '@repo/api-database';

import type { CreateOrganizationCommand } from '../organizations.types';

import { AccessControlService } from '../../../access-control/application/access-control.service';
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'organization';

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    input: CreateOrganizationCommand,
  ) {
    const baseSlug = slugify(input.name);
    const organization = await runInTransaction(
      this.database,
      async (transaction) => {
        let slug = baseSlug;
        let attempt = 0;

        while (attempt < 5) {
          const existing = await this.organizationsRepository.findBySlug(
            slug,
            transaction,
          );
          if (!existing) {
            break;
          }
          attempt += 1;
          slug = `${baseSlug}-${attempt}`;
        }

        const created = await this.organizationsRepository.createOrganization(
          {
            name: input.name.trim(),
            slug,
          },
          transaction,
        );

        if (!created) {
          throw new AppError(
            ERROR_CODES.INTERNAL_ERROR,
            'Organization could not be created',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        await this.organizationsRepository.addMember(
          {
            organizationId: created.id,
            userId: user.userId,
            role: 'OWNER',
          },
          transaction,
        );
        await this.accessControlService.ensureOrganizationAdminRole(
          created.id,
          user.userId,
          transaction,
        );

        return created;
      },
    );

    return {
      data: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: 'OWNER' as const,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
        current: false,
      },
    };
  }
}
