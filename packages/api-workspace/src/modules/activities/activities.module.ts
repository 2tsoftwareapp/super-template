import { Module } from '@nestjs/common';

import { ActivitiesService } from './application/activities.service';
import { ActivitiesRepository } from './infrastructure/activities.repository';
import { ActivitiesController } from './presentation/activities.controller';

@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesRepository, ActivitiesService],
  exports: [ActivitiesRepository, ActivitiesService],
})
export class ActivitiesModule {}
