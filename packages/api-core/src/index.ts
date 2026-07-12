// Global Express.Request augmentation (requestId/user/requestContext) must
// travel with any import of @repo/api-core. A runtime `import` of a .d.ts
// breaks esbuild/vitest, so the type-only reference form is required here.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common/types/express.d.ts" />
export {
  AccessProfileCache,
  type AccessProfileSnapshot,
} from "./common/cache/access-profile.cache";
export * from "./common/constants/error-codes";
export {
  isMandatoryMailTemplate,
  MANDATORY_MAIL_TEMPLATE_KEYS,
  type MandatoryMailTemplateKey,
} from "./common/constants/mandatory-mail-templates";
export * from "./common/constants/organization-role";
export * from "./common/decorators/api-response.decorator";
export * from "./common/decorators/authorize.decorator";

export * from "./common/decorators/current-user.decorator";
export * from "./common/decorators/public.decorator";
export * from "./common/decorators/skip-envelope.decorator";
export * from "./common/errors/app-error";
export * from "./common/filters/app-exception.filter";
export { AuthorizeGuard } from "./common/guards/authorize.guard";
export { ImportExportModule } from "./common/import-export/import-export.module";
export * from "./common/interceptors/response-envelope.interceptor";
export { ConsoleAppLogger } from "./common/logging/console-logger.service";
export * from "./common/logging/logger.interface";
export { LoggingModule } from "./common/logging/logging.module";
export { RequestContextMiddleware } from "./common/middleware/request-context.middleware";
export { RequestLoggerMiddleware } from "./common/middleware/request-logger.middleware";
export { ErrorReporterService } from "./common/observability/error-reporter.service";
export * from "./common/pagination/pagination.dto";
export * from "./common/rbac";
export {
  adaptRedisClient,
  createRedisClient,
} from "./common/redis/redis-client.adapter";
export * from "./common/sort/multi-sort";
export { RedisThrottlerStorage } from "./common/throttling/redis-throttler.storage";
export * from "./common/types/json-value";
export * from "./common/types/request-context";
export * from "./common/types/transaction-executor";
export * from "./common/utils/csv";
export * from "./common/utils/duration";
export * from "./common/utils/normalize-email";
export * from "./common/utils/opaque-token";
export * from "./common/utils/redact";
export * from "./common/utils/require-organization";
export { APP_ENVIRONMENT } from "./config/config.constants";
export type { AppEnvironment } from "./config/env.schema";
export { validateEnvironment } from "./config/env.schema";
export { EnvironmentService } from "./config/environment.service";
export { loadEnvFiles } from "./config/load-env-files";
export {
  AUDIT_WRITER,
  type AuditLogInput,
  type AuditWriter,
} from "./ports/audit-writer.port";
export {
  AUTH_TOKEN_CLEANUP,
  type AuthTokenCleanup,
} from "./ports/auth-token-cleanup.port";
export {
  BACKGROUND_JOB_ENQUEUER,
  type BackgroundJobEnqueueInput,
  type BackgroundJobEnqueuer,
} from "./ports/background-job-enqueuer.port";
export {
  ENTITY_ATTACHMENT_LISTING,
  type EntityAttachmentListing,
  type EntityAttachmentRecord,
} from "./ports/entity-attachment-listing.port";
export {
  FILE_LOOKUP,
  type FileLookup,
  type FileOwnerRecord,
} from "./ports/file-lookup.port";
export {
  type ImportExportAdapter,
  ImportExportAdapterRegistry,
  type ImportExportRowContext,
  type ImportValidationError,
} from "./ports/import-export-adapter.port";
export {
  MAIL_TEMPLATE_SENDER,
  type MailTemplateSender,
  type MailTemplateSendInput,
} from "./ports/mail-template-sender.port";
export {
  ORGANIZATION_LOOKUP,
  type OrganizationLookup,
} from "./ports/organization-lookup.port";
export {
  USER_LOOKUP,
  type UserLookup,
  type UserSummary,
} from "./ports/user-lookup.port";
export {
  type NotificationMessage,
  type SendUserNotificationInput,
  USER_NOTIFICATION_SENDER,
  type UserNotificationSender,
} from "./ports/user-notification-sender.port";
export {
  type NotificationChannelPreferences,
  USER_PREFERENCES_LOOKUP,
  type UserPreferencesLookup,
} from "./ports/user-preferences-lookup.port";
