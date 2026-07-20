import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationDeliveryUseCase } from '../use-cases/notification-delivery.use-case';

describe('NotificationDeliveryUseCase - scope & idempotency', () => {
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
    run: vi.fn(async <T>(fn: (tx: unknown) => Promise<T>) => fn('tx')),
  };

  const mockNotificationsRepository = {
    createMany: vi.fn(),
    findBySourceJobAndUsers: vi.fn(),
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
      mockAuditWriter as never,
      mockTransactionPort as never,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveRecipientIds', () => {
    it('returns empty array for target user not in organization', async () => {
      mockUserLookup.findActiveUserInOrganization.mockResolvedValue(null);
      const useCase = createUseCase();
      const result = await useCase.resolveRecipientIds({
        audience: 'USER',
        targetUserId: 'user-outside-org',
        organizationId: 'org-a',
      } as never);
      expect(result).toEqual([]);
    });

    it('returns only org members for USERS audience', async () => {
      mockUserLookup.filterActiveUserIdsInOrganization.mockResolvedValue([
        'user-in-org',
      ]);
      const useCase = createUseCase();
      const result = await useCase.resolveRecipientIds({
        audience: 'USERS',
        userIds: ['user-in-org', 'user-outside-org'],
        organizationId: 'org-a',
      } as never);
      expect(result).toEqual(['user-in-org']);
    });

    it('returns deliverable users in org for ALL audience', async () => {
      mockUserLookup.listDeliverableUserIdsInOrganization.mockResolvedValue([
        'user-a',
        'user-b',
      ]);
      const useCase = createUseCase();
      const result = await useCase.resolveRecipientIds({
        audience: 'ALL',
        organizationId: 'org-a',
      } as never);
      expect(result).toEqual(['user-a', 'user-b']);
    });
  });

  describe('idempotency (sourceJobId conflict)', () => {
    it('does not insert duplicate inbox rows when retrying same job', async () => {
      mockNotificationsRepository.createMany.mockResolvedValue([
        { id: 'n-1', userId: 'user-a', organizationId: 'org-a' },
      ]);
      mockJobsRepository.markProcessing.mockResolvedValue({
        id: 'job-1',
        organizationId: 'org-a',
        type: 'test',
        title: 'Test',
        body: 'Body',
      });
      mockJobsRepository.markCompleted.mockResolvedValue(null);
      mockUserLookup.listDeliverableUserIdsInOrganization.mockResolvedValue([
        'user-a',
      ]);

      const useCase = createUseCase();
      await useCase.processJob('job-1');

      expect(mockNotificationsRepository.createMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('claimDue — concurrent worker safety', () => {
    it('returns distinct jobs for each worker', async () => {
      const now = new Date();
      const jobA = {
        id: 'job-a',
        organizationId: 'org-a',
        audience: 'ALL' as const,
        type: 'test',
        title: 'Test',
        body: 'Body',
        data: null,
        status: 'PROCESSING' as const,
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
        id: 'job-b',
        organizationId: 'org-b',
        audience: 'ALL' as const,
        type: 'test',
        title: 'Test',
        body: 'Body',
        data: null,
        status: 'PROCESSING' as const,
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
      expect(calls[0][0]).toBe(20);
      expect(calls[1][0]).toBe(20);
    });
  });

  describe('admin job scope', () => {
    it('listJobs passes organizationId to repository', async () => {
      mockJobsRepository.list.mockResolvedValue({ rows: [], total: 0 });
      const useCase = createUseCase();
      await useCase.listJobs(
        { userId: 'admin', organizationId: 'org-a' } as never,
        { page: 1, limit: 10 },
      );
      expect(mockJobsRepository.list).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        organizationId: 'org-a',
      });
    });

    it('getJob returns 404 when job belongs to different org', async () => {
      mockJobsRepository.findById.mockResolvedValue({
        id: 'job-1',
        organizationId: 'org-b',
      });
      const useCase = createUseCase();
      await expect(
        useCase.getJob(
          { userId: 'admin', organizationId: 'org-a' } as never,
          'job-1',
        ),
      ).rejects.toThrow('Notification job not found');
    });

    it('getJob returns job when org matches', async () => {
      const now = new Date();
      mockJobsRepository.findById.mockResolvedValue({
        id: 'job-1',
        organizationId: 'org-a',
        actorId: 'admin',
        scheduledAt: now,
        createdAt: now,
        updatedAt: now,
        audience: 'ALL',
        type: 'test',
        title: 'Test',
        body: 'Body',
        data: null,
        status: 'PENDING',
        targetUserId: null,
        userIds: null,
        recipientCount: null,
        processedAt: null,
        errorMessage: null,
        idempotencyKey: null,
      });
      const useCase = createUseCase();
      const result = await useCase.getJob(
        { userId: 'admin', organizationId: 'org-a' } as never,
        'job-1',
      );
      expect(result.id).toBe('job-1');
    });
  });
});
