import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "@repo/api-runtime";

import { NotificationsMapper } from "../../notifications.mapper";
import { SendNotificationUseCase } from "../send-notification.use-case";

const actor = {
  userId: "admin-1",
  sessionId: "session-1",
  email: "admin@example.local",
  displayName: "Admin",
  status: "ACTIVE",
  roles: ["ADMIN"],
  permissions: [],
  organizationId: "org-1",
} as AuthenticatedRequestUser;

const created = {
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
    create: vi.fn(async () => created),
    findBySourceBackgroundJobId: vi.fn(async () => null),
  };
  const organizationLookup = { findPrimaryOrganizationId: vi.fn(async () => "org-1") };
  const dispatchService = {
    upsertDeliveriesForNotification: vi.fn(async () => undefined),
    emitSSE: vi.fn(),
  };
  const auditWriter = { log: vi.fn(async () => undefined) };
  const transactionPort = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn("tx")),
  };

  return {
    notificationsRepository,
    organizationLookup,
    dispatchService,
    auditWriter,
    transactionPort,
    useCase: new SendNotificationUseCase(
      notificationsRepository as never,
      organizationLookup as never,
      dispatchService as never,
      auditWriter as never,
      transactionPort as never,
      new NotificationsMapper(),
    ),
  };
}

const command = { userId: "user-1", type: "TEST", title: "Title", body: "Body" };

describe("SendNotificationUseCase", () => {
  it("persists, audits, upserts deliveries and emits SSE for a new notification", async () => {
    const { useCase, notificationsRepository, dispatchService, auditWriter, transactionPort } =
      buildUseCase();

    await expect(useCase.execute(actor, command)).resolves.toMatchObject({
      id: "notification-1",
      readAt: null,
      createdAt: "2026-09-15T00:00:00.000Z",
    });

    expect(transactionPort.run).toHaveBeenCalledTimes(1);
    expect(notificationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", userId: "user-1" }),
      "tx",
    );
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "notification.sent", entityId: "notification-1" }),
      "tx",
    );
    // Delivery rows are upserted in the same transaction (T-002), so a crash
    // after commit cannot leave a notification with no deliveries.
    expect(dispatchService.upsertDeliveriesForNotification).toHaveBeenCalledWith(
      expect.objectContaining({ id: "notification-1" }),
      "tx",
    );
    expect(dispatchService.emitSSE).toHaveBeenCalledWith(
      expect.objectContaining({ id: "notification-1" }),
      "org-1",
    );
  });

  it("resolves the recipient's primary organization when none is given", async () => {
    const { useCase, organizationLookup, notificationsRepository } = buildUseCase();
    organizationLookup.findPrimaryOrganizationId.mockResolvedValue("org-recipient" as never);

    await useCase.execute(null, command);

    expect(organizationLookup.findPrimaryOrganizationId).toHaveBeenCalledWith("user-1", undefined);
    expect(notificationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-recipient" }),
      "tx",
    );
  });

  it("prefers an explicit organizationId over the recipient's primary organization", async () => {
    const { useCase, organizationLookup, notificationsRepository } = buildUseCase();
    organizationLookup.findPrimaryOrganizationId.mockResolvedValue("org-recipient" as never);

    await useCase.execute(actor, { ...command, organizationId: "org-explicit" });

    expect(notificationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-explicit" }),
      "tx",
    );
  });

  it("refuses to send when no organization can be resolved", async () => {
    const { useCase, notificationsRepository, transactionPort } = buildUseCase();

    // No explicit organization, no recipient, no actor organization.
    await expect(
      useCase.execute(null, { ...command, userId: undefined } as never),
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED });

    expect(transactionPort.run).not.toHaveBeenCalled();
    expect(notificationsRepository.create).not.toHaveBeenCalled();
  });

  it("replays an existing notification for a repeated background-job source without emitting SSE", async () => {
    const { useCase, notificationsRepository, dispatchService, auditWriter } = buildUseCase();
    notificationsRepository.create.mockResolvedValue(null as never);
    notificationsRepository.findBySourceBackgroundJobId.mockResolvedValue({
      ...created,
      id: "notification-existing",
    } as never);

    await expect(
      useCase.execute(actor, { ...command, sourceBackgroundJobId: "bg-1" }),
    ).resolves.toMatchObject({ id: "notification-existing" });

    expect(notificationsRepository.findBySourceBackgroundJobId).toHaveBeenCalledWith("bg-1", "tx");
    // M-001: an idempotent replay must not re-audit or re-emit live events.
    expect(auditWriter.log).not.toHaveBeenCalled();
    expect(dispatchService.emitSSE).not.toHaveBeenCalled();
  });

  it("suppresses SSE when the caller defers dispatch for a background handler", async () => {
    const { useCase, dispatchService } = buildUseCase();

    await useCase.execute(actor, command, undefined, undefined, { deferDispatch: true });

    expect(dispatchService.emitSSE).not.toHaveBeenCalled();
    expect(dispatchService.upsertDeliveriesForNotification).toHaveBeenCalledTimes(1);
  });

  it("throws when the insert returns no rows and no background-job row exists", async () => {
    const { useCase, notificationsRepository } = buildUseCase();
    notificationsRepository.create.mockResolvedValue(null as never);

    await expect(useCase.execute(actor, command)).rejects.toThrow(
      "Notification insert returned no rows",
    );
  });
});
