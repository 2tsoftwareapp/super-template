import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type {
  CreateProjectCommand,
  ListProjectsQuery,
  UpdateProjectCommand,
} from './projects.types';

import { ArchiveProjectUseCase } from './use-cases/archive-project.use-case';
import { CreateProjectUseCase } from './use-cases/create-project.use-case';
import { GetProjectUseCase } from './use-cases/get-project.use-case';
import { ListProjectAttachmentsUseCase } from './use-cases/list-project-attachments.use-case';
import { ListProjectsUseCase } from './use-cases/list-projects.use-case';
import { RestoreProjectUseCase } from './use-cases/restore-project.use-case';
import { UpdateProjectUseCase } from './use-cases/update-project.use-case';

export type { ProjectView as ProjectDto } from './projects.types';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly listProjectsUseCase: ListProjectsUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    private readonly archiveProjectUseCase: ArchiveProjectUseCase,
    private readonly restoreProjectUseCase: RestoreProjectUseCase,
    private readonly listProjectAttachmentsUseCase: ListProjectAttachmentsUseCase,
  ) {}

  list(user: AuthenticatedRequestUser, query: ListProjectsQuery) {
    return this.listProjectsUseCase.execute(user, query);
  }

  getById(user: AuthenticatedRequestUser, projectId: string) {
    return this.getProjectUseCase.execute(user, projectId);
  }

  create(
    user: AuthenticatedRequestUser,
    input: CreateProjectCommand,
    requestContext?: RequestContext,
  ) {
    return this.createProjectUseCase.execute(user, input, requestContext);
  }

  update(
    user: AuthenticatedRequestUser,
    projectId: string,
    input: UpdateProjectCommand,
    requestContext?: RequestContext,
  ) {
    return this.updateProjectUseCase.execute(
      user,
      projectId,
      input,
      requestContext,
    );
  }

  remove(
    user: AuthenticatedRequestUser,
    projectId: string,
    requestContext?: RequestContext,
  ) {
    return this.archiveProjectUseCase.execute(user, projectId, requestContext);
  }

  restore(
    user: AuthenticatedRequestUser,
    projectId: string,
    requestContext?: RequestContext,
  ) {
    return this.restoreProjectUseCase.execute(
      user,
      projectId,
      requestContext,
    );
  }

  listAttachments(user: AuthenticatedRequestUser, projectId: string) {
    return this.listProjectAttachmentsUseCase.execute(user, projectId);
  }
}
