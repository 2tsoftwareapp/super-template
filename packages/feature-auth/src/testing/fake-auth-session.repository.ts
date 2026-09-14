import type { AuthSessionModel, CreateSessionInput } from "../application/models/auth-session";
import type { AuthSessionRepositoryPort } from "../application/ports/auth-session.repository.port";

/**
 * In-memory session store for the refresh-rotation tests.
 *
 * It models the two write paths the rotation depends on:
 *  - `updateSessionIfMatches` — the compare-and-swap guarded by the presented
 *    hash, which is what makes a rotation atomic against concurrent refreshes;
 *  - `revokeSession` — recorded separately, because "did this flow revoke the
 *    session?" is the security-relevant question in every scenario here.
 *
 * Each call yields before reading/writing, so callers that run under
 * `Promise.all` interleave the way they do against PostgreSQL.
 */
export class FakeAuthSessionRepository {
  private readonly sessions = new Map<string, AuthSessionModel>();

  /** Every CAS attempt that matched, in order — one entry per real rotation. */
  readonly rotations: { sessionId: string; expectedHash: string; nextHash: string }[] = [];

  /** Session ids passed to revokeSession, in order. */
  readonly revokedSessionIds: string[] = [];

  seedSession(input: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    previousRefreshTokenHash?: string | null;
    previousRotatedAt?: Date | null;
    expiresAt?: Date;
    revokedAt?: Date | null;
  }): AuthSessionModel {
    const now = new Date();
    const session: AuthSessionModel = {
      id: input.id,
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      previousRefreshTokenHash: input.previousRefreshTokenHash ?? null,
      previousRotatedAt: input.previousRotatedAt ?? null,
      expiresAt: input.expiresAt ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: input.revokedAt ?? null,
      lastUsedAt: now,
      ipAddress: null,
      userAgent: null,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    return { ...session };
  }

  getSession(sessionId: string): AuthSessionModel | undefined {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : undefined;
  }

  async findSessionById(sessionId: string): Promise<AuthSessionModel | null> {
    await yieldToConcurrentCallers();
    return this.getSession(sessionId) ?? null;
  }

  async findSessionForUser(sessionId: string, userId: string): Promise<AuthSessionModel | null> {
    await yieldToConcurrentCallers();
    const session = this.sessions.get(sessionId);
    return session?.userId === userId ? { ...session } : null;
  }

  async createSession(values: CreateSessionInput): Promise<AuthSessionModel | null> {
    await yieldToConcurrentCallers();
    const now = new Date();
    const session: AuthSessionModel = {
      ...values,
      previousRefreshTokenHash: null,
      previousRotatedAt: null,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    return { ...session };
  }

  async updateSession(
    sessionId: string,
    values: Partial<AuthSessionModel>,
  ): Promise<AuthSessionModel | null> {
    await yieldToConcurrentCallers();
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    const updated = { ...session, ...values, updatedAt: new Date() };
    this.sessions.set(sessionId, updated);
    return { ...updated };
  }

  async updateSessionIfMatches(
    sessionId: string,
    refreshTokenHash: string,
    values: Partial<AuthSessionModel>,
  ): Promise<AuthSessionModel | null> {
    await yieldToConcurrentCallers();
    const session = this.sessions.get(sessionId);

    if (!session || session.revokedAt || session.refreshTokenHash !== refreshTokenHash) {
      return null;
    }

    const updated = { ...session, ...values, updatedAt: new Date() };
    this.sessions.set(sessionId, updated);
    this.rotations.push({ sessionId, expectedHash: refreshTokenHash, nextHash: updated.refreshTokenHash });
    return { ...updated };
  }

  async revokeSession(sessionId: string): Promise<AuthSessionModel | null> {
    this.revokedSessionIds.push(sessionId);
    return this.updateSession(sessionId, { revokedAt: new Date() });
  }

  /** The subset of the port the rotation flow uses, typed as the full port. */
  asPort(): AuthSessionRepositoryPort {
    return this as unknown as AuthSessionRepositoryPort;
  }
}

const yieldToConcurrentCallers = () => new Promise<void>((resolve) => setImmediate(resolve));