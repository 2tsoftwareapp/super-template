import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { EnvironmentService, LoggingModule, RedisThrottlerStorage } from "@repo/api-runtime";
import { AppConfigModule } from "@repo/api-runtime";
import {
  composedSchema,
  databaseRuntimeOptions,
  featureModules,
  organizationModelOptions,
} from "@repo/app-composition";
import { DatabaseModule } from "@repo/database-runtime";

/**
 * HTTP runtime + composed feature modules. Scheduled execution belongs to the
 * standalone worker host and is intentionally not initialized here.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    ThrottlerModule.forRootAsync({
      inject: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => ({
        skipIf: () =>
          environmentService.isTest && !environmentService.values.THROTTLER_ENABLED_IN_TEST,
        throttlers: [
          {
            ttl: environmentService.values.THROTTLER_TTL_MS,
            limit: environmentService.values.THROTTLER_LIMIT,
          },
        ],
        storage: new RedisThrottlerStorage(environmentService),
      }),
    }),
    DatabaseModule.forRoot({
      schema: composedSchema,
      options: databaseRuntimeOptions,
      organizationModel: organizationModelOptions,
    }),
    ...featureModules,
  ],
})
export class RuntimeModule {}
