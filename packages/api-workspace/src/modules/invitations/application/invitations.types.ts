export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export type InvitationEntityType = 'organization' | 'project';

export interface InvitationView {
  id: string;
  email: string;
  entityType: string;
  entityId: string;
  role: string | null;
  invitedById: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationCommand {
  email: string;
  entityType: InvitationEntityType;
  entityId: string;
  role?: string;
}

export interface AcceptInvitationCommand {
  token: string;
}

export interface ListInvitationsQuery {
  page: number;
  limit: number;
  email?: string;
  entityType?: InvitationEntityType;
  entityId?: string;
  status?: InvitationStatus;
}
