import { Module } from '@nestjs/common';

import { ActivitiesService } from './application/activities.service';
import { ACTIVITY_EMITTER } from './application/activity-emitter.port';
import { ActivitiesRepository } from './infrastructure/activities.repository';
import { ActivitiesController } from './presentation/activities.controller';

@Module({
  controllers: [ActivitiesController],
  providers: [
    ActivitiesRepository,
    ActivitiesService,
    {
      provide: ACTIVITY_EMITTER,
      useExisting: ActivitiesService,
    },
  ],
  exports: [ActivitiesRepository, ActivitiesService, ACTIVITY_EMITTER],
})
export class ActivitiesModule {}
