import { describe, expect, it } from "vitest";

import { SETTINGS_ERROR_CODES } from "@repo/feature-settings/contracts";

import {
  SETTING_DEFINITIONS,
  getSettingDefinition,
  listSettingDefaults,
} from "../setting-definitions";

describe("SETTING_DEFINITIONS registry", () => {
  it("keeps each definition's key in sync with its registry property", () => {
    for (const [propertyName, definition] of Object.entries(SETTING_DEFINITIONS)) {
      expect(definition.key).toBe(propertyName);
    }
  });

  it("exposes the defaults the seeder has always written", () => {
    // Guards the historical seed values: registration default-on, maintenance default-off.
    expect(listSettingDefaults()).toEqual([
      { key: "registration_enabled", value: { enabled: true } },
      { key: "maintenance_mode", value: { enabled: false, message: null } },
    ]);
  });

  it("parses its own defaults to the documented flags", () => {
    expect(SETTING_DEFINITIONS.registration_enabled.parse({ enabled: true })).toBe(true);
    expect(SETTING_DEFINITIONS.maintenance_mode.parse({ enabled: false })).toBe(false);
    // Missing row → the lookup falls back to parse(defaultValue).
    expect(SETTING_DEFINITIONS.registration_enabled.parse(undefined)).toBe(false);
  });

  describe("validate", () => {
    it("accepts valid values for known keys", () => {
      expect(() =>
        SETTING_DEFINITIONS.registration_enabled.validate({ enabled: true }),
      ).not.toThrow();
      // The admin API sends maintenance_mode without the optional message field.
      expect(() => SETTING_DEFINITIONS.maintenance_mode.validate({ enabled: true })).not.toThrow();
      expect(() =>
        SETTING_DEFINITIONS.maintenance_mode.validate({ enabled: true, message: "back soon" }),
      ).not.toThrow();
      expect(() =>
        SETTING_DEFINITIONS.maintenance_mode.validate({ enabled: true, message: null }),
      ).not.toThrow();
    });

    it("rejects a non-boolean enabled flag with SETTINGS_INVALID_VALUE", () => {
      expect(() =>
        SETTING_DEFINITIONS.registration_enabled.validate({ enabled: "yes" }),
      ).toThrowError(
        expect.objectContaining({ code: SETTINGS_ERROR_CODES.SETTINGS_INVALID_VALUE }),
      );
      expect(() => SETTING_DEFINITIONS.maintenance_mode.validate({ enabled: 1 })).toThrowError(
        expect.objectContaining({ code: SETTINGS_ERROR_CODES.SETTINGS_INVALID_VALUE }),
      );
    });

    it("rejects a missing enabled flag", () => {
      expect(() => SETTING_DEFINITIONS.registration_enabled.validate({})).toThrowError(
        expect.objectContaining({ code: SETTINGS_ERROR_CODES.SETTINGS_INVALID_VALUE }),
      );
    });

    it("rejects a non-string maintenance message", () => {
      expect(() =>
        SETTING_DEFINITIONS.maintenance_mode.validate({ enabled: true, message: 42 }),
      ).toThrowError(
        expect.objectContaining({ code: SETTINGS_ERROR_CODES.SETTINGS_INVALID_VALUE }),
      );
    });
  });

  it("resolves definitions by key and returns undefined for unknown keys", () => {
    expect(getSettingDefinition("maintenance_mode")).toBe(SETTING_DEFINITIONS.maintenance_mode);
    expect(getSettingDefinition("feature.flag")).toBeUndefined();
  });
});
