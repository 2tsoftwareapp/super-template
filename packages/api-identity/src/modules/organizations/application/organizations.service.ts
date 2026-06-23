import type { AuthenticatedRequestUser, RequestContext } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import type { OrganizationMemberRole } from '../domain/organization-access.policy';
import type { CreateOrganizationCommand } from './organizations.types';

import { AssertOrganizationMembershipUseCase } from './use-cases/assert-organization-membership.use-case';
import { CreateOrganizationUseCase } from './use-cases/create-organization.use-case';
import { DeleteOrganizationUseCase } from './use-cases/delete-organization.use-case';
import { EnsurePersonalOrganizationUseCase } from './use-cases/ensure-personal-organization.use-case';
import { GetOrganizationUseCase } from './use-cases/get-organization.use-case';
import { LeaveOrganizationUseCase } from './use-cases/leave-organization.use-case';
import { ListOrganizationMembersUseCase } from './use-cases/list-organization-members.use-case';
import { ListOrganizationsForUserUseCase } from './use-cases/list-organizations-for-user.use-case';
import { RemoveOrganizationMemberUseCase } from './use-cases/remove-organization-member.use-case';
import { ResolveOrganizationIdForUserUseCase } from './use-cases/resolve-organization-id-for-user.use-case';
import { UpdateMemberRoleUseCase } from './use-cases/update-member-role.use-case';
import { UpdateOrganizationUseCase } from './use-cases/update-organization.use-case';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly listOrganizationsForUserUseCase: ListOrganizationsForUserUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly ensurePersonalOrganizationUseCase: EnsurePersonalOrganizationUseCase,
    private readonly assertOrganizationMembershipUseCase: AssertOrganizationMembershipUseCase,
    private readonly resolveOrganizationIdForUserUseCase: ResolveOrganizationIdForUserUseCase,
    private readonly getOrganizationUseCase: GetOrganizationUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase,
    private readonly listOrganizationMembersUseCase: ListOrganizationMembersUseCase,
    private readonly updateMemberRoleUseCase: UpdateMemberRoleUseCase,
    private readonly removeOrganizationMemberUseCase: RemoveOrganizationMemberUseCase,
    private readonly leaveOrganizationUseCase: LeaveOrganizationUseCase,
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

  async getOrganization(organizationId: string, userId: string) {
    return this.getOrganizationUseCase.execute(organizationId, userId);
  }

  async updateOrganization(
    organizationId: string,
    userId: string,
    input: { name: string },
    requestContext?: RequestContext,
  ) {
    return this.updateOrganizationUseCase.execute(
      organizationId,
      userId,
      input,
      requestContext,
    );
  }

  async deleteOrganization(
    organizationId: string,
    userId: string,
    requestContext?: RequestContext,
  ) {
    return this.deleteOrganizationUseCase.execute(
      organizationId,
      userId,
      requestContext,
    );
  }

  async listMembers(organizationId: string, userId: string) {
    return this.listOrganizationMembersUseCase.execute(organizationId, userId);
  }

  async updateMemberRole(
    organizationId: string,
    actorUserId: string,
    targetUserId: string,
    role: OrganizationMemberRole,
    requestContext?: RequestContext,
  ) {
    return this.updateMemberRoleUseCase.execute(
      organizationId,
      actorUserId,
      targetUserId,
      role,
      requestContext,
    );
  }

  async removeMember(
    organizationId: string,
    actorUserId: string,
    targetUserId: string,
    requestContext?: RequestContext,
  ) {
    return this.removeOrganizationMemberUseCase.execute(
      organizationId,
      actorUserId,
      targetUserId,
      requestContext,
    );
  }

  async leave(
    organizationId: string,
    userId: string,
    requestContext?: RequestContext,
  ) {
    return this.leaveOrganizationUseCase.execute(
      organizationId,
      userId,
      requestContext,
    );
  }
}
