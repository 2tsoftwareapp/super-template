import type { MiddlewareConsumer, Provider } from "@nestjs/common";

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
 * Effective guard ordering (first registered runs first):
 *   exception filter → request middleware →
 *   maintenance (10, feature-settings) →
 *   ThrottlerGuard (generic) →
 *   auth (20, feature-auth) →
 *   AuthorizeGuard (generic) →
 *   ResponseEnvelopeInterceptor →
 *   tenant context (30, feature-access-control)
 *
 * Feature-contributed guards use `useFactory` + `inject` with tokens
 * resolved from the root scope. The factory manually creates the
 * guard instance, avoiding Nest's class-level DI resolution which
 * fails for APP_GUARD at root scope.
 *
 * Interceptors are registered innermost-first (first = closest to handler).
 */
export const globalPipelineProviders: Provider[] = [
  // --- Exception filter (outermost) ---
  {
    provide: APP_FILTER,
    useFactory: (
      environmentService: EnvironmentService,
      logger: AppLogger,
      errorReporter: ErrorReporterService,
    ) => new AppExceptionFilter(environmentService, logger, errorReporter),
    inject: [EnvironmentService, APP_LOGGER, ErrorReporterService],
  },

  // --- Request middleware ---
  RequestLoggerMiddleware,

  // --- Guards ---
  // composedHttpPipelineGuards is sorted by httpPipelineOrder ascending.
  // Settings (10) comes first, Auth (20) comes second.
  // We place the first feature guard(s) before ThrottlerGuard,
  // and the rest after it. For the current feature set:
  //   maintenance (10) → ThrottlerGuard → auth (20) → AuthorizeGuard
  // This split point is derived from the feature manifest ordering.
  ...composedHttpPipelineGuards.slice(0, 1), // maintenance (order 10)
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  ...composedHttpPipelineGuards.slice(1), // auth (order 20)
  {
    provide: APP_GUARD,
    useFactory: (reflector: Reflector) => new AuthorizeGuard(reflector),
    inject: [Reflector],
  },

  // --- Interceptors (registered innermost-first) ---
  {
    provide: APP_INTERCEPTOR,
    useFactory: (reflector: Reflector) => new ResponseEnvelopeInterceptor(reflector),
    inject: [Reflector],
  },
  ...composedHttpPipelineInterceptors,

  // --- Global providers ---
  TenantContextService,
];

export function configureGlobalMiddleware(consumer: MiddlewareConsumer): void {
  consumer
    .apply(RequestContextMiddleware, RequestLoggerMiddleware)
    .forRoutes({ path: "*path", method: RequestMethod.ALL });
}

export type { MiddlewareConsumer };
