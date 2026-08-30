import type { MiddlewareConsumer, NestModule, Provider, Type } from "@nestjs/common";

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
import { ErrorReporterService } from "@repo/observability";

import { composedHttpPipelineGuards, composedHttpPipelineInterceptors } from "./composed-schema";

/**
 * Generic global HTTP pipeline providers. Feature-specific guards and
 * interceptors are composed from feature manifests by the plugin kit.
 *
 * Ordering: maintenance (settings) → throttling → auth → authorization →
 * tenant context → response envelope → exception mapping.
 */
export const globalPipelineProviders: Provider[] = [
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
  // Feature-contributed guards (maintenance-mode, auth) are registered here
  // in the order declared by each feature's httpPipelineOrder.
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  ...composedHttpPipelineGuards.map((guard) => ({
    provide: APP_GUARD,
    useClass: guard as Type<unknown>,
  })),
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
  // Feature-contributed interceptors (tenant context) are registered here
  // in the order declared by each feature's httpPipelineOrder.
  ...composedHttpPipelineInterceptors.map((interceptor) => ({
    provide: APP_INTERCEPTOR,
    useClass: interceptor as Type<unknown>,
  })),
  TenantContextService,
];

export function configureGlobalMiddleware(consumer: MiddlewareConsumer): void {
  consumer
    .apply(RequestContextMiddleware, RequestLoggerMiddleware)
    .forRoutes({ path: "*path", method: RequestMethod.ALL });
}

export type { NestModule };
