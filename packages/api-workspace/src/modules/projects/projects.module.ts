import { Module } from '@nestjs/common';
import { PROJECT_LOOKUP } from '@repo/api-core';

import { CreateProjectUseCase } from './application/create-project.use-case';
import { GetProjectUseCase } from './application/get-project.use-case';
import { ListProjectAttachmentsUseCase } from './application/list-project-attachments.use-case';
import { ListProjectsUseCase } from './application/list-projects.use-case';
import { ProjectLifecycleUseCase } from './application/project-lifecycle.use-case';
import { ProjectsImportExportAdapter } from './application/projects-import-export.adapter';
import { ProjectsMapper } from './application/projects.mapper';
import { PROJECTS_REPOSITORY } from './application/projects.repository.port';
import { ProjectsService } from './application/projects.service';
import { UpdateProjectUseCase } from './application/update-project.use-case';
import { ProjectsRepository } from './infrastructure/projects.repository';
import { ProjectsController } from './presentation/projects.controller';

@Module({
  controllers: [ProjectsController],
  providers: [
    ProjectsRepository,
    ProjectsMapper,
    ListProjectsUseCase,
    GetProjectUseCase,
    CreateProjectUseCase,
    UpdateProjectUseCase,
    ProjectLifecycleUseCase,
    ListProjectAttachmentsUseCase,
    ProjectsService,
    ProjectsImportExportAdapter,
    {
      provide: PROJECT_LOOKUP,
      useExisting: ProjectsRepository,
    },
    {
      provide: PROJECTS_REPOSITORY,
      useExisting: ProjectsRepository,
    },
  ],
  exports: [
    ProjectsRepository,
    ProjectsService,
    PROJECT_LOOKUP,
    PROJECTS_REPOSITORY,
  ],
})
export class ProjectsModule {}
