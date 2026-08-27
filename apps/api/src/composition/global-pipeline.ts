import type { MiddlewareConsumer, NestModule } from "@nestjs/common";

import { RequestMethod } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";
import {
  APP_LOGGER,
  AppExceptionFilter,
  type AppLogger,
  AuthorizeGuard,
  EnvironmentService,
  RequestContextMiddleware,
  RequestLoggerMiddleware,
  ResponseEnvelopeInterceptor,
  TenantContextService,
} from "@repo/api-runtime";
import {
  ACCESS_TOKEN_AUTHENTICATOR,
  type AccessTokenAuthenticator,
} from "@repo/feature-auth/contracts";
import { ErrorReporterService } from "@repo/observability";

import { AuthGuard } from "../shell/auth.guard";
import { MaintenanceModeGuard } from "../shell/maintenance-mode.guard";
import { TenantContextInterceptor } from "../shell/tenant-context.interceptor";

/** Global HTTP pipeline providers for the API host. */
export const globalPipelineProviders = [
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
  { provide: APP_GUARD, useClass: MaintenanceModeGuard },
  { provide: APP_GUARD, useClass: ThrottlerGuard },
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
];

export function configureGlobalMiddleware(consumer: MiddlewareConsumer): void {
  consumer
    .apply(RequestContextMiddleware, RequestLoggerMiddleware)
    .forRoutes({ path: "*path", method: RequestMethod.ALL });
}

export type { NestModule };
