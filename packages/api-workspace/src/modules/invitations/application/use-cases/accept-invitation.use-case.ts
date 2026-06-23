import type { AuthenticatedRequestUser, RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  hashOpaqueToken,
  INVITATION_STATUS,
  normalizeEmail,
  ORGANIZATION_ROLE,
} from '@repo/api-core';
import {
  DATABASE,
  type DatabaseClient,
  runInTransaction,
  TenantContextService,
} from '@repo/api-database';
import { AccessControlService, OrganizationsRepository } from '@repo/api-identity';

import type {
  AcceptInvitationCommand,
  InvitationView,
} from '../invitations.types';

import { INVITATION_ENTITY } from '../../domain/invitation-access.policy';
import { InvitationsMapper } from '../invitations.mapper';
import {
  INVITATIONS_REPOSITORY,
  type InvitationsRepositoryPort,
} from '../invitations.repository.port';

@Injectable()
export class AcceptInvitationUseCase {
  private readonly invitationsMapper = new InvitationsMapper();

  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(INVITATIONS_REPOSITORY)
    private readonly invitationsRepository: InvitationsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly accessControlService: AccessControlService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async execute(
    input: AcceptInvitationCommand,
    actor?: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ): Promise<InvitationView> {
    const tokenHash = hashOpaqueToken(input.token);
    const acceptedById = actor?.userId;
    let invalidateAccessProfile = false;

    // The invitation's target organization is unknown until the token is
    // resolved, and is very likely not the actor's own org (that's the whole
    // point of an invitation) — RLS would otherwise hide the row from the
    // actor's tenant-scoped lookup. The opaque token is itself the
    // authorization here, so this bypasses RLS the same way
    // WORKER_DISPATCH_CONTEXT does for other cross-tenant lookups.
    const acceptedInvitation = await this.tenantContextService.runAsync(
      { tenantId: '', userId: acceptedById ?? '', bypassRls: true },
      () =>
        runInTransaction(this.database, async (transaction) => {
          const invitation = await this.invitationsRepository.findByTokenHash(
            tokenHash,
            transaction,
          );

          if (invitation?.status !== INVITATION_STATUS.PENDING) {
            throw new AppError(
              ERROR_CODES.INVITATION_NOT_FOUND,
              'Invitation is invalid or no longer available',
              HttpStatus.NOT_FOUND,
            );
          }

          if (invitation.expiresAt <= new Date()) {
            await this.invitationsRepository.update(
              invitation.id,
              { status: 'EXPIRED' },
              transaction,
            );
            throw new AppError(
              ERROR_CODES.INVITATION_NOT_FOUND,
              'Invitation has expired',
              HttpStatus.GONE,
            );
          }

          if (!actor || !acceptedById) {
            throw new AppError(
              ERROR_CODES.AUTH_UNAUTHORIZED,
              'Sign in with the invited account before accepting this invitation',
              HttpStatus.UNAUTHORIZED,
            );
          }

          const actorEmail = normalizeEmail(actor.email);

          if (actorEmail !== invitation.email) {
            throw new AppError(
              ERROR_CODES.AUTH_FORBIDDEN,
              'Invitation email does not match your account',
              HttpStatus.FORBIDDEN,
            );
          }

          if (invitation.entityType === INVITATION_ENTITY.ORGANIZATION) {
            const organization = await this.organizationsRepository.findById(
              invitation.entityId,
              transaction,
            );

            if (!organization) {
              throw new AppError(
                ERROR_CODES.RESOURCE_CONFLICT,
                'Organization is no longer available',
                HttpStatus.CONFLICT,
              );
            }

            const membershipRole =
              invitation.role === ORGANIZATION_ROLE.ADMIN
                ? ORGANIZATION_ROLE.ADMIN
                : ORGANIZATION_ROLE.MEMBER;

            await this.organizationsRepository.upsertMember(
              {
                organizationId: invitation.entityId,
                userId: acceptedById,
                role: membershipRole as 'ADMIN' | 'MEMBER' | 'OWNER',
              },
              transaction,
            );

            if (membershipRole === ORGANIZATION_ROLE.ADMIN) {
              await this.accessControlService.ensureOrganizationAdminRole(
                invitation.entityId,
                acceptedById,
                transaction,
              );
            } else {
              invalidateAccessProfile = true;
            }
          }

          const updated = await this.invitationsRepository.acceptPending(
            invitation.id,
            acceptedById,
            transaction,
          );

          if (!updated) {
            throw new AppError(
              ERROR_CODES.INVITATION_NOT_FOUND,
              'Invitation is invalid or no longer available',
              HttpStatus.NOT_FOUND,
            );
          }

          await this.auditWriter.log(
            {
              actorId: acceptedById,
              action: 'invitation.accepted',
              entityType: invitation.entityType,
              entityId: invitation.entityId,
              metadata: { invitationId: invitation.id },
              requestContext,
            },
            transaction,
          );

          return updated;
        }),
    );

    if (invalidateAccessProfile && acceptedById) {
      await this.accessControlService.invalidateAccessProfile(acceptedById);
    }

    return this.invitationsMapper.toInvitationView(acceptedInvitation);
  }
}
