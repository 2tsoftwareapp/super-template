import type { InvitationRecord } from './invitations.repository.port';
import type { InvitationView } from './invitations.types';

export class InvitationsMapper {
  toInvitationView(invitation: InvitationRecord): InvitationView {
    return {
      id: invitation.id,
      email: invitation.email,
      entityType: invitation.entityType,
      entityId: invitation.entityId,
      role: invitation.role ?? null,
      invitedById: invitation.invitedById,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
      acceptedById: invitation.acceptedById ?? null,
      createdAt: invitation.createdAt.toISOString(),
      updatedAt: invitation.updatedAt.toISOString(),
    };
  }

  /** @deprecated Use toInvitationView */
  toInvitationDto(invitation: InvitationRecord): InvitationView {
    return this.toInvitationView(invitation);
  }
}
