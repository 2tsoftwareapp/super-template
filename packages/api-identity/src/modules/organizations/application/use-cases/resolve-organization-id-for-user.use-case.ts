import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';
import { DATABASE } from '@repo/api-database';

import { OrganizationsRepository } from '../../infrastructure/organizations.repository';
import { AssertOrganizationMembershipUseCase } from './assert-organization-membership.use-case';

@Injectable()
export class ResolveOrganizationIdForUserUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly assertOrganizationMembershipUseCase: AssertOrganizationMembershipUseCase,
  ) {}

  async execute(
    userId: string,
    organizationId?: string | null,
    executor: DatabaseExecutor = this.database,
  ) {
    if (organizationId) {
      await this.assertOrganizationMembershipUseCase.execute(
        organizationId,
        userId,
        executor,
      );
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
