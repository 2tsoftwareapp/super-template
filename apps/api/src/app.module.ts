import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import {
  ACCESS_TOKEN_AUTHENTICATOR,
  type AccessTokenAuthenticator,
  APP_LOGGER,
  AppExceptionFilter,
  type AppLogger,
  AuthorizeGuard,
  EnvironmentService,
  ErrorReporterService,
  LoggingModule,
  RedisThrottlerStorage,
  RequestContextMiddleware,
  RequestLoggerMiddleware,
  ResponseEnvelopeInterceptor,
} from "@repo/api-core";
import { TenantContextService } from "@repo/api-core";
import { AppConfigModule } from "@repo/api-core/config/app-config.module";
import { DatabaseModule } from "@repo/api-database";

import { composedSchema, featureModules } from "./features";
import { AuthGuard } from "./shell/auth.guard";
import { MaintenanceModeGuard } from "./shell/maintenance-mode.guard";
import { TenantContextInterceptor } from "./shell/tenant-context.interceptor";

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
  providers: [
    RequestLoggerMiddleware,
    {
      provide: APP_FILTER,
      useFactory: (
        environmentService: EnvironmentService,
        logger: AppLogger,
        errorReporter: ErrorReporterService,
      ) => new AppExceptionFilter(environmentService, logger, errorReporter),
      inject: [EnvironmentService, APP_LOGGER, ErrorReporterService],
    },
    {
      provide: APP_GUARD,
      useClass: MaintenanceModeGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, accessTokenAuthenticator: AccessTokenAuthenticator) =>
        new AuthGuard(reflector, accessTokenAuthenticator),
      inject: [Reflector, ACCESS_TOKEN_AUTHENTICATOR],
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new AuthorizeGuard(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => new ResponseEnvelopeInterceptor(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector, tenantContextService: TenantContextService) =>
        new TenantContextInterceptor(reflector, tenantContextService),
      inject: [Reflector, TenantContextService],
    },
    TenantContextService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, RequestLoggerMiddleware)
      .forRoutes({ path: "*path", method: RequestMethod.ALL });
  }
}
