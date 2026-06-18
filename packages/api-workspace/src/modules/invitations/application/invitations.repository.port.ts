import type { DatabaseExecutor } from '@repo/api-database';

import type { InvitationsRepository } from '../infrastructure/invitations.repository';
import type { ListInvitationsQuery } from './invitations.types';

export type InvitationRecord = NonNullable<
  Awaited<ReturnType<InvitationsRepository['findById']>>
>;

export interface InvitationsListResult {
  rows: InvitationRecord[];
  total: number;
}

export interface InvitationsRepositoryPort {
  create(
    values: Parameters<InvitationsRepository['create']>[0],
    executor?: DatabaseExecutor,
  ): Promise<InvitationRecord | null>;
  findById(
    invitationId: string,
    executor?: DatabaseExecutor,
  ): Promise<InvitationRecord | null>;
  findByTokenHash(
    tokenHash: string,
    executor?: DatabaseExecutor,
  ): Promise<InvitationRecord | null>;
  list(
    params: ListInvitationsQuery,
    executor?: DatabaseExecutor,
  ): Promise<InvitationsListResult>;
  update(
    invitationId: string,
    values: Parameters<InvitationsRepository['update']>[1],
    executor?: DatabaseExecutor,
  ): Promise<InvitationRecord | null>;
  revokePendingForEntity(
    entityType: string,
    entityId: string,
    email: string,
    executor?: DatabaseExecutor,
  ): Promise<void>;
}

export const INVITATIONS_REPOSITORY = Symbol('INVITATIONS_REPOSITORY');
