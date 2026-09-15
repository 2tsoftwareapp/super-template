import { describe, expect, it, vi } from "vitest";

import { SYSTEM_SCOPE } from "@repo/api-kernel";
import { USER_ERROR_CODES, type UpdateUserInput } from "@repo/feature-users/contracts";

import { UpdateProfileUseCase } from "../update-profile.use-case";

const USER_ID = "user-1";

const userRecord = {
  id: USER_ID,
  email: "user@example.com",
  passwordHash: "hash",
  displayName: "User",
  avatarUrl: "https://cdn.example.com/old.png",
  avatarFileId: "file-old",
  status: "ACTIVE" as const,
  emailVerifiedAt: null,
  mustChangePassword: false,
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const requestContext = { requestId: "req-1", ipAddress: "203.0.113.10", userAgent: "vitest" };

const userProfile = { id: USER_ID, displayName: "User" };

function buildUseCase(
  options: {
    user?: typeof userRecord | null;
    avatarFile?: { uploadedById: string | null } | null;
  } = {},
) {
  const user = options.user === undefined ? userRecord : options.user;

  const usersRepository = {
    findById: vi.fn(async () => user),
    update: vi.fn(async (_userId: string, values: UpdateUserInput) => ({
      ...userRecord,
      ...values,
    })),
  };
  const fileLookup = {
    findById: vi.fn(async () =>
      options.avatarFile === undefined ? { uploadedById: USER_ID } : options.avatarFile,
    ),
  };
  const auditWriter = { log: vi.fn(async () => undefined) };
  const getUserUseCase = { execute: vi.fn(async () => userProfile) };

  return {
    usersRepository,
    fileLookup,
    auditWriter,
    getUserUseCase,
    useCase: new UpdateProfileUseCase(
      usersRepository as never,
      fileLookup as never,
      auditWriter as never,
      getUserUseCase as never,
    ),
  };
}

describe("UpdateProfileUseCase", () => {
  it("updates the profile and returns the refreshed user view", async () => {
    const deps = buildUseCase();

    await expect(
      deps.useCase.execute(USER_ID, { displayName: "Renamed" }, requestContext),
    ).resolves.toBe(userProfile);

    expect(deps.usersRepository.update).toHaveBeenCalledWith(USER_ID, {
      displayName: "Renamed",
      avatarUrl: userRecord.avatarUrl,
      avatarFileId: userRecord.avatarFileId,
    });
    expect(deps.auditWriter.log).toHaveBeenCalledWith({
      actorId: USER_ID,
      action: "user.profile.updated",
      entityType: "user",
      entityId: USER_ID,
      requestContext,
      scope: SYSTEM_SCOPE.PLATFORM,
    });
    expect(deps.getUserUseCase.execute).toHaveBeenCalledWith(USER_ID);
  });

  it("keeps the stored values for fields that were not submitted", async () => {
    const deps = buildUseCase();

    await deps.useCase.execute(USER_ID, { avatarUrl: "https://cdn.example.com/new.png" });

    expect(deps.usersRepository.update).toHaveBeenCalledWith(USER_ID, {
      displayName: userRecord.displayName,
      avatarUrl: "https://cdn.example.com/new.png",
      avatarFileId: userRecord.avatarFileId,
    });
    expect(deps.fileLookup.findById).not.toHaveBeenCalled();
  });

  it("clears the avatar fields when they are submitted as null", async () => {
    const deps = buildUseCase();

    await deps.useCase.execute(USER_ID, { avatarUrl: null, avatarFileId: null });

    expect(deps.usersRepository.update).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ avatarUrl: null, avatarFileId: null }),
    );
    expect(deps.fileLookup.findById).not.toHaveBeenCalled();
  });

  it("accepts an avatar file uploaded by the same user", async () => {
    const deps = buildUseCase({ avatarFile: { uploadedById: USER_ID } });

    await deps.useCase.execute(USER_ID, { avatarFileId: "file-new" });

    expect(deps.fileLookup.findById).toHaveBeenCalledWith("file-new");
    expect(deps.usersRepository.update).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ avatarFileId: "file-new" }),
    );
  });

  it("rejects an avatar file uploaded by another user", async () => {
    const deps = buildUseCase({ avatarFile: { uploadedById: "user-other" } });

    await expect(
      deps.useCase.execute(USER_ID, { avatarFileId: "file-other" }),
    ).rejects.toMatchObject({ code: "FILE_NOT_FOUND", statusCode: 404 });
    expect(deps.usersRepository.update).not.toHaveBeenCalled();
    expect(deps.auditWriter.log).not.toHaveBeenCalled();
  });

  it("rejects an avatar file that does not exist", async () => {
    const deps = buildUseCase({ avatarFile: null });

    await expect(
      deps.useCase.execute(USER_ID, { avatarFileId: "file-missing" }),
    ).rejects.toMatchObject({ code: "FILE_NOT_FOUND", statusCode: 404 });
    expect(deps.usersRepository.update).not.toHaveBeenCalled();
  });

  it("reports a missing user as NOT_FOUND before touching the avatar file", async () => {
    const deps = buildUseCase({ user: null });

    await expect(
      deps.useCase.execute(USER_ID, { displayName: "Renamed", avatarFileId: "file-new" }),
    ).rejects.toMatchObject({ code: USER_ERROR_CODES.USER_NOT_FOUND, statusCode: 404 });
    expect(deps.fileLookup.findById).not.toHaveBeenCalled();
    expect(deps.usersRepository.update).not.toHaveBeenCalled();
  });
});
