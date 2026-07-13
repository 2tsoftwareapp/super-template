export interface AuthSessionModel {
  id: string;
  userId: string;
  refreshTokenHash: string;
  previousRefreshTokenHash: string | null;
  previousRotatedAt: Date | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionInput {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}
