import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { ProjectView } from '../projects.types';

import { assertCanAccessProject } from '../../domain/project-access.policy';
import { ProjectsMapper } from '../projects.mapper';
import {
  PROJECTS_REPOSITORY,
  type ProjectsRepositoryPort,
} from '../projects.repository.port';

@Injectable()
export class GetProjectUseCase {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepositoryPort,
    private readonly projectsMapper: ProjectsMapper,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<ProjectView> {
    const project = await this.projectsRepository.findById(projectId);

    if (!project) {
      throw new AppError(
        ERROR_CODES.PROJECT_NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    assertCanAccessProject(user, project.ownerId);
    return this.projectsMapper.toProjectView(project);
  }
}
