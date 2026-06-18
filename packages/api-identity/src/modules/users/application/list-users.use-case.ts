import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';

import type { ListUsersQuery } from './users.types';

import { AccessControlService } from '../../access-control/application/access-control.service';
import { resolveUsersListOrganizationId } from '../domain/user-org-scope.policy';
import { UsersMapper } from './users.mapper';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from './users.repository.port';

@Injectable()
export class ListUsersUseCase {
  private readonly usersMapper = new UsersMapper();

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
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
      ),
      this.accessControlService.getRoleIdsForUsers(
        result.rows.map((row) => row.id),
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
