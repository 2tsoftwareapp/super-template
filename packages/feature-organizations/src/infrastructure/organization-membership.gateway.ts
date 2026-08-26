import type {
  OrganizationMemberRecord,
  OrganizationMemberRole,
  OrganizationMembership,
  OrganizationMemberWithUserRecord,
  UserOrganizationRecord,
} from "@repo/api-runtime";
import type { TransactionExecutor } from "@repo/api-runtime";

import { Injectable } from "@nestjs/common";
import { ORGANIZATION_MEMBERSHIP, resolveLazyPort } from "@repo/api-runtime";

/**
 * Lazy bridge to ORGANIZATION_MEMBERSHIP (implemented in feature-users).
 * OrganizationsModule initializes before UsersModule (users dependsOn orgs),
 * so constructor injection of the port would fail at Nest bootstrap.
 */
@Injectable()
export class OrganizationMembershipGateway implements OrganizationMembership {
  private store(): OrganizationMembership {
    return resolveLazyPort<OrganizationMembership>(ORGANIZATION_MEMBERSHIP);
  }

  addMember(
    values: { organizationId: string; userId: string; role: OrganizationMemberRole },
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null> {
    return this.store().addMember(values, executor);
  }

  upsertMember(
    values: { organizationId: string; userId: string; role: OrganizationMemberRole },
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null> {
    return this.store().upsertMember(values, executor);
  }

  findMembership(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null> {
    return this.store().findMembership(organizationId, userId, executor);
  }

  listForUser(userId: string, executor?: TransactionExecutor): Promise<UserOrganizationRecord[]> {
    return this.store().listForUser(userId, executor);
  }

  listMembers(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberWithUserRecord[]> {
    return this.store().listMembers(organizationId, executor);
  }

  countOwners(
    organizationId: string,
    options?: { excludingUserId?: string; executor?: TransactionExecutor; lock?: boolean },
  ): Promise<number> {
    return this.store().countOwners(organizationId, options);
  }

  countMembers(organizationId: string, executor?: TransactionExecutor): Promise<number> {
    return this.store().countMembers(organizationId, executor);
  }

  updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationMemberRole,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null> {
    return this.store().updateMemberRole(organizationId, userId, role, executor);
  }

  removeMember(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null> {
    return this.store().removeMember(organizationId, userId, executor);
  }

  findPrimaryOrganizationId(
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<string | null> {
    return this.store().findPrimaryOrganizationId(userId, executor);
  }

  deleteByOrganizationId(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    return this.store().deleteByOrganizationId(organizationId, executor);
  }
}
