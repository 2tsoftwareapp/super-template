import type { DatabaseExecutor } from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE,
  type DatabaseClient,
  externalIdentities,
  ssoLoginStates,
  ssoSessionExchanges,
} from '@repo/api-database';
import { EnvironmentService } from '@repo/api-core';
import { and, eq, gt, isNull } from 'drizzle-orm';

import type {
  SsoLoginStateRecord,
  SsoRepositoryPort,
  SsoSessionExchangeRecord,
} from '../application/ports/sso.repository.port';

import {
  decryptTotpSecret,
  encryptTotpSecret,
} from '../../mfa/domain/totp-encryption';

/**
 * Drizzle SSO repository.
 *
 * SECURITY: encrypts PKCE code_verifier at rest with MFA_ENCRYPTION_KEY;
 * session exchanges store session_id only (tokens re-issued on redeem).
 */
@Injectable()
export class SsoRepository implements SsoRepositoryPort {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly environmentService: EnvironmentService,
  ) {}

  async createLoginState(
    values: {
      provider: string;
      stateHash: string;
      nonce: string;
      codeVerifier: string;
      redirectUri: string;
      expiresAt: Date;
    },
    executor: DatabaseExecutor = this.database,
  ): Promise<SsoLoginStateRecord | null> {
    const encrypted = encryptTotpSecret(
      Buffer.from(values.codeVerifier, 'utf8'),
      this.encryptionKey(),
    );

    const [state] = await executor
      .insert(ssoLoginStates)
      .values({
        provider: values.provider,
        stateHash: values.stateHash,
        nonce: values.nonce,
        codeVerifierCiphertext: encrypted.ciphertext,
        codeVerifierIv: encrypted.iv,
        codeVerifierAuthTag: encrypted.authTag,
        redirectUri: values.redirectUri,
        expiresAt: values.expiresAt,
      })
      .returning();

    return state ? this.toLoginStateRecord(state) : null;
  }

  async findValidLoginStateByStateHash(
    stateHash: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<SsoLoginStateRecord | null> {
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

    return state ? this.toLoginStateRecord(state) : null;
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

  async createSessionExchange(
    values: {
      codeHash: string;
      sessionId: string;
      organizationId: string | null;
      expiresAt: Date;
    },
    executor: DatabaseExecutor = this.database,
  ): Promise<SsoSessionExchangeRecord | null> {
    const [exchange] = await executor
      .insert(ssoSessionExchanges)
      .values(values)
      .returning();

    return exchange ?? null;
  }

  async findValidSessionExchangeByCodeHash(
    codeHash: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<SsoSessionExchangeRecord | null> {
    const [exchange] = await executor
      .select()
      .from(ssoSessionExchanges)
      .where(
        and(
          eq(ssoSessionExchanges.codeHash, codeHash),
          isNull(ssoSessionExchanges.consumedAt),
          gt(ssoSessionExchanges.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return exchange ?? null;
  }

  async consumeSessionExchange(
    id: string,
    executor: DatabaseExecutor = this.database,
  ) {
    await executor
      .update(ssoSessionExchanges)
      .set({ consumedAt: new Date() })
      .where(eq(ssoSessionExchanges.id, id));
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

  private encryptionKey(): string {
    return this.environmentService.values.MFA_ENCRYPTION_KEY;
  }

  private toLoginStateRecord(
    state: typeof ssoLoginStates.$inferSelect,
  ): SsoLoginStateRecord {
    const codeVerifier = decryptTotpSecret(
      {
        ciphertext: state.codeVerifierCiphertext,
        iv: state.codeVerifierIv,
        authTag: state.codeVerifierAuthTag,
      },
      this.encryptionKey(),
    ).toString('utf8');

    return {
      id: state.id,
      provider: state.provider,
      stateHash: state.stateHash,
      nonce: state.nonce,
      codeVerifier,
      redirectUri: state.redirectUri,
      expiresAt: state.expiresAt,
      consumedAt: state.consumedAt,
      createdAt: state.createdAt,
    };
  }
}
