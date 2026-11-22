import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import { sessions, users, type UserRow } from "@lean/db";

import { DatabaseService } from "../../shared/database.service";

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
}

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
   * session exactly one sees `revoked_at IS NULL`; the other gets `false`.
   */
  async rotateSession(sessionId: string, next: CreateSessionInput): Promise<boolean> {
    return this.database.transaction(async () => {
      const [revoked] = await this.database.db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)))
        .returning({ id: sessions.id });

      if (!revoked) {
        return false;
      }

      await this.database.db.insert(sessions).values(next);

      return true;
    });
  }

  async revokeSessionByHash(refreshTokenHash: string): Promise<void> {
    await this.database.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.refreshTokenHash, refreshTokenHash), isNull(sessions.revokedAt)));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.database.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }
}
