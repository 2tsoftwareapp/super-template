import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE,
  mfaChallenges,
  userRecoveryCodes,
  userTwoFactorSecrets,
} from '@repo/api-database';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';

@Injectable()
export class MfaRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async findSecretByUserId(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [secret] = await executor
      .select()
      .from(userTwoFactorSecrets)
      .where(eq(userTwoFactorSecrets.userId, userId))
      .limit(1);

    return secret ?? null;
  }

  async upsertPendingSecret(
    values: typeof userTwoFactorSecrets.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [secret] = await executor
      .insert(userTwoFactorSecrets)
      .values(values)
      .onConflictDoUpdate({
        target: userTwoFactorSecrets.userId,
        set: {
          secretCiphertext: values.secretCiphertext,
          secretIv: values.secretIv,
          secretAuthTag: values.secretAuthTag,
          enabled: false,
          confirmedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return secret ?? null;
  }

  async confirmSecret(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [secret] = await executor
      .update(userTwoFactorSecrets)
      .set({
        enabled: true,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userTwoFactorSecrets.userId, userId))
      .returning();

    return secret ?? null;
  }

  async deleteSecret(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    await executor
      .delete(userTwoFactorSecrets)
      .where(eq(userTwoFactorSecrets.userId, userId));
  }

  async replaceRecoveryCodes(
    userId: string,
    codeHashes: string[],
    executor: DatabaseExecutor = this.database,
  ) {
    await executor
      .delete(userRecoveryCodes)
      .where(eq(userRecoveryCodes.userId, userId));

    if (codeHashes.length === 0) {
      return;
    }

    await executor.insert(userRecoveryCodes).values(
      codeHashes.map((codeHash) => ({
        userId,
        codeHash,
      })),
    );
  }

  async findUnusedRecoveryCodeByHash(
    userId: string,
    codeHash: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [code] = await executor
      .select()
      .from(userRecoveryCodes)
      .where(
        and(
          eq(userRecoveryCodes.userId, userId),
          eq(userRecoveryCodes.codeHash, codeHash),
          isNull(userRecoveryCodes.usedAt),
        ),
      )
      .limit(1);

    return code ?? null;
  }

  async consumeRecoveryCode(
    id: string,
    executor: DatabaseExecutor = this.database,
  ) {
    await executor
      .update(userRecoveryCodes)
      .set({ usedAt: new Date() })
      .where(eq(userRecoveryCodes.id, id));
  }

  async createChallenge(
    values: typeof mfaChallenges.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [challenge] = await executor
      .insert(mfaChallenges)
      .values(values)
      .returning();

    return challenge ?? null;
  }

  async findValidChallengeByTokenHash(
    tokenHash: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [challenge] = await executor
      .select()
      .from(mfaChallenges)
      .where(
        and(
          eq(mfaChallenges.tokenHash, tokenHash),
          isNull(mfaChallenges.consumedAt),
          gt(mfaChallenges.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return challenge ?? null;
  }

  async incrementChallengeAttempts(
    id: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [challenge] = await executor
      .update(mfaChallenges)
      .set({ attempts: sql`${mfaChallenges.attempts} + 1` })
      .where(eq(mfaChallenges.id, id))
      .returning();

    return challenge ?? null;
  }

  async consumeChallenge(
    id: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [challenge] = await executor
      .update(mfaChallenges)
      .set({ consumedAt: new Date() })
      .where(eq(mfaChallenges.id, id))
      .returning();

    return challenge ?? null;
  }
}
