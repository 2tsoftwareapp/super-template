import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationsMapper } from "../notifications.mapper";
import { NotificationDeliveryUseCase } from "../use-cases/notification-delivery.use-case";

describe("NotificationDeliveryUseCase - scope & idempotency", () => {
  const mockUserLookup = {
    findActiveUserInOrganization: vi.fn(),
    filterActiveUserIdsInOrganization: vi.fn(),
    listDeliverableUserIdsInOrganization: vi.fn(),
  };

  const mockJobsRepository = {
    claimDue: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
    markProcessing: vi.fn(),
    markCancelled: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    createIdempotent: vi.fn(),
  };

  const mockTransactionPort = {
    run: vi.fn(async <T>(fn: (tx: unknown) => Promise<T>) => fn("tx")),
  };

  const mockNotificationsRepository = {
    createManyIdempotent: vi.fn(),
  };

  const mockDispatchService = {
    dispatch: vi.fn(),
    emitSSE: vi.fn(),
    upsertDeliveriesForNotification: vi.fn(),
  };

  const mockAuditWriter = { log: vi.fn() };

  const mockTenantContextService = {
    runAsync: vi.fn(async (_ctx: unknown, fn: () => Promise<unknown>) => fn()),
  };

  function createUseCase() {
    return new NotificationDeliveryUseCase(
      mockJobsRepository as never,
      mockNotificationsRepository as never,
      mockTenantContextService as never,
      mockUserLookup as never,
      mockDispatchService as never,
      new NotificationsMapper(),
      mockAuditWriter as never,
      mockTransactionPort as never,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveRecipientIds", () => {
    it("returns empty array for target user not in organization", async () => {
      mockUserLookup.findActiveUserInOrganization.mockResolvedValue(null);
      const useCase = createUseCase();
      const result = await useCase.resolveRecipientIds({
        audience: "USER",
        targetUserId: "user-outside-org",
        organizationId: "org-a",
      } as never);
      expect(result).toEqual([]);
    });

    it("returns only org members for USERS audience", async () => {
      mockUserLookup.filterActiveUserIdsInOrganization.mockResolvedValue(["user-in-org"]);
      const useCase = createUseCase();
      const result = await useCase.resolveRecipientIds({
        audience: "USERS",
        userIds: ["user-in-org", "user-outside-org"],
        organizationId: "org-a",
      } as never);
      expect(result).toEqual(["user-in-org"]);
    });

    it("returns deliverable users in org for ALL audience", async () => {
      mockUserLookup.listDeliverableUserIdsInOrganization.mockResolvedValue(["user-a", "user-b"]);
      const useCase = createUseCase();
      const result = await useCase.resolveRecipientIds({
        audience: "ALL",
        organizationId: "org-a",
      } as never);
      expect(result).toEqual(["user-a", "user-b"]);
    });
  });

  describe("idempotency (sourceJobId conflict)", () => {
    const claimedJob = (attempts = 1) => ({
      id: "job-1",
      organizationId: "org-a",
      audience: "ALL" as const,
      type: "test",
      title: "Test",
      body: "Body",
      data: null,
      status: "PROCESSING" as const,
      scheduledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      actorId: null,
      targetUserId: null,
      userIds: null,
      recipientCount: null,
      processedAt: null,
      errorMessage: null,
      idempotencyKey: null,
      attempts,
    });

    // Shaped like a persisted inbox row — the real mapper needs createdAt/readAt.
    const inboxRow = () => ({
      id: "n-1",
      userId: "user-a",
      organizationId: "org-a",
      type: "test",
      title: "Test",
      body: "Body",
      data: null,
      readAt: null,
      createdAt: new Date(),
    });

    it("processing the same delivery twice yields exactly one inbox row per recipient", async () => {
      // Attempt 1 creates the row; attempt 2 replays the stored row (the
      // (sourceJobId, userId) unique index absorbed it).
      mockNotificationsRepository.createManyIdempotent
        .mockResolvedValueOnce([inboxRow()])
        .mockResolvedValueOnce([inboxRow()]);
      mockJobsRepository.markProcessing
        .mockResolvedValueOnce(claimedJob(1))
        .mockResolvedValueOnce(claimedJob(2));
      mockJobsRepository.markCompleted.mockResolvedValue(null);
      mockUserLookup.listDeliverableUserIdsInOrganization.mockResolvedValue(["user-a"]);

      const useCase = createUseCase();
      await useCase.processJob("job-1");
      await useCase.processJob("job-1");

      expect(mockNotificationsRepository.createManyIdempotent).toHaveBeenCalledTimes(2);
      expect(mockNotificationsRepository.createManyIdempotent).toHaveBeenCalledWith(
        "job-1",
        [expect.objectContaining({ userId: "user-a", organizationId: "org-a" })],
        "tx",
      );
      // One delivery row per unique notification per attempt — never duplicated.
      expect(mockDispatchService.upsertDeliveriesForNotification).toHaveBeenCalledTimes(2);
      expect(
        mockDispatchService.upsertDeliveriesForNotification.mock.calls.every(
          (call) => (call[0] as { id: string }).id === "n-1",
        ),
      ).toBe(true);
      expect(mockJobsRepository.markCompleted).toHaveBeenNthCalledWith(1, "job-1", 1, 1, "tx");
      expect(mockJobsRepository.markCompleted).toHaveBeenNthCalledWith(2, "job-1", 1, 2, "tx");
    });

    it("retries after a mid-delivery failure without duplicating notifications", async () => {
      mockNotificationsRepository.createManyIdempotent.mockResolvedValue([inboxRow()]);
      mockJobsRepository.markProcessing
        .mockResolvedValueOnce(claimedJob(1))
        .mockResolvedValueOnce(claimedJob(2));
      mockJobsRepository.markFailed.mockResolvedValue(null);
      mockJobsRepository.markCompleted.mockResolvedValue(null);
      mockUserLookup.listDeliverableUserIdsInOrganization.mockResolvedValue(["user-a"]);
      mockDispatchService.upsertDeliveriesForNotification
        .mockRejectedValueOnce(new Error("storage unavailable"))
        .mockResolvedValueOnce(undefined);

      const useCase = createUseCase();
      await useCase.processJob("job-1"); // fails after the inbox row exists
      await useCase.processJob("job-1"); // retry must converge, not duplicate

      expect(mockJobsRepository.markFailed).toHaveBeenCalledTimes(1);
      expect(mockJobsRepository.markCompleted).toHaveBeenCalledTimes(1);
      expect(mockJobsRepository.markCompleted).toHaveBeenCalledWith("job-1", 1, 2, "tx");
      // One delivery upsert per attempt for the single notification — the
      // replayed inbox row is upserted once, not re-created.
      expect(mockDispatchService.upsertDeliveriesForNotification).toHaveBeenCalledTimes(2);
      expect(
        mockDispatchService.upsertDeliveriesForNotification.mock.calls.every(
          (call) => (call[0] as { id: string }).id === "n-1",
        ),
      ).toBe(true);
    });
  });

  describe("idempotency (job creation replay)", () => {
    it("returns the stored job without audit or processing side effects when the idempotency key replays", async () => {
      const now = new Date();
      mockUserLookup.findActiveUserInOrganization.mockResolvedValue({ id: "user-a" });
      mockJobsRepository.createIdempotent.mockResolvedValue({
        value: {
          id: "job-9",
          organizationId: "org-a",
          audience: "USER",
          type: "test",
          title: "T",
          body: "B",
          data: null,
          status: "COMPLETED",
          scheduledAt: now,
          createdAt: now,
          updatedAt: now,
          actorId: "admin",
          targetUserId: "user-a",
          userIds: null,
          recipientCount: 1,
          processedAt: now,
          errorMessage: null,
          idempotencyKey: "key-1",
        },
        created: false,
      });

      const useCase = createUseCase();
      const result = await useCase.createDeliveryJob(
        { userId: "admin", organizationId: "org-a" } as never,
        {
          audience: "USER",
          userId: "user-a",
          type: "test",
          title: "T",
          body: "B",
          idempotencyKey: "key-1",
        } as never,
      );

      expect(result.id).toBe("job-9");
      expect(mockJobsRepository.create).not.toHaveBeenCalled();
      expect(mockAuditWriter.log).not.toHaveBeenCalled();
      // A replay never re-processes the job.
      expect(mockJobsRepository.markProcessing).not.toHaveBeenCalled();
      expect(mockNotificationsRepository.createManyIdempotent).not.toHaveBeenCalled();
    });
  });

  describe("claimDue — concurrent worker safety", () => {
    it("returns distinct jobs for each worker", async () => {
      const now = new Date();
      const jobA = {
        id: "job-a",
        organizationId: "org-a",
        audience: "ALL" as const,
        type: "test",
        title: "Test",
        body: "Body",
        data: null,
        status: "PROCESSING" as const,
        scheduledAt: now,
        createdAt: now,
        updatedAt: now,
        actorId: null,
        targetUserId: null,
        userIds: null,
        recipientCount: null,
        processedAt: null,
        errorMessage: null,
        idempotencyKey: null,
      };
      const jobB = {
        id: "job-b",
        organizationId: "org-b",
        audience: "ALL" as const,
        type: "test",
        title: "Test",
        body: "Body",
        data: null,
        status: "PROCESSING" as const,
        scheduledAt: now,
        createdAt: now,
        updatedAt: now,
        actorId: null,
        targetUserId: null,
        userIds: null,
        recipientCount: null,
        processedAt: null,
        errorMessage: null,
        idempotencyKey: null,
      };

      mockJobsRepository.claimDue.mockResolvedValueOnce([jobA]);
      mockJobsRepository.claimDue.mockResolvedValueOnce([jobB]);
      mockUserLookup.listDeliverableUserIdsInOrganization.mockResolvedValue([]);
      mockJobsRepository.markCompleted.mockResolvedValue(null);

      const useCase = createUseCase();
      await useCase.processDueJobs();
      await useCase.processDueJobs();

      const calls = mockJobsRepository.claimDue.mock.calls;
      expect(calls[0]![0]).toBe(20);
      expect(calls[1]![0]).toBe(20);
    });
  });

  describe("admin job scope", () => {
    it("listJobs passes organizationId to repository", async () => {
      mockJobsRepository.list.mockResolvedValue({ rows: [], total: 0 });
      const useCase = createUseCase();
      await useCase.listJobs({ userId: "admin", organizationId: "org-a" } as never, {
        page: 1,
        limit: 10,
      });
      expect(mockJobsRepository.list).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        organizationId: "org-a",
      });
    });

    it("getJob returns 404 when job belongs to different org", async () => {
      mockJobsRepository.findById.mockResolvedValue({
        id: "job-1",
        organizationId: "org-b",
      });
      const useCase = createUseCase();
      await expect(
        useCase.getJob({ userId: "admin", organizationId: "org-a" } as never, "job-1"),
      ).rejects.toThrow("Notification job not found");
    });

    it("getJob returns job when org matches", async () => {
      const now = new Date();
      mockJobsRepository.findById.mockResolvedValue({
        id: "job-1",
        organizationId: "org-a",
        actorId: "admin",
        scheduledAt: now,
        createdAt: now,
        updatedAt: now,
        audience: "ALL",
        type: "test",
        title: "Test",
        body: "Body",
        data: null,
        status: "PENDING",
        targetUserId: null,
        userIds: null,
        recipientCount: null,
        processedAt: null,
        errorMessage: null,
        idempotencyKey: null,
      });
      const useCase = createUseCase();
      const result = await useCase.getJob(
        { userId: "admin", organizationId: "org-a" } as never,
        "job-1",
      );
      expect(result.id).toBe("job-1");
    });
  });
});
