import { describe, expect, it, vi } from "vitest";

import type { JsonObject } from "@repo/api-kernel";

import { PreferencesLookupAdapter } from "../preferences-lookup.adapter";

const buildAdapter = (options: {
  notificationPreferences?: JsonObject | null;
  userByEmail?: { id: string } | null;
}) => {
  const preferencesRepository = {
    findByUserId: vi.fn(async () =>
      options.notificationPreferences === null
        ? null
        : { notificationPreferences: options.notificationPreferences },
    ),
  };
  const usersRepository = {
    findByEmail: vi.fn(async () => options.userByEmail ?? null),
  };

  return {
    adapter: new PreferencesLookupAdapter(preferencesRepository as never, usersRepository as never),
    preferencesRepository,
    usersRepository,
  };
};

describe("PreferencesLookupAdapter", () => {
  it("falls back to default-on channels when the user has no preferences row", async () => {
    const { adapter } = buildAdapter({ notificationPreferences: null });

    await expect(adapter.findNotificationPreferencesByUserId("user-1")).resolves.toEqual({
      email: true,
      push: true,
    });
  });

  it("reads channel opt-outs from the stored jsonb", async () => {
    const { adapter } = buildAdapter({
      notificationPreferences: { email: false } as JsonObject,
    });

    await expect(adapter.findNotificationPreferencesByUserId("user-1")).resolves.toEqual({
      email: false,
      push: true,
    });
  });

  it("keeps non-boolean stored values enabled (default-on compatibility)", async () => {
    const { adapter } = buildAdapter({
      notificationPreferences: { email: "no", push: 0 } as JsonObject,
    });

    await expect(adapter.findNotificationPreferencesByUserId("user-1")).resolves.toEqual({
      email: true,
      push: true,
    });
  });

  it("resolves by email through the users repository", async () => {
    const { adapter, usersRepository, preferencesRepository } = buildAdapter({
      notificationPreferences: { push: false } as JsonObject,
      userByEmail: { id: "user-1" },
    });

    await expect(
      adapter.findNotificationPreferencesByEmail("someone@example.test"),
    ).resolves.toEqual({ email: true, push: false });

    expect(usersRepository.findByEmail).toHaveBeenCalledWith("someone@example.test");
    expect(preferencesRepository.findByUserId).toHaveBeenCalledWith("user-1");
  });

  it("returns null when no user matches the email", async () => {
    const { adapter, preferencesRepository } = buildAdapter({
      userByEmail: null,
    });

    await expect(
      adapter.findNotificationPreferencesByEmail("ghost@example.test"),
    ).resolves.toBeNull();
    expect(preferencesRepository.findByUserId).not.toHaveBeenCalled();
  });
});
