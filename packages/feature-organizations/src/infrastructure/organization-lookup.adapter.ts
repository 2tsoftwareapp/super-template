import type { TransactionExecutor } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";

import type { OrganizationMembership } from "../public/contracts";
import type {
  OrganizationLookup,
  OrganizationMemberRole,
} from "../public/organization-lookup.port";

import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../application/ports/organizations.repository.port";
import { ORGANIZATION_MEMBERSHIP } from "../public/organization-membership.token";

@Injectable()
export class OrganizationLookupAdapter implements OrganizationLookup {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
  ) {}

  findPrimaryOrganizationId(userId: string, executor?: TransactionExecutor) {
    return this.membership.findPrimaryOrganizationId(userId, executor);
  }

  findById(organizationId: string, executor?: TransactionExecutor) {
    return this.organizationsRepository.findById(organizationId, executor);
  }

  findMembership(organizationId: string, userId: string, executor?: TransactionExecutor) {
    return this.membership.findMembership(organizationId, userId, executor);
  }

  upsertMember(
    values: {
      organizationId: string;
      userId: string;
      role: OrganizationMemberRole;
    },
    executor?: TransactionExecutor,
  ) {
    return this.membership.upsertMember(values, executor);
  }
}
