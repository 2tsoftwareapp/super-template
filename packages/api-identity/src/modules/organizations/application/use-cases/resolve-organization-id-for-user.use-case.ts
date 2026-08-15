import type { TransactionExecutor } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../ports/organizations.repository.port';
import { AssertOrganizationMembershipUseCase } from './assert-organization-membership.use-case';

@Injectable()
export class ResolveOrganizationIdForUserUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
    private readonly assertOrganizationMembershipUseCase: AssertOrganizationMembershipUseCase,
  ) {}

  async execute(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ) {
    if (organizationId) {
      try {
        await this.assertOrganizationMembershipUseCase.execute(
          organizationId,
          userId,
          executor,
        );
        return organizationId;
      } catch {
        // Fall back to primary organization if the specified one is invalid/deleted/non-member
      }
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
