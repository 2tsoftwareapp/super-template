import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { Inject, Injectable } from "@nestjs/common";

import type { ListUsersQuery } from "@repo/feature-users/contracts";

import { resolveUsersListOrganizationId } from "@repo/feature-users/contracts";
import { USER_ACCESS_CONTROL, type UserAccessControl } from "@repo/feature-users/contracts";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";
import { UsersMapper } from "@repo/feature-users/module";

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(USER_ACCESS_CONTROL)
    private readonly accessControlService: UserAccessControl,
    private readonly usersMapper: UsersMapper,
  ) {}

  async execute(actor: AuthenticatedRequestUser, query: ListUsersQuery) {
    const organizationId = resolveUsersListOrganizationId(actor);
    const result = await this.usersRepository.list({
      ...query,
      ...(organizationId ? { organizationId } : {}),
    });
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
