import type { RequestContext } from "@repo/api-kernel";

import type { AuthUserView } from "../application/auth.mapper";

/**
 * Session-issuance contract (ADR 0004). Auth owns session issuance; this port
 * lets other features (SSO today) issue sessions through the same
 * implementation as password login and the post-MFA-challenge flow without
 * injecting auth application classes. The result shape is the login-response
 * shape, so SSO logins stay indistinguishable from password logins — including
 * `organizationId: null` under the org-optional model.
 *
 * The user input is the structural shape the mapper needs (no password hash —
 * issuing a session must never require credential material).
 */
export interface SessionIssuanceUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  emailVerifiedAt: Date | null;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionIssuanceOptions {
  mustChangePassword?: boolean;
}

export interface SessionIssuanceSession {
  id: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  current: boolean;
}

export interface SessionIssuanceResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUserView;
  permissions: string[];
  organizationId: string | null;
  mustChangePassword: boolean;
  session: SessionIssuanceSession;
}

export interface SessionIssuer {
  issue(
    user: SessionIssuanceUser,
    requestContext?: RequestContext,
    options?: SessionIssuanceOptions,
  ): Promise<SessionIssuanceResult>;
}

export { SESSION_ISSUER } from "./session-issuer.token";
