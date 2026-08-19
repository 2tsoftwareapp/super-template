import type { AuthSessionModel } from "./models/auth-session";

export interface AuthUserView {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  emailVerifiedAt: string | null;
  mustChangePassword: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthMapper {
  toSessionDto(session: AuthSessionModel, currentSessionId: string) {
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
      mustChangePassword: boolean;
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
      mustChangePassword: user.mustChangePassword,
      roles,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
