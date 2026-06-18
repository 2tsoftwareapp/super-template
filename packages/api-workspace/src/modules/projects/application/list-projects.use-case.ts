import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { PERMISSION_NAMES, requireOrganizationId } from '@repo/api-core';

import type { ListProjectsQuery } from './projects.types';

import { ProjectsMapper } from './projects.mapper';
import {
  PROJECTS_REPOSITORY,
  type ProjectsRepositoryPort,
} from './projects.repository.port';

@Injectable()
export class ListProjectsUseCase {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepositoryPort,
    private readonly projectsMapper: ProjectsMapper,
  ) {}

  async execute(user: AuthenticatedRequestUser, query: ListProjectsQuery) {
    const canReadAll =
      user.permissions.includes(PERMISSION_NAMES.PROJECTS_READ) &&
      !user.roles.includes('USER');
    const organizationId = requireOrganizationId(user);
    const result = await this.projectsRepository.list(
      canReadAll
        ? {
            ...query,
            organizationId,
          }
        : {
            ...query,
            ownerId: user.userId,
            organizationId,
          },
    );

    return {
      rows: result.rows.map((row) => this.projectsMapper.toProjectView(row)),
      total: result.total,
    };
  }
}
