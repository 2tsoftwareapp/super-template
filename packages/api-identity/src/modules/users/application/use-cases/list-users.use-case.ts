import type { AuthenticatedRequestUser } from "@repo/api-core";

import { Inject, Injectable } from "@nestjs/common";

import type { ListUsersQuery } from "../users.types";

import { AccessControlService } from "../../../access-control/application/access-control.service";
import { resolveUsersListOrganizationId } from "../../domain/user-org-scope.policy";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "../ports/users.repository.port";
import { UsersMapper } from "../users.mapper";

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    private readonly usersMapper: UsersMapper,
  ) {}

  async execute(actor: AuthenticatedRequestUser, query: ListUsersQuery) {
    const organizationId = resolveUsersListOrganizationId(actor);
    const result = await this.usersRepository.list({
      ...query,
      ...(organizationId ? { organizationId } : {}),
    });
    // Scope role data to the same organization so that roles from other orgs
    // are never leaked to users who shouldn't see them.
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
