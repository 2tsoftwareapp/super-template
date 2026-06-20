import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  PROJECT_LOOKUP,
  type ProjectLookup,
} from '@repo/api-core';

import type { InvitationView } from '../invitations.types';

import { assertCanInvite } from '../../domain/invitation-access.policy';
import { InvitationsMapper } from '../invitations.mapper';
import {
  INVITATIONS_REPOSITORY,
  type InvitationsRepositoryPort,
} from '../invitations.repository.port';

@Injectable()
export class RevokeInvitationUseCase {
  private readonly invitationsMapper = new InvitationsMapper();

  constructor(
    @Inject(INVITATIONS_REPOSITORY)
    private readonly invitationsRepository: InvitationsRepositoryPort,
    @Inject(PROJECT_LOOKUP) private readonly projectLookup: ProjectLookup,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    invitationId: string,
    requestContext?: RequestContext,
  ): Promise<InvitationView> {
    const invitation = await this.invitationsRepository.findById(invitationId);

    if (!invitation) {
      throw new AppError(
        ERROR_CODES.INVITATION_NOT_FOUND,
        'Invitation not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await assertCanInvite(
      actor,
      invitation.entityType,
      invitation.entityId,
      this.projectLookup,
    );

    if (invitation.status !== 'PENDING') {
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'Only pending invitations can be revoked',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.invitationsRepository.update(invitation.id, {
      status: 'REVOKED',
    });

    await this.auditWriter.log({
      actorId: actor.userId,
      action: 'invitation.revoked',
      entityType: invitation.entityType,
      entityId: invitation.entityId,
      metadata: { invitationId },
      requestContext,
    });

    return this.invitationsMapper.toInvitationView(updated ?? invitation);
  }
}
