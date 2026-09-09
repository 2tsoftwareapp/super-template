import type { MiddlewareConsumer, Provider } from "@nestjs/common";
import type { AppLogger } from "@repo/api-kernel";
import type { HttpPipelineProviderEntry } from "@repo/api-plugin-kit";

import { RequestMethod } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";
import { APP_LOGGER } from "@repo/api-kernel";
import {
  AppExceptionFilter,
  AuthorizeGuard,
  EnvironmentService,
  RequestContextMiddleware,
  RequestLoggerMiddleware,
  ResponseEnvelopeInterceptor,
  TenantContextService,
} from "@repo/api-runtime";
import {
  composedHttpPipelineGuards,
  composedHttpPipelineInterceptors,
} from "@repo/app-composition";
import { ErrorReporterService } from "@repo/observability";

/**
 * Ordering slots for generic (host-owned) guard providers. Feature guards keep
 * their manifest `httpPipelineOrder`. All guards are merged into one catalog
 * and sorted by `order`, so removing a feature never shifts another guard
 * across a generic one (no array-index assumptions).
 *
 * Effective ordering (first registered runs first):
 *   exception filter → request middleware →
 *   maintenance (10, feature-settings) →
 *   ThrottlerGuard (order 15, generic) →
 *   auth (20, feature-auth) →
 *   AuthorizeGuard (order 25, generic) →
 *   ResponseEnvelopeInterceptor →
 *   tenant context (30, feature-access-control)
 *
 * Feature-contributed guards use `useFactory` + `inject` with tokens
 * resolved from the root scope. The factory manually creates the
 * guard instance, avoiding Nest's class-level DI resolution which
 * fails for APP_GUARD at root scope.
 */
const GENERIC_GUARD_ORDERS = {
  THROTTLER: 15,
  AUTHORIZE: 25,
} as const;

/**
 * Merge feature guard contributions with generic host guards (ThrottlerGuard
 * at order 15, AuthorizeGuard at order 25) and return the catalog sorted by
 * `order`. Accepts the entries so tests can verify ordering for arbitrary
 * feature subsets (omit-feature) using the same merge logic as production.
 */
export function buildOrderedGuardCatalog(
  featureGuards: readonly HttpPipelineProviderEntry[] = composedHttpPipelineGuards,
): HttpPipelineProviderEntry[] {
  const catalog: HttpPipelineProviderEntry[] = [
    ...featureGuards,
    {
      order: GENERIC_GUARD_ORDERS.THROTTLER,
      provider: { provide: APP_GUARD, useClass: ThrottlerGuard },
    },
    {
      order: GENERIC_GUARD_ORDERS.AUTHORIZE,
      provider: {
        provide: APP_GUARD,
        useFactory: (reflector: Reflector) => new AuthorizeGuard(reflector),
        inject: [Reflector],
      },
    },
  ];
  return catalog.sort((a, b) => a.order - b.order);
}

/** Flattened guard providers (sorted by order) for Nest registration. */
export function buildOrderedGuards(
  featureGuards: readonly HttpPipelineProviderEntry[] = composedHttpPipelineGuards,
): Provider[] {
  return buildOrderedGuardCatalog(featureGuards).map((entry) => entry.provider);
}

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
  ...buildOrderedGuards(),

  // --- Interceptors ---
  // ResponseEnvelopeInterceptor wraps responses and must stay outermost of the
  // feature interceptors; feature interceptors follow in manifest order
  // (tenant context, order 30).
  {
    provide: APP_INTERCEPTOR,
    useFactory: (reflector: Reflector) => new ResponseEnvelopeInterceptor(reflector),
    inject: [Reflector],
  },
  ...composedHttpPipelineInterceptors.map((entry) => entry.provider),

  // --- Global providers ---
  TenantContextService,
];

export function configureGlobalMiddleware(consumer: MiddlewareConsumer): void {
  consumer
    .apply(RequestContextMiddleware, RequestLoggerMiddleware)
    .forRoutes({ path: "*path", method: RequestMethod.ALL });
}

export type { MiddlewareConsumer };
