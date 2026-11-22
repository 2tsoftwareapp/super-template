import { randomBytes, createHash } from "node:crypto";

import type { PublicUser, SessionResponse } from "./auth.dto";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { loadEnv } from "@lean/config";
import { hashPassword, verifyPassword, type UserRow } from "@lean/db";

import { AppError, ERROR_CODES } from "../../shared/errors";
import { AuthRepository, type CreateSessionInput } from "./auth.repository";
import { TokenService } from "./token.service";

const REFRESH_TOKEN_BYTES = 32;
/** How long a just-rotated token is treated as a lost race rather than a replay. */
const ROTATION_GRACE_MS = 10_000;
const ACCESS_DENIED = "Invalid email or password";

const hashRefreshToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const sessionRotated = (): AppError =>
  new AppError(ERROR_CODES.AUTH_SESSION_ROTATED, "Session was already refreshed", 401);

const toPublicUser = (user: UserRow): PublicUser => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
});

@Injectable()
export class AuthService {
  private readonly env = loadEnv();
  /** Verified against when the email is unknown, so the response time is flat. */
  private readonly dummyHash = hashPassword("timing-padding-not-a-password");

  constructor(
    @Inject(AuthRepository) private readonly users: AuthRepository,
    @Inject(TokenService) private readonly tokens: TokenService,
  ) {}

  async login(email: string, password: string): Promise<SessionResponse> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    const passwordMatches = user
      ? verifyPassword(password, user.passwordHash)
      : verifyPassword(password, this.dummyHash) && false;

    if (!user || !passwordMatches) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, ACCESS_DENIED, 401);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "Account is not active", 403);
    }

    return this.issueSession(user);
  }

  /**
   * Rotation: the presented token is revoked and its successor inserted in one
   * transaction. A revoked token coming back after the grace window means it was
   * stolen or replayed — every session of that user is revoked. Inside the
   * window it is a concurrent refresh that lost the race (two tabs, two BFF
   * requests) and only that request is rejected.
   */
  async refresh(refreshToken: string): Promise<SessionResponse> {
    const session = await this.users.findSessionByHash(hashRefreshToken(refreshToken));

    if (!session) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "Session not found", 401);
    }

    if (session.revokedAt) {
      return this.rejectRevoked(session.userId, session.revokedAt);
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "Session expired", 401);
    }

    const user = await this.users.findById(session.userId);

    if (!user || user.status !== "ACTIVE") {
      await this.users.revokeAllForUser(session.userId);
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "Account is not active", 403);
    }

    const next = this.newRefreshToken(user.id);

    if (!(await this.users.rotateSession(session.id, next.session))) {
      throw sessionRotated();
    }

    return this.toSessionResponse(user, next.token);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.users.revokeAllForUser(userId);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.users.revokeSessionByHash(hashRefreshToken(refreshToken));
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    return toPublicUser(user);
  }

  private async issueSession(user: UserRow): Promise<SessionResponse> {
    const next = this.newRefreshToken(user.id);

    await this.users.createSession(next.session);

    return this.toSessionResponse(user, next.token);
  }

  private async rejectRevoked(userId: string, revokedAt: Date): Promise<never> {
    if (Date.now() - revokedAt.getTime() < ROTATION_GRACE_MS) {
      throw sessionRotated();
    }

    await this.users.revokeAllForUser(userId);
    throw new AppError(ERROR_CODES.AUTH_TOKEN_REUSED, "Refresh token reuse detected", 401);
  }

  private newRefreshToken(userId: string): { token: string; session: CreateSessionInput } {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");

    return {
      token,
      session: {
        userId,
        refreshTokenHash: hashRefreshToken(token),
        expiresAt: new Date(Date.now() + this.refreshTtlMs()),
      },
    };
  }

  private toSessionResponse(user: UserRow, refreshToken: string): SessionResponse {
    return { accessToken: this.tokens.sign(user), refreshToken, user: toPublicUser(user) };
  }

  /** `30d` / `12h` / `45m` — the one place that understands the env format. */
  private refreshTtlMs(): number {
    const match = /^(\d+)([smhd])$/.exec(this.env.JWT_REFRESH_TTL);

    if (!match) {
      throw new Error(`Invalid JWT_REFRESH_TTL: ${this.env.JWT_REFRESH_TTL}`);
    }

    const value = Number(match[1]);
    const unit = match[2] as "s" | "m" | "h" | "d";
    const seconds = { s: 1, m: 60, h: 3600, d: 86400 }[unit];

    return value * seconds * 1000;
  }
}
