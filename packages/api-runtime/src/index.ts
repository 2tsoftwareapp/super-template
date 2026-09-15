// Global Express.Request augmentation (requestId/user/requestContext) must
// travel with any import of @repo/api-runtime. A runtime `import` of a .d.ts
// breaks esbuild/vitest, so the type-only reference form is required here.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types/express.d.ts" />

// --- runtime surface ---
export { AccessProfileCache, type AccessProfileSnapshot } from "./cache/access-profile.cache";
export {
  APP_ENVIRONMENT,
  AppConfigModule,
  type AppEnvironment,
  EnvironmentService,
  validateEnvironment,
} from "./config/environment";
export * from "./decorators/allow-must-change-password.decorator";
export * from "./decorators/api-response.decorator";
export * from "./decorators/authorize.decorator";
export * from "./decorators/current-user.decorator";
export * from "./decorators/public.decorator";
export * from "./decorators/skip-envelope.decorator";
// --- stable API-contract vocabulary + RBAC catalogs (runtime-owned) ---
export * from "./error-codes";
export * from "./filters/app-exception.filter";
export { AuthorizeGuard } from "./guards/authorize.guard";
export * from "./interceptors/response-envelope.interceptor";
export { ConsoleAppLogger } from "./logging/console-logger.service";
export { LoggingModule } from "./logging/logging.module";
export { RequestContextMiddleware } from "./middleware/request-context.middleware";
export { RequestLoggerMiddleware } from "./middleware/request-logger.middleware";
export * from "./pagination/dto/pagination.dto";
export * from "./rbac";

export { adaptRedisClient, createRedisClient } from "./redis/redis-client.adapter";
export { RedisThrottlerStorage } from "./throttling/redis-throttler.storage";

// --- convenience re-exports (Nest app host + features) ---
export * from "@repo/api-kernel";
export * from "@repo/api-plugin-kit";

export { type ErrorReportContext, ErrorReporterService } from "@repo/observability";
