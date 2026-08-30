import type { MiddlewareConsumer, NestModule, Provider } from "@nestjs/common";

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
 * Global HTTP pipeline providers for the API host.
 *
 * Effective guard ordering (first registered runs first):
 *   exception mapping → maintenance check → throttling → authentication →
 *   authorization → response envelope → tenant context
 *
 * Feature-contributed providers are complete Nest Provider definitions
 * (with useFactory/useClass and inject) spread directly into the pipeline.
 * The composition step sorts features by httpPipelineOrder, so the arrays
 * are already in deterministic order.
 *
 * Interceptors wrap inward: first registered is innermost (closest to
 * handler), last registered is outermost (closest to response).
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

  // --- Guards (checked in registration order: first = outermost) ---
  // Feature-contributed guards are interleaved with generic guards.
  // composedHttpPipelineGuards is sorted by httpPipelineOrder.
  // We place guards before the ThrottlerGuard (order < 15) and after it (order >= 15).
  ...composedHttpPipelineGuards.filter((_, i) => i === 0), // maintenance (order 10) — before throttling
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  ...composedHttpPipelineGuards.filter((_, i) => i > 0), // auth (order 20) — after throttling
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
  ...composedHttpPipelineInterceptors, // tenant context (order 30)

  // --- Global providers ---
  TenantContextService,
];

export function configureGlobalMiddleware(consumer: MiddlewareConsumer): void {
  consumer
    .apply(RequestContextMiddleware, RequestLoggerMiddleware)
    .forRoutes({ path: "*path", method: RequestMethod.ALL });
}

export type { NestModule };
