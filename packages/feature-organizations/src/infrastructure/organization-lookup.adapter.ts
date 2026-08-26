import type {
  OrganizationLookup,
  OrganizationMemberRole,
  TransactionExecutor,
} from "@repo/api-runtime";

import { Inject, Injectable } from "@nestjs/common";

import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../application/ports/organizations.repository.port";
import { OrganizationMembershipGateway } from "./organization-membership.gateway";

@Injectable()
export class OrganizationLookupAdapter implements OrganizationLookup {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    private readonly membership: OrganizationMembershipGateway,
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
