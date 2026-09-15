/**
 * Settings error codes moved to kernel level (see
 * `@repo/api-kernel` feature-error-codes) so other features can raise them
 * without a package dependency on @repo/feature-settings. Re-exported here to
 * keep the public contract of this package stable.
 */
export { SETTINGS_ERROR_CODES } from "@repo/api-kernel";
