import { describe, expect, it } from "vitest";

import { resolveNotificationChannelPreferences } from "../notification-preferences.policy";

describe("resolveNotificationChannelPreferences (compatibility: default-on)", () => {
  it("treats a missing value as every channel enabled", () => {
    expect(resolveNotificationChannelPreferences(undefined)).toEqual({ email: true, push: true });
    expect(resolveNotificationChannelPreferences(null)).toEqual({ email: true, push: true });
  });

  it("treats an empty object as every channel enabled", () => {
    expect(resolveNotificationChannelPreferences({})).toEqual({ email: true, push: true });
  });

  it("opts a channel out only for an explicit false", () => {
    expect(resolveNotificationChannelPreferences({ email: false })).toEqual({
      email: false,
      push: true,
    });
    expect(resolveNotificationChannelPreferences({ push: false })).toEqual({
      email: true,
      push: false,
    });
    expect(resolveNotificationChannelPreferences({ email: false, push: false })).toEqual({
      email: false,
      push: false,
    });
  });

  it("keeps non-boolean values enabled (existing rows rely on this)", () => {
    expect(resolveNotificationChannelPreferences({ email: "no" })).toEqual({
      email: true,
      push: true,
    });
    expect(resolveNotificationChannelPreferences({ push: 0 })).toEqual({
      email: true,
      push: true,
    });
  });

  it("passes explicit true through", () => {
    expect(resolveNotificationChannelPreferences({ email: true, push: true })).toEqual({
      email: true,
      push: true,
    });
  });
});
