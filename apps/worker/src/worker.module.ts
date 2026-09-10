import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AppConfigModule, LoggingModule } from "@repo/api-runtime";
import { composedSchema, featureModules } from "@repo/app-composition";
import { DatabaseModule } from "@repo/database-runtime";

/**
 * Runtime composition for the background worker.
 * HTTP middleware and listener setup intentionally stay in apps/api.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    ScheduleModule.forRoot(),
    DatabaseModule.forRoot({ schema: composedSchema }),
    ...featureModules,
  ],
})
export class WorkerModule {}
