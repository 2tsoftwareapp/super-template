import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE,
  externalIdentities,
  ssoLoginStates,
} from '@repo/api-database';
import { and, eq, gt, isNull } from 'drizzle-orm';

@Injectable()
export class SsoRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async createLoginState(
    values: typeof ssoLoginStates.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [state] = await executor
      .insert(ssoLoginStates)
      .values(values)
      .returning();

    return state ?? null;
  }

  async findValidLoginStateByStateHash(
    stateHash: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [state] = await executor
      .select()
      .from(ssoLoginStates)
      .where(
        and(
          eq(ssoLoginStates.stateHash, stateHash),
          isNull(ssoLoginStates.consumedAt),
          gt(ssoLoginStates.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return state ?? null;
  }

  async consumeLoginState(
    id: string,
    executor: DatabaseExecutor = this.database,
  ) {
    await executor
      .update(ssoLoginStates)
      .set({ consumedAt: new Date() })
      .where(eq(ssoLoginStates.id, id));
  }

  async findIdentity(
    provider: string,
    providerSubject: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [identity] = await executor
      .select()
      .from(externalIdentities)
      .where(
        and(
          eq(externalIdentities.provider, provider),
          eq(externalIdentities.providerSubject, providerSubject),
        ),
      )
      .limit(1);

    return identity ?? null;
  }

  async createIdentity(
    values: typeof externalIdentities.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [identity] = await executor
      .insert(externalIdentities)
      .values(values)
      .returning();

    return identity ?? null;
  }
}
