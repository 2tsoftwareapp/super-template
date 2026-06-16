import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from '@repo/api-core/config/app-config.module';
import { EnvironmentService } from '@repo/api-core/config/environment.service';
import { AppExceptionFilter } from '@repo/api-core/common/filters/app-exception.filter';
import { PermissionsGuard } from '@repo/api-core/common/guards/permissions.guard';
import { ResponseEnvelopeInterceptor } from '@repo/api-core/common/interceptors/response-envelope.interceptor';
import { LoggingModule } from '@repo/api-core/common/logging/logging.module';
import { RequestContextMiddleware } from '@repo/api-core/common/middleware/request-context.middleware';
import { RequestLoggerMiddleware } from '@repo/api-core/common/middleware/request-logger.middleware';
import { TenantContextService } from '@repo/api-database';
import { DatabaseModule } from '@repo/api-database';
import { IdentityModule } from '@repo/api-identity';
import { AuthService } from '@repo/api-identity/modules/auth/application/auth.service';
import { PlatformModule } from '@repo/api-platform';
import { WorkspaceModule } from '@repo/api-workspace';
import { AuthGuard } from './shell/auth.guard';
import { TenantContextInterceptor } from './shell/tenant-context.interceptor';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,
    IdentityModule,
    PlatformModule,
    WorkspaceModule,
  ],
  providers: [
    RequestLoggerMiddleware,
    {
      provide: APP_FILTER,
      useFactory: (environmentService: EnvironmentService) =>
        new AppExceptionFilter(environmentService),
      inject: [EnvironmentService],
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, authService: AuthService) =>
        new AuthGuard(reflector, authService),
      inject: [Reflector, AuthService],
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new PermissionsGuard(reflector),
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
