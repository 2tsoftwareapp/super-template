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

import { CreateProjectUseCase } from './create-project.use-case';
import { GetProjectUseCase } from './get-project.use-case';
import { ListProjectAttachmentsUseCase } from './list-project-attachments.use-case';
import { ListProjectsUseCase } from './list-projects.use-case';
import { ProjectLifecycleUseCase } from './project-lifecycle.use-case';
import { UpdateProjectUseCase } from './update-project.use-case';

export type { ProjectView as ProjectDto } from './projects.types';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly listProjectsUseCase: ListProjectsUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    private readonly projectLifecycleUseCase: ProjectLifecycleUseCase,
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
    return this.projectLifecycleUseCase.remove(user, projectId, requestContext);
  }

  restore(
    user: AuthenticatedRequestUser,
    projectId: string,
    requestContext?: RequestContext,
  ) {
    return this.projectLifecycleUseCase.restore(
      user,
      projectId,
      requestContext,
    );
  }

  listAttachments(user: AuthenticatedRequestUser, projectId: string) {
    return this.listProjectAttachmentsUseCase.execute(user, projectId);
  }
}
