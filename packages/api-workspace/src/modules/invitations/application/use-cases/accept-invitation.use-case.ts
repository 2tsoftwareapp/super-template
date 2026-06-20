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
  hashOpaqueToken,
  normalizeEmail,
} from '@repo/api-core';

import type { AcceptInvitationCommand, InvitationView } from '../invitations.types';

import { InvitationsMapper } from '../invitations.mapper';
import {
  INVITATIONS_REPOSITORY,
  type InvitationsRepositoryPort,
} from '../invitations.repository.port';

@Injectable()
export class AcceptInvitationUseCase {
  private readonly invitationsMapper = new InvitationsMapper();

  constructor(
    @Inject(INVITATIONS_REPOSITORY)
    private readonly invitationsRepository: InvitationsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    input: AcceptInvitationCommand,
    actor?: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ): Promise<InvitationView> {
    const tokenHash = hashOpaqueToken(input.token);
    const invitation =
      await this.invitationsRepository.findByTokenHash(tokenHash);

    if (invitation?.status !== 'PENDING') {
      throw new AppError(
        ERROR_CODES.INVITATION_NOT_FOUND,
        'Invitation is invalid or no longer available',
        HttpStatus.NOT_FOUND,
      );
    }

    if (invitation.expiresAt <= new Date()) {
      await this.invitationsRepository.update(invitation.id, {
        status: 'EXPIRED',
      });
      throw new AppError(
        ERROR_CODES.INVITATION_NOT_FOUND,
        'Invitation has expired',
        HttpStatus.GONE,
      );
    }

    const acceptedById = actor?.userId ?? null;

    if (actor) {
      const actorEmail = normalizeEmail(actor.email);

      if (actorEmail !== invitation.email) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          'Invitation email does not match your account',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const updated = await this.invitationsRepository.update(invitation.id, {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      acceptedById,
    });

    await this.auditWriter.log({
      actorId: acceptedById,
      action: 'invitation.accepted',
      entityType: invitation.entityType,
      entityId: invitation.entityId,
      metadata: { invitationId: invitation.id },
      requestContext,
    });

    return this.invitationsMapper.toInvitationView(updated ?? invitation);
  }
}
