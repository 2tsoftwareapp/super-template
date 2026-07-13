import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';
import { DATABASE } from '@repo/api-database';

import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';

@Injectable()
export class AssertOrganizationMembershipUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) {}

  async execute(
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
}
