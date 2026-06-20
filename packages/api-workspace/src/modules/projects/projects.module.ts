import { Module } from '@nestjs/common';
import { PROJECT_LOOKUP } from '@repo/api-core';

import { ProjectsMapper } from './application/projects.mapper';
import { PROJECTS_REPOSITORY } from './application/projects.repository.port';
import { ProjectsService } from './application/projects.service';
import { ProjectsImportExportAdapter } from './application/services/projects-import-export.adapter';
import { ArchiveProjectUseCase } from './application/use-cases/archive-project.use-case';
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { GetProjectUseCase } from './application/use-cases/get-project.use-case';
import { ListProjectAttachmentsUseCase } from './application/use-cases/list-project-attachments.use-case';
import { ListProjectsUseCase } from './application/use-cases/list-projects.use-case';
import { RestoreProjectUseCase } from './application/use-cases/restore-project.use-case';
import { UpdateProjectUseCase } from './application/use-cases/update-project.use-case';
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
    ArchiveProjectUseCase,
    RestoreProjectUseCase,
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
