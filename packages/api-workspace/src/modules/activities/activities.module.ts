import { Module } from '@nestjs/common';

import { ActivitiesService } from './application/activities.service';
import { ACTIVITY_EMITTER } from './application/activity-emitter.port';
import { EmitActivityUseCase } from './application/use-cases/emit-activity.use-case';
import { ListActivitiesUseCase } from './application/use-cases/list-activities.use-case';
import { ActivitiesRepository } from './infrastructure/activities.repository';
import { ActivitiesController } from './presentation/activities.controller';

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
  ],
  exports: [ActivitiesRepository, ActivitiesService, ACTIVITY_EMITTER],
})
export class ActivitiesModule {}
