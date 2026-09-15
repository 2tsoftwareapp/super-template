import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "@repo/api-runtime";
import { NOTIFICATION_ERROR_CODES } from "@repo/feature-notifications/contracts";

import { NotificationDeviceUseCase } from "../notification-device.use-case";

const user = {
  userId: "user-1",
  sessionId: "session-1",
  email: "user@example.local",
  displayName: "User",
  status: "ACTIVE",
  roles: ["USER"],
  permissions: [],
  organizationId: "org-1",
} as AuthenticatedRequestUser;

const tokenRecord = {
  id: "token-row-1",
  userId: "user-1",
  token: "APA91bExample",
  platform: "IOS",
  lastUsedAt: new Date("2026-09-15T00:00:00.000Z"),
  disabledAt: null,
  disabledReason: null,
  updatedAt: new Date("2026-09-15T00:00:00.000Z"),
  createdAt: new Date("2026-09-15T00:00:00.000Z"),
};

function buildUseCase() {
  const deviceTokensRepository = {
    registerOrTransfer: vi.fn(async () => ({
      token: tokenRecord,
      created: true,
      transferred: false,
    })),
    disableByToken: vi.fn(async () => tokenRecord),
  };

  return {
    deviceTokensRepository,
    useCase: new NotificationDeviceUseCase(deviceTokensRepository as never),
  };
}

describe("NotificationDeviceUseCase.registerDevice", () => {
  it("registers the token for the caller and returns the device view", async () => {
    const { useCase, deviceTokensRepository } = buildUseCase();

    await expect(
      useCase.registerDevice(user, { token: "APA91bExample", platform: "IOS" }),
    ).resolves.toEqual({
      id: "token-row-1",
      platform: "IOS",
      token: "APA91bExample",
      lastUsedAt: "2026-09-15T00:00:00.000Z",
    });

    expect(deviceTokensRepository.registerOrTransfer).toHaveBeenCalledWith({
      userId: "user-1",
      token: "APA91bExample",
      platform: "IOS",
    });
  });

  it("reports a 409 when the token is locked by an in-flight delivery", async () => {
    const { useCase, deviceTokensRepository } = buildUseCase();
    deviceTokensRepository.registerOrTransfer.mockResolvedValue(null as never);

    // `null` means the advisory lock was unavailable: the delivery processor is
    // mid-send for this token, so the client should retry rather than assume
    // the registration failed permanently.
    await expect(
      useCase.registerDevice(user, { token: "APA91bExample", platform: "IOS" }),
    ).rejects.toMatchObject({ code: ERROR_CODES.RESOURCE_CONFLICT, statusCode: 409 });
  });

  it("surfaces a transfer of the same token from another account as the caller's device", async () => {
    const { useCase, deviceTokensRepository } = buildUseCase();
    // The repository owns the stored row: transfer yields a new id for the new owner.
    deviceTokensRepository.registerOrTransfer.mockResolvedValue({
      token: { ...tokenRecord, id: "token-row-2", userId: "user-1", platform: "ANDROID" },
      created: true,
      transferred: true,
    } as never);

    await expect(
      useCase.registerDevice(user, { token: "APA91bExample", platform: "ANDROID" }),
    ).resolves.toMatchObject({ id: "token-row-2", platform: "ANDROID" });

    expect(deviceTokensRepository.registerOrTransfer).toHaveBeenCalledWith({
      userId: "user-1",
      token: "APA91bExample",
      platform: "ANDROID",
    });
  });
});

describe("NotificationDeviceUseCase.unregisterDevice", () => {
  it("disables the caller's token with a recorded reason", async () => {
    const { useCase, deviceTokensRepository } = buildUseCase();

    await expect(useCase.unregisterDevice(user, "APA91bExample")).resolves.toBeUndefined();

    expect(deviceTokensRepository.disableByToken).toHaveBeenCalledWith(
      "user-1",
      "APA91bExample",
      "User unregistered device",
    );
  });

  it("reports a token the caller does not own as not found", async () => {
    const { useCase, deviceTokensRepository } = buildUseCase();
    deviceTokensRepository.disableByToken.mockResolvedValue(null as never);

    await expect(useCase.unregisterDevice(user, "someone-elses")).rejects.toMatchObject({
      code: NOTIFICATION_ERROR_CODES.NOTIFICATION_DEVICE_NOT_FOUND,
      statusCode: 404,
    });
  });
});
