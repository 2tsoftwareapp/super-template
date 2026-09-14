import type { JsonObject } from "@repo/api-kernel";

import { HttpStatus } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { SETTINGS_ERROR_CODES } from "@repo/feature-settings/contracts";

/**
 * Per-key registry for application settings: the single source of truth for
 * each key's default value, its read interpretation, and its write validation.
 *
 * Consumers:
 * - EnsureSettingsSeedDataUseCase — seeds `defaultValue` for absent rows.
 * - ApplicationSettingsLookupService — reads through `parse` and falls back to
 *   `parse(defaultValue)` when the row is missing (so seed and lookup can never
 *   disagree on the default).
 * - UpdateSettingUseCase — calls `validate` before writing, so a malformed
 *   value is rejected with SETTINGS_INVALID_VALUE instead of silently falling
 *   back to the safe default on the next read.
 *
 * Keys are the `m_application_settings.key` values. Settings that are not in
 * the registry stay free-form JsonObject (extension point for template users);
 * they are simply not validated.
 */
export interface SettingDefinition {
  /** The settings row key; must match the registry property name. */
  key: string;
  /** Operator-facing explanation of what the toggle does. */
  description: string;
  /** Written by the seeder when the row is absent; also the lookup fallback. */
  defaultValue: JsonObject;
  /**
   * Tolerant read used by lookups: interpret a stored value for consumers.
   * Malformed values degrade to the safe default (`false`) instead of throwing,
   * because a bad row must not break request handling.
   */
  parse(value: JsonObject | undefined): boolean;
  /**
   * Strict gate for writes: throw AppError(SETTINGS_INVALID_VALUE) when the
   * value does not match this key's shape.
   */
  validate(value: JsonObject): void;
}

function readEnabledFlag(value: JsonObject | undefined): boolean {
  const enabled = value?.enabled;

  return typeof enabled === "boolean" ? enabled : false;
}

function assertEnabledFlag(key: string, value: JsonObject): void {
  if (typeof value.enabled !== "boolean") {
    throw new AppError(
      SETTINGS_ERROR_CODES.SETTINGS_INVALID_VALUE,
      `Setting "${key}" requires a boolean "enabled" field`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

function assertOptionalMessage(key: string, value: JsonObject): void {
  const message = value.message;

  if (message !== undefined && message !== null && typeof message !== "string") {
    throw new AppError(
      SETTINGS_ERROR_CODES.SETTINGS_INVALID_VALUE,
      `Setting "${key}" allows only a string or null "message" field`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export const SETTING_DEFINITIONS = {
  registration_enabled: {
    key: "registration_enabled",
    description: "Whether new users may self-register through the public sign-up endpoint.",
    defaultValue: { enabled: true },
    parse: readEnabledFlag,
    validate: (value: JsonObject) => assertEnabledFlag("registration_enabled", value),
  },
  maintenance_mode: {
    key: "maintenance_mode",
    description:
      "Platform-wide kill switch: when enabled, non-exempt requests answer 503 until disabled.",
    defaultValue: { enabled: false, message: null },
    parse: readEnabledFlag,
    validate: (value: JsonObject) => {
      assertEnabledFlag("maintenance_mode", value);
      assertOptionalMessage("maintenance_mode", value);
    },
  },
} as const satisfies Record<string, SettingDefinition>;

export type SettingKey = keyof typeof SETTING_DEFINITIONS;

/** Look up a definition; unknown keys (template extensions) return undefined. */
export function getSettingDefinition(key: string): SettingDefinition | undefined {
  return (SETTING_DEFINITIONS as Record<string, SettingDefinition | undefined>)[key];
}

/** Seed/tests entry point: every registry default keyed by its setting key. */
export function listSettingDefaults(): { key: string; value: JsonObject }[] {
  return Object.values(SETTING_DEFINITIONS).map((definition) => ({
    key: definition.key,
    value: definition.defaultValue,
  }));
}
