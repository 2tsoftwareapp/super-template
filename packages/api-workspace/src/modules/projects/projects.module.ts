import { Module } from '@nestjs/common';
import { PROJECT_DEMO_GATEWAY, PROJECT_LOOKUP } from '@repo/api-core';

import { ProjectsMapper } from './application/projects.mapper';
import { PROJECTS_REPOSITORY } from './application/projects.repository.port';
import { ProjectsService } from './application/projects.service';
import { ProjectsRepository } from './infrastructure/projects.repository';
import { ProjectsController } from './presentation/projects.controller';

@Module({
  controllers: [ProjectsController],
  providers: [
    ProjectsRepository,
    ProjectsMapper,
    ProjectsService,
    {
      provide: PROJECT_DEMO_GATEWAY,
      useExisting: ProjectsRepository,
    },
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
    PROJECT_DEMO_GATEWAY,
    PROJECT_LOOKUP,
    PROJECTS_REPOSITORY,
  ],
})
export class ProjectsModule {}
