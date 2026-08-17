import { Module } from "@nestjs/common";
import { ACTIVITY_EMITTER } from "@repo/api-core";

import { ActivitiesService } from "./application/activities.service";
import { ACTIVITIES_REPOSITORY } from "./application/ports/activities.repository.port";
import { EmitActivityUseCase } from "./application/use-cases/emit-activity.use-case";
import { ListActivitiesUseCase } from "./application/use-cases/list-activities.use-case";
import { ActivitiesRepository } from "./infrastructure/activities.repository";
import { ActivitiesController } from "./presentation/activities.controller";

@Module({
  controllers: [ActivitiesController],
  providers: [
    ActivitiesRepository,
    EmitActivityUseCase,
    ListActivitiesUseCase,
    ActivitiesService,
    {
      provide: ACTIVITY_EMITTER,
      useExisting: ActivitiesService,
    },
    {
      provide: ACTIVITIES_REPOSITORY,
      useExisting: ActivitiesRepository,
    },
  ],
  exports: [ActivitiesService, ACTIVITY_EMITTER, ACTIVITIES_REPOSITORY],
})
export class ActivitiesModule {}
