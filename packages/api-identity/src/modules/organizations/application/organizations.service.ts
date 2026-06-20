import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import type { CreateOrganizationCommand } from './organizations.types';

import { AssertOrganizationMembershipUseCase } from './use-cases/assert-organization-membership.use-case';
import { CreateOrganizationUseCase } from './use-cases/create-organization.use-case';
import { EnsurePersonalOrganizationUseCase } from './use-cases/ensure-personal-organization.use-case';
import { ListOrganizationsForUserUseCase } from './use-cases/list-organizations-for-user.use-case';
import { ResolveOrganizationIdForUserUseCase } from './use-cases/resolve-organization-id-for-user.use-case';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly listOrganizationsForUserUseCase: ListOrganizationsForUserUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly ensurePersonalOrganizationUseCase: EnsurePersonalOrganizationUseCase,
    private readonly assertOrganizationMembershipUseCase: AssertOrganizationMembershipUseCase,
    private readonly resolveOrganizationIdForUserUseCase: ResolveOrganizationIdForUserUseCase,
  ) {}

  async listForUser(user: AuthenticatedRequestUser) {
    return this.listOrganizationsForUserUseCase.execute(user);
  }

  async create(user: AuthenticatedRequestUser, input: CreateOrganizationCommand) {
    return this.createOrganizationUseCase.execute(user, input);
  }

  async ensurePersonalOrganization(
    userId: string,
    displayName: string,
    executor?: DatabaseExecutor,
  ) {
    return this.ensurePersonalOrganizationUseCase.execute(
      userId,
      displayName,
      executor,
    );
  }

  async assertMembership(
    organizationId: string,
    userId: string,
    executor?: DatabaseExecutor,
  ) {
    return this.assertOrganizationMembershipUseCase.execute(
      organizationId,
      userId,
      executor,
    );
  }

  async resolveOrganizationIdForUser(
    userId: string,
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ) {
    return this.resolveOrganizationIdForUserUseCase.execute(
      userId,
      organizationId,
      executor,
    );
  }
}
