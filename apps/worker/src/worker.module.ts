import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AppConfigModule, LoggingModule } from "@repo/api-runtime";
import {
  composedSchema,
  databaseRuntimeOptions,
  featureModules,
  organizationModelOptions,
} from "@repo/app-composition";
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
    DatabaseModule.forRoot({
      schema: composedSchema,
      options: databaseRuntimeOptions,
      organizationModel: organizationModelOptions,
    }),
    ...featureModules,
  ],
})
export class WorkerModule {}
