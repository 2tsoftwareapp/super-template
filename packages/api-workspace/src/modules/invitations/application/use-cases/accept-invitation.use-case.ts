import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-core";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  hashOpaqueToken,
  normalizeEmail,
} from "@repo/api-core";

import { INVITATION_STATUS } from "@repo/api-core/src/common/constants/invitation-status";
import { ORGANIZATION_ROLE } from "@repo/api-core/src/common/constants/organization-role";

import type {
  AcceptInvitationCommand,
  InvitationView,
} from "../invitations.types";

import { InvitationsMapper } from "../invitations.mapper";
import {
  INVITATIONS_REPOSITORY,
  type InvitationsRepositoryPort,
} from "../invitations.repository.port";
import { OrganizationsRepository } from "@repo/api-identity/infrastructure/organizations.repository";

@Injectable()
export class AcceptInvitationUseCase {
  private readonly invitationsMapper = new InvitationsMapper();

  constructor(
    @Inject(INVITATIONS_REPOSITORY)
    private readonly invitationsRepository: InvitationsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async execute(
    input: AcceptInvitationCommand,
    actor?: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ): Promise<InvitationView> {
    const tokenHash = hashOpaqueToken(input.token);
    const invitation =
      await this.invitationsRepository.findByTokenHash(tokenHash);

    if (invitation?.status !== INVITATION_STATUS.PENDING) {
      throw new AppError(
        ERROR_CODES.INVITATION_NOT_FOUND,
        "Invitation is invalid or no longer available",
        HttpStatus.NOT_FOUND,
      );
    }

    if (invitation.expiresAt <= new Date()) {
      await this.invitationsRepository.update(invitation.id, {
        status: INVITATION_STATUS.EXPIRED,
      });
      throw new AppError(
        ERROR_CODES.INVITATION_NOT_FOUND,
        "Invitation has expired",
        HttpStatus.GONE,
      );
    }

    const acceptedById = actor?.userId ?? null;

    if (actor) {
      const actorEmail = normalizeEmail(actor.email);

      if (actorEmail !== invitation.email) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          "Invitation email does not match your account",
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const updated = await this.invitationsRepository.update(invitation.id, {
      status: INVITATION_STATUS.ACCEPTED,
      acceptedAt: new Date(),
      acceptedById,
    });

    if (invitation.entityType === "organization") {
      await this.organizationsRepository.addMember({
        organizationId: invitation.entityId,
        userId: acceptedById,
        role: ORGANIZATION_ROLE.MEMBER,
      });
    }

    await this.auditWriter.log({
      actorId: acceptedById,
      action: "invitation.accepted",
      entityType: invitation.entityType,
      entityId: invitation.entityId,
      metadata: { invitationId: invitation.id },
      requestContext,
    });

    return this.invitationsMapper.toInvitationView(updated ?? invitation);
  }
}
