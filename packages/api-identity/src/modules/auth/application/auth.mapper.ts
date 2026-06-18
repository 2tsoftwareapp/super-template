import type { AuthRepository } from '../infrastructure/auth.repository';

type AuthSession = NonNullable<
  Awaited<ReturnType<AuthRepository['findSessionById']>>
>;

export interface AuthUserView {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  emailVerifiedAt: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export class AuthMapper {
  toSessionDto(session: AuthSession, currentSessionId: string) {
    return {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: session.revokedAt?.toISOString() ?? null,
      lastUsedAt: session.lastUsedAt?.toISOString() ?? null,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      current: session.id === currentSessionId,
    };
  }

  toUserView(
    user: {
      id: string;
      email: string;
      displayName: string;
      avatarUrl: string | null;
      status: string;
      emailVerifiedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    roles: string[],
  ): AuthUserView {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      roles,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
