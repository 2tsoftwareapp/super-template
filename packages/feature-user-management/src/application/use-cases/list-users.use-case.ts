import type { AuthenticatedRequestUser } from "@repo/api-runtime";
import type { ListUsersQuery } from "@repo/feature-users/contracts";

import { Inject, Injectable } from "@nestjs/common";
import {
  USER_ACCESS_CONTROL,
  type UserAccessControl,
} from "@repo/feature-access-control/contracts";
import {
  ORGANIZATION_MEMBERSHIP,
  type OrganizationMembership,
} from "@repo/feature-organizations/contracts";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";
import { UsersMapper } from "@repo/feature-users/module";

import { resolveUsersListOrganizationId } from "../../user-org-scope.policy";

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(USER_ACCESS_CONTROL)
    private readonly accessControlService: UserAccessControl,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    private readonly usersMapper: UsersMapper,
  ) {}

  async execute(actor: AuthenticatedRequestUser, query: ListUsersQuery) {
    const organizationId = resolveUsersListOrganizationId(actor);

    // Build candidate user IDs from organization and role intersections
    let candidateUserIds: string[] | undefined;

    if (organizationId) {
      const orgMemberIds = await this.membership.findUserIdsForOrganization(organizationId);

      if (orgMemberIds.length === 0) {
        return { rows: [], total: 0 };
      }

      candidateUserIds = orgMemberIds;
    }

    // If role filter is applied, intersect with role-filtered user IDs
    if (query.role && candidateUserIds) {
      const roleUserIds = await this.accessControlService.getUserIdsForRole(
        query.role,
        organizationId,
      );

      // Intersect: only users who are both in the org AND have the role
      const roleSet = new Set(roleUserIds);
      candidateUserIds = candidateUserIds.filter((id) => roleSet.has(id));

      if (candidateUserIds.length === 0) {
        return { rows: [], total: 0 };
      }
    } else if (query.role && !candidateUserIds) {
      // SUPER_ADMIN with role filter but no org constraint
      candidateUserIds = await this.accessControlService.getUserIdsForRole(query.role, undefined);

      if (candidateUserIds.length === 0) {
        return { rows: [], total: 0 };
      }
    }

    const listParams: import("@repo/feature-users/contracts").UsersCoreListQuery = {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(candidateUserIds !== undefined ? { candidateUserIds } : {}),
    };
    const result = await this.usersRepository.list(listParams);

    const [rolesByUserId, roleIdsByUserId] = await Promise.all([
      this.accessControlService.getRoleNamesForUsers(
        result.rows.map((row) => row.id),
        organizationId,
      ),
      this.accessControlService.getRoleIdsForUsers(
        result.rows.map((row) => row.id),
        organizationId,
      ),
    ]);

    return {
      rows: result.rows.map((row) =>
        this.usersMapper.toUserView(
          row,
          rolesByUserId.get(row.id) ?? [],
          roleIdsByUserId.get(row.id) ?? [],
        ),
      ),
      total: result.total,
    };
  }
}
