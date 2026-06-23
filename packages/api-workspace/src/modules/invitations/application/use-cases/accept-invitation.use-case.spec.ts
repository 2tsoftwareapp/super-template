import { describe, expect, it, vi } from 'vitest';

import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';

import { AcceptInvitationUseCase } from './accept-invitation.use-case';

const createInvitation = () => ({
  id: 'invitation-1',
  organizationId: 'org-1',
  email: 'invitee@example.local',
  tokenHash: 'hashed-token',
  entityType: 'organization',
  entityId: 'org-1',
  role: 'ADMIN',
  invitedById: 'admin-1',
  status: 'PENDING' as const,
  expiresAt: new Date(Date.now() + 60_000),
  acceptedAt: null,
  acceptedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('AcceptInvitationUseCase', () => {
  it('accepts an organization invitation and provisions membership', async () => {
    const invitation = createInvitation();
    const invitationsRepository = {
      findByTokenHash: vi.fn(async () => invitation),
      update: vi.fn(async () => invitation),
      acceptPending: vi.fn(async () => ({
        ...invitation,
        status: 'ACCEPTED' as const,
        acceptedAt: new Date(),
        acceptedById: 'user-1',
      })),
    };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const organizationsRepository = {
      findById: vi.fn(async () => ({ id: 'org-1' })),
      upsertMember: vi.fn(async () => ({
        id: 'member-1',
        organizationId: 'org-1',
        userId: 'user-1',
        role: 'ADMIN',
      })),
    };
    const accessControlService = {
      ensureOrganizationAdminRole: vi.fn(async () => undefined),
      invalidateAccessProfile: vi.fn(async () => undefined),
    };
    const database = {
      transaction: vi.fn(async (operation) => operation({})),
    };

    const tenantContextService = {
      runAsync: vi.fn((_context, operation) => operation()),
    };

    const useCase = new AcceptInvitationUseCase(
      database as never,
      invitationsRepository as never,
      auditWriter as never,
      organizationsRepository as never,
      accessControlService as never,
      tenantContextService as never,
    );

    const result = await useCase.execute(
      { token: 'plain-token' },
      {
        userId: 'user-1',
        email: 'invitee@example.local',
        sessionId: 'session-1',
        organizationId: null,
        roles: ['USER'],
        permissions: [],
      },
    );

    expect(organizationsRepository.upsertMember).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        userId: 'user-1',
        role: 'ADMIN',
      }),
      expect.anything(),
    );
    expect(accessControlService.ensureOrganizationAdminRole).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      expect.anything(),
    );
    expect(invitationsRepository.acceptPending).toHaveBeenCalledWith(
      'invitation-1',
      'user-1',
      expect.anything(),
    );
    expect(auditWriter.log).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 'invitation-1',
      status: 'ACCEPTED',
      acceptedById: 'user-1',
    });
  });

  it('rejects acceptance from a different signed-in email', async () => {
    const invitation = createInvitation();
    const invitationsRepository = {
      findByTokenHash: vi.fn(async () => invitation),
      update: vi.fn(async () => invitation),
      acceptPending: vi.fn(),
    };

    const useCase = new AcceptInvitationUseCase(
      {
        transaction: vi.fn(async (operation) => operation({})),
      } as never,
      invitationsRepository as never,
      { log: vi.fn(async () => undefined) } as never,
      {
        findById: vi.fn(),
        upsertMember: vi.fn(),
      } as never,
      {
        ensureOrganizationAdminRole: vi.fn(),
        invalidateAccessProfile: vi.fn(),
      } as never,
      {
        runAsync: vi.fn((_context, operation) => operation()),
      } as never,
    );

    await expect(
      useCase.execute(
        { token: 'plain-token' },
        {
          userId: 'user-2',
          email: 'other@example.local',
          sessionId: 'session-2',
          organizationId: null,
          roles: ['USER'],
          permissions: [],
        },
      ),
    ).rejects.toMatchObject<AppError>({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });

    expect(invitationsRepository.acceptPending).not.toHaveBeenCalled();
  });
});
