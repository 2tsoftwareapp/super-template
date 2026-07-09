import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  Reflector,
} from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
  APP_LOGGER,
  AppExceptionFilter,
  type AppLogger,
  AuthorizeGuard,
  EnvironmentService,
  ErrorReporterService,
  ImportExportModule,
  LoggingModule,
  RedisThrottlerStorage,
  RequestContextMiddleware,
  RequestLoggerMiddleware,
  ResponseEnvelopeInterceptor,
} from '@repo/api-core';
import { AppConfigModule } from '@repo/api-core/config/app-config.module';
import { DatabaseModule, TenantContextService } from '@repo/api-database';
import { HealthModule } from '@repo/api-health';
import { IdentityModule } from '@repo/api-identity';
import { AuthService } from '@repo/api-identity/modules/auth/application/auth.service';
import { PlatformModule } from '@repo/api-platform';

import { AuthGuard } from './shell/auth.guard';
import { TenantContextInterceptor } from './shell/tenant-context.interceptor';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    ImportExportModule,
    ThrottlerModule.forRootAsync({
      inject: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => ({
        skipIf: () => environmentService.isTest,
        throttlers: [
          {
            ttl: 60_000,
            limit: 120,
          },
        ],
        storage: new RedisThrottlerStorage(environmentService),
      }),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,
    IdentityModule,
    PlatformModule,
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
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, authService: AuthService) =>
        new AuthGuard(reflector, authService),
      inject: [Reflector, AuthService],
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new AuthorizeGuard(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) =>
        new ResponseEnvelopeInterceptor(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (
        reflector: Reflector,
        tenantContextService: TenantContextService,
      ) => new TenantContextInterceptor(reflector, tenantContextService),
      inject: [Reflector, TenantContextService],
    },
    TenantContextService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, RequestLoggerMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
