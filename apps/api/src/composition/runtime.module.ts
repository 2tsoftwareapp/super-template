import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import {
  EnvironmentService,
  LoggingModule,
  RedisThrottlerStorage,
} from "@repo/api-runtime";
import { AppConfigModule } from "@repo/api-runtime";
import { DatabaseModule } from "@repo/database-runtime";

import { composedSchema, featureModules } from "./composed-schema";

/**
 * Technical runtime + composed feature modules. No business logic lives here.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    ThrottlerModule.forRootAsync({
      inject: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => ({
        skipIf: () => environmentService.isTest,
        throttlers: [
          {
            ttl: environmentService.values.THROTTLER_TTL_MS,
            limit: environmentService.values.THROTTLER_LIMIT,
          },
        ],
        storage: new RedisThrottlerStorage(environmentService),
      }),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule.forRoot({ schema: composedSchema }),
    ...featureModules,
  ],
})
export class RuntimeModule {}
