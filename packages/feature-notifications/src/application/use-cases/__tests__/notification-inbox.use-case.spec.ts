import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { NOTIFICATION_ERROR_CODES } from "@repo/feature-notifications/contracts";

import { NotificationsMapper } from "../../notifications.mapper";
import { NotificationInboxUseCase } from "../notification-inbox.use-case";

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

const row = {
  id: "notification-1",
  userId: "user-1",
  organizationId: "org-1",
  type: "TEST",
  title: "Title",
  body: "Body",
  data: null,
  readAt: null,
  createdAt: new Date("2026-09-15T00:00:00.000Z"),
};

function buildUseCase() {
  const notificationsRepository = {
    listForUser: vi.fn(async () => ({ rows: [row], total: 1 })),
    getUnreadCount: vi.fn(async () => 3),
    findById: vi.fn(async () => row),
    markRead: vi.fn(async () => ({ ...row, readAt: new Date("2026-09-16T00:00:00.000Z") })),
    markAllRead: vi.fn(async () => undefined),
    delete: vi.fn(async () => row),
  };

  return {
    notificationsRepository,
    useCase: new NotificationInboxUseCase(
      notificationsRepository as never,
      new NotificationsMapper(),
    ),
  };
}

describe("NotificationInboxUseCase.listForUser", () => {
  it("scopes the inbox to the caller's active organization", async () => {
    const { useCase, notificationsRepository } = buildUseCase();
    const query = { page: 1, limit: 20, unread: true };

    const result = await useCase.listForUser(user, query);

    expect(notificationsRepository.listForUser).toHaveBeenCalledWith("user-1", "org-1", query);
    expect(result.total).toBe(1);
    expect(result.rows[0]).toMatchObject({ id: "notification-1", readAt: null });
  });

  it("refuses to list without an active organization", async () => {
    const { useCase, notificationsRepository } = buildUseCase();

    await expect(
      useCase.listForUser({ ...user, organizationId: null }, { page: 1, limit: 20 }),
    ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN" });

    expect(notificationsRepository.listForUser).not.toHaveBeenCalled();
  });
});

describe("NotificationInboxUseCase.unreadCount", () => {
  it("counts unread rows inside the caller's organization", async () => {
    const { useCase, notificationsRepository } = buildUseCase();

    await expect(useCase.unreadCount(user)).resolves.toBe(3);
    expect(notificationsRepository.getUnreadCount).toHaveBeenCalledWith("user-1", "org-1");
  });

  it("refuses to count without an active organization", async () => {
    const { useCase, notificationsRepository } = buildUseCase();

    await expect(useCase.unreadCount({ ...user, organizationId: null })).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN",
    });
    expect(notificationsRepository.getUnreadCount).not.toHaveBeenCalled();
  });
});

describe("NotificationInboxUseCase.markRead", () => {
  it("marks the caller's own notification read", async () => {
    const { useCase, notificationsRepository } = buildUseCase();

    await expect(useCase.markRead(user, "notification-1")).resolves.toMatchObject({
      id: "notification-1",
      readAt: "2026-09-16T00:00:00.000Z",
    });

    expect(notificationsRepository.findById).toHaveBeenCalledWith("notification-1", "org-1");
    expect(notificationsRepository.markRead).toHaveBeenCalledWith(
      "notification-1",
      "user-1",
      "org-1",
    );
  });

  it("reports another user's notification as not found instead of marking it", async () => {
    const { useCase, notificationsRepository } = buildUseCase();
    notificationsRepository.findById.mockResolvedValue({ ...row, userId: "user-2" } as never);

    // T-003: the org-scoped read is not enough — ownership is re-checked.
    await expect(useCase.markRead(user, "notification-1")).rejects.toMatchObject({
      code: NOTIFICATION_ERROR_CODES.NOTIFICATION_NOT_FOUND,
      statusCode: 404,
    });
    expect(notificationsRepository.markRead).not.toHaveBeenCalled();
  });

  it("reports a notification outside the organization as not found", async () => {
    const { useCase, notificationsRepository } = buildUseCase();
    notificationsRepository.findById.mockResolvedValue(null as never);

    await expect(useCase.markRead(user, "notification-1")).rejects.toMatchObject({
      code: NOTIFICATION_ERROR_CODES.NOTIFICATION_NOT_FOUND,
    });
  });

  it("falls back to the loaded row when the conditional update matches nothing", async () => {
    const { useCase, notificationsRepository } = buildUseCase();
    notificationsRepository.markRead.mockResolvedValue(null as never);

    await expect(useCase.markRead(user, "notification-1")).resolves.toMatchObject({
      id: "notification-1",
    });
  });

  it("refuses to mark read without an active organization", async () => {
    const { useCase, notificationsRepository } = buildUseCase();

    await expect(
      useCase.markRead({ ...user, organizationId: null }, "notification-1"),
    ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN" });
    expect(notificationsRepository.findById).not.toHaveBeenCalled();
  });
});

describe("NotificationInboxUseCase.markAllRead", () => {
  it("marks every unread row in the caller's organization", async () => {
    const { useCase, notificationsRepository } = buildUseCase();

    await useCase.markAllRead(user);

    expect(notificationsRepository.markAllRead).toHaveBeenCalledWith("user-1", "org-1");
  });
});

describe("NotificationInboxUseCase.delete", () => {
  it("deletes the caller's own notification", async () => {
    const { useCase, notificationsRepository } = buildUseCase();

    await useCase.delete(user, "notification-1");

    expect(notificationsRepository.delete).toHaveBeenCalledWith(
      "notification-1",
      "user-1",
      "org-1",
    );
  });

  it("refuses to delete another user's notification", async () => {
    const { useCase, notificationsRepository } = buildUseCase();
    notificationsRepository.findById.mockResolvedValue({ ...row, userId: "user-2" } as never);

    await expect(useCase.delete(user, "notification-1")).rejects.toMatchObject({
      code: NOTIFICATION_ERROR_CODES.NOTIFICATION_NOT_FOUND,
      statusCode: 404,
    });
    expect(notificationsRepository.delete).not.toHaveBeenCalled();
  });

  it("refuses to delete a notification outside the organization", async () => {
    const { useCase, notificationsRepository } = buildUseCase();
    notificationsRepository.findById.mockResolvedValue(null as never);

    await expect(useCase.delete(user, "notification-1")).rejects.toMatchObject({
      code: NOTIFICATION_ERROR_CODES.NOTIFICATION_NOT_FOUND,
    });
    expect(notificationsRepository.delete).not.toHaveBeenCalled();
  });
});
