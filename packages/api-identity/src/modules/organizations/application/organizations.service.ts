import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';
import type { AuthenticatedRequestUser } from '@repo/api-core';
import { DATABASE } from '@repo/api-database';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';
import { runInTransaction } from '@repo/api-database';
import { OrganizationsRepository } from '../infrastructure/organizations.repository';
import type { CreateOrganizationDto } from '../presentation/organizations.dto';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'organization';

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async listForUser(user: AuthenticatedRequestUser) {
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

  async create(user: AuthenticatedRequestUser, input: CreateOrganizationDto) {
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

  async ensurePersonalOrganization(
    userId: string,
    displayName: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const existing =
      await this.organizationsRepository.findPrimaryOrganizationId(
        userId,
        executor,
      );

    if (existing) {
      return existing;
    }

    const name = `${displayName.trim()}'s Organization`;
    const organization = await this.organizationsRepository.createOrganization(
      {
        name,
        slug: `${slugify(displayName)}-${userId.slice(0, 8)}`,
      },
      executor,
    );

    if (!organization) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Default organization could not be created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.organizationsRepository.addMember(
      {
        organizationId: organization.id,
        userId,
        role: 'OWNER',
      },
      executor,
    );

    return organization.id;
  }

  async assertMembership(
    organizationId: string,
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const membership = await this.organizationsRepository.findMembership(
      organizationId,
      userId,
      executor,
    );

    if (!membership) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You are not a member of this organization',
        HttpStatus.FORBIDDEN,
      );
    }

    return membership;
  }

  async resolveOrganizationIdForUser(
    userId: string,
    organizationId?: string | null,
    executor: DatabaseExecutor = this.database,
  ) {
    if (organizationId) {
      await this.assertMembership(organizationId, userId, executor);
      return organizationId;
    }

    const primary =
      await this.organizationsRepository.findPrimaryOrganizationId(
        userId,
        executor,
      );

    if (!primary) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'No organization is available for this user',
        HttpStatus.FORBIDDEN,
      );
    }

    return primary;
  }
}
