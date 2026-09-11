import { Inject, Injectable } from "@nestjs/common";
import {
  type DatabaseClient,
  type DatabaseExecutor,
  getPrimaryDatabaseClient,
} from "@repo/database-runtime";
import { DATABASE } from "@repo/database-runtime";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";

import type { AuthSessionRepositoryPort } from "../application/ports/auth-session.repository.port";

import { authSessions, emailVerificationTokens, passwordResetTokens } from "./persistence";

@Injectable()
export class AuthRepository implements AuthSessionRepositoryPort {
  private readonly primaryDatabase: DatabaseClient;

  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {
    this.primaryDatabase = getPrimaryDatabaseClient(database);
  }

  async createSession(
    values: typeof authSessions.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [session] = await executor.insert(authSessions).values(values).returning();
    return session ?? null;
  }

  async findSessionById(sessionId: string, executor: DatabaseExecutor = this.primaryDatabase) {
    const [session] = await executor
      .select()
      .from(authSessions)
      .where(eq(authSessions.id, sessionId))
      .limit(1);
    return session ?? null;
  }

  async findSessionForUser(
    sessionId: string,
    userId: string,
    executor: DatabaseExecutor = this.primaryDatabase,
  ) {
    const [session] = await executor
      .select()
      .from(authSessions)
      .where(and(eq(authSessions.id, sessionId), eq(authSessions.userId, userId)))
      .limit(1);
    return session ?? null;
  }

  async updateSession(
    sessionId: string,
    values: Partial<typeof authSessions.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [session] = await executor
      .update(authSessions)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(authSessions.id, sessionId))
      .returning();

    return session ?? null;
  }

  async updateSessionIfMatches(
    sessionId: string,
    refreshTokenHash: string,
    values: Partial<typeof authSessions.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [session] = await executor
      .update(authSessions)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(authSessions.id, sessionId),
          eq(authSessions.refreshTokenHash, refreshTokenHash),
          isNull(authSessions.revokedAt),
        ),
      )
      .returning();

    return session ?? null;
  }

  async listSessionsForUser(userId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(authSessions)
      .where(eq(authSessions.userId, userId))
      .orderBy(authSessions.createdAt);
  }

  async revokeSession(sessionId: string, executor: DatabaseExecutor = this.database) {
    return this.updateSession(
      sessionId,
      {
        revokedAt: new Date(),
      },
      executor,
    );
  }

  async revokeAllSessionsForUser(userId: string, executor: DatabaseExecutor = this.database) {
    await executor
      .update(authSessions)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
  }

  async findLatestEmailVerificationToken(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [token] = await executor
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId))
      .orderBy(desc(emailVerificationTokens.createdAt))
      .limit(1);
    return token ?? null;
  }

  async storeEmailVerificationToken(
    values: typeof emailVerificationTokens.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [token] = await executor.insert(emailVerificationTokens).values(values).returning();
    return token ?? null;
  }

  async findValidEmailVerificationToken(
    tokenHash: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [token] = await executor
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return token ?? null;
  }

  async consumeEmailVerificationToken(tokenId: string, executor: DatabaseExecutor = this.database) {
    const [token] = await executor
      .update(emailVerificationTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(emailVerificationTokens.id, tokenId))
      .returning();

    return token ?? null;
  }

  async storePasswordResetToken(
    values: typeof passwordResetTokens.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [token] = await executor.insert(passwordResetTokens).values(values).returning();
    return token ?? null;
  }

  async findValidPasswordResetToken(tokenHash: string, executor: DatabaseExecutor = this.database) {
    const [token] = await executor
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return token ?? null;
  }

  async consumePasswordResetToken(tokenId: string, executor: DatabaseExecutor = this.database) {
    const [token] = await executor
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordResetTokens.id, tokenId))
      .returning();

    return token ?? null;
  }

  async cleanupExpiredTokens(executor: DatabaseExecutor = this.database) {
    const now = new Date();

    await executor
      .delete(emailVerificationTokens)
      .where(sql`${emailVerificationTokens.expiresAt} <= ${now}`);

    await executor
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} <= ${now}`);
  }
}
