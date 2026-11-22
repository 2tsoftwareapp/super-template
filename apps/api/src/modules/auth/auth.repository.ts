import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt, isNull } from "drizzle-orm";
import { passwordResets, sessions, users, type UserRow } from "@lean/db";

import { DatabaseService } from "../../shared/database.service";

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  displayName: string;
}

export interface CreatePasswordResetInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export type RotationOutcome = "rotated" | "lost-race" | "inactive";

@Injectable()
export class AuthRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    const [user] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async findById(userId: string): Promise<UserRow | null> {
    const [user] = await this.database.db.select().from(users).where(eq(users.id, userId)).limit(1);

    return user ?? null;
  }

  async createSession(input: CreateSessionInput): Promise<void> {
    await this.database.db.insert(sessions).values(input);
  }

  async findSessionByHash(refreshTokenHash: string) {
    const [session] = await this.database.db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, refreshTokenHash))
      .limit(1);

    return session ?? null;
  }

  /**
   * Revokes `sessionId` and inserts its successor in one transaction. The
   * conditional update is the lock: of two concurrent rotations of the same
   * session exactly one sees `revoked_at IS NULL`. The owner row is read
   * `FOR SHARE`, so a concurrent block either waits for this successor to
   * exist (and revokes it) or commits first and is seen here.
   */
  async rotateSession(sessionId: string, next: CreateSessionInput): Promise<RotationOutcome> {
    return this.database.transaction(async () => {
      const [revoked] = await this.database.db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)))
        .returning({ id: sessions.id });

      if (!revoked) {
        return "lost-race";
      }

      const [owner] = await this.database.db
        .select({ status: users.status })
        .from(users)
        .where(eq(users.id, next.userId))
        .for("share");

      if (owner?.status !== "ACTIVE") {
        return "inactive";
      }

      await this.database.db.insert(sessions).values(next);

      return "rotated";
    });
  }

  async revokeSessionByHash(refreshTokenHash: string): Promise<void> {
    await this.database.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.refreshTokenHash, refreshTokenHash), isNull(sessions.revokedAt)));
  }

  /** Kills refresh tokens and, through `tokens_valid_after`, every live access token. */
  async revokeAllForUser(userId: string): Promise<void> {
    const now = new Date();

    await this.database.transaction(async () => {
      await this.database.db
        .update(sessions)
        .set({ revokedAt: now })
        .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
      await this.database.db
        .update(users)
        .set({ tokensValidAfter: now })
        .where(eq(users.id, userId));
    });
  }

  async createUser(input: CreateUserInput): Promise<UserRow> {
    const [user] = await this.database.db.insert(users).values(input).returning();

    if (!user) {
      throw new Error("User insert returned no row");
    }

    return user;
  }

  async updateUser(
    userId: string,
    values: { displayName?: string; passwordHash?: string },
  ): Promise<UserRow | null> {
    const [user] = await this.database.db
      .update(users)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return user ?? null;
  }

  async createPasswordReset(input: CreatePasswordResetInput): Promise<void> {
    await this.database.db.insert(passwordResets).values(input);
  }

  /**
   * Marks an unused, unexpired reset token as used and returns its owner. The
   * conditional update is the lock: a token works exactly once.
   */
  async consumePasswordReset(tokenHash: string): Promise<string | null> {
    const now = new Date();
    const [reset] = await this.database.db
      .update(passwordResets)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResets.tokenHash, tokenHash),
          isNull(passwordResets.usedAt),
          gt(passwordResets.expiresAt, now),
        ),
      )
      .returning({ userId: passwordResets.userId });

    return reset?.userId ?? null;
  }
}
