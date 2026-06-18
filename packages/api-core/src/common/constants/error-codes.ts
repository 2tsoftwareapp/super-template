// Central application error codes. These are stable API contracts, not implementation details.
// Keep new codes grouped by domain so client-side handling stays predictable.
export const ERROR_CODES = {
  // Request and validation failures returned before business logic completes.
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  // Authentication failures cover missing credentials, expired sessions, or invalid refresh state.
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_SESSION_REVOKED: 'AUTH_SESSION_REVOKED',
  AUTH_REFRESH_TOKEN_REUSED: 'AUTH_REFRESH_TOKEN_REUSED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  // User account and identity lifecycle conflicts.
  USER_EMAIL_ALREADY_EXISTS: 'USER_EMAIL_ALREADY_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  // Workspace and content lookup failures.
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  NOTIFICATION_DEVICE_NOT_FOUND: 'NOTIFICATION_DEVICE_NOT_FOUND',
  NOTIFICATION_INVALID_AUDIENCE: 'NOTIFICATION_INVALID_AUDIENCE',
  NOTIFICATION_JOB_NOT_FOUND: 'NOTIFICATION_JOB_NOT_FOUND',
  NOTIFICATION_JOB_NOT_CANCELLABLE: 'NOTIFICATION_JOB_NOT_CANCELLABLE',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  PERMISSION_NOT_FOUND: 'PERMISSION_NOT_FOUND',
  ATTACHMENT_NOT_FOUND: 'ATTACHMENT_NOT_FOUND',
  INVITATION_NOT_FOUND: 'INVITATION_NOT_FOUND',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  IMPORT_JOB_NOT_FOUND: 'IMPORT_JOB_NOT_FOUND',
  EXPORT_JOB_NOT_FOUND: 'EXPORT_JOB_NOT_FOUND',
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  SETTINGS_NOT_FOUND: 'SETTINGS_NOT_FOUND',
  // Conflicts indicate the request was syntactically valid but violates uniqueness or state rules.
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  // Internal errors are reserved for unrecoverable server-side failures.
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
