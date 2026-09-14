import type { DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable, Logger } from "@nestjs/common";
import { generateOpaqueToken, hashOpaqueToken } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";
import { DATABASE, type DatabaseClient } from "@repo/database-runtime";
import { and, eq, gt, isNull } from "drizzle-orm";

import type {
  SsoIdentityExchangeRecord,
  SsoLoginStateRecord,
  SsoRepositoryPort,
  SsoSessionExchangeRecord,
} from "../application/ports/sso.repository.port";

import { externalIdentities, ssoLoginStates, ssoSessionExchanges } from "./persistence";
import { decryptSsoSecret, encryptSsoSecret, type SsoCipherKeys } from "./sso-cipher";

/**
 * Drizzle SSO repository.
 *
 * SECURITY: encrypts PKCE code_verifier at rest with a versioned key scheme
 * (see sso-cipher.ts): `v2` rows use the dedicated SSO_ENCRYPTION_KEY, `v1`/
 * legacy rows use MFA_ENCRYPTION_KEY; session exchanges store session_id only
 * (tokens re-issued on redeem).
 */
@Injectable()
export class SsoRepository implements SsoRepositoryPort {
  private readonly logger = new Logger(SsoRepository.name);
  private warnedLegacyKeyFallback = false;

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
    const encrypted = encryptSsoSecret(values.codeVerifier, this.cipherKeys(), (message) =>
      this.warnLegacyKeyFallbackOnce(message),
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

  /**
   * CAS-consume a login state: only succeeds when the row is still
   * unconsumed. Returns false when a concurrent request already replayed
   * the same state — the caller must abort the callback (TOCTOU guard).
   */
  async consumeLoginState(
    id: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<boolean> {
    const updated = await executor
      .update(ssoLoginStates)
      .set({ consumedAt: new Date() })
      .where(and(eq(ssoLoginStates.id, id), isNull(ssoLoginStates.consumedAt)))
      .returning({ id: ssoLoginStates.id });

    return updated.length > 0;
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
    const [exchange] = await executor.insert(ssoSessionExchanges).values(values).returning();

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

  /**
   * CAS-consume a session exchange: only succeeds when the row is still
   * unconsumed. Returns false when a concurrent request already redeemed
   * the same code — the caller must not re-issue tokens (TOCTOU guard).
   */
  async consumeSessionExchange(
    id: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<boolean> {
    const updated = await executor
      .update(ssoSessionExchanges)
      .set({ consumedAt: new Date() })
      .where(and(eq(ssoSessionExchanges.id, id), isNull(ssoSessionExchanges.consumedAt)))
      .returning({ id: ssoSessionExchanges.id });

    return updated.length > 0;
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
    const [identity] = await executor.insert(externalIdentities).values(values).returning();

    return identity ?? null;
  }

  async storeIdentityExchange(
    values: {
      provider: string;
      identity: { subject: string; email: string; emailVerified: boolean };
      nonce: string;
      expiresAt: Date;
    },
    executor: DatabaseExecutor = this.database,
  ): Promise<string> {
    const handle = generateOpaqueToken();
    const encrypted = encryptSsoSecret(
      JSON.stringify(values.identity),
      this.cipherKeys(),
      (message) => this.warnLegacyKeyFallbackOnce(message),
    );

    // Identity exchanges share t_sso_login_states with login states: identical
    // lifecycle (short TTL, one-time use, encrypted payload, CAS consume), so
    // no schema change is needed. The handle is server-generated and only ever
    // hashed into state_hash, so these rows never collide with callback state
    // lookups (a caller would need a hash preimage of the opaque handle).
    await executor.insert(ssoLoginStates).values({
      provider: values.provider,
      stateHash: hashOpaqueToken(handle),
      nonce: values.nonce,
      codeVerifierCiphertext: encrypted.ciphertext,
      codeVerifierIv: encrypted.iv,
      codeVerifierAuthTag: encrypted.authTag,
      // Identity rows do not drive redirects; the column is NOT NULL, so the
      // empty string marks them instead of a misleading redirect URI.
      redirectUri: "",
      expiresAt: values.expiresAt,
    });

    return handle;
  }

  async consumeIdentityExchange(
    handle: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<SsoIdentityExchangeRecord | null> {
    // Single-statement CAS: the row is consumed only when still unconsumed and
    // unexpired, so two concurrent verifications (possibly on different
    // instances) can never both observe the identity.
    const [row] = await executor
      .update(ssoLoginStates)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(ssoLoginStates.stateHash, hashOpaqueToken(handle)),
          isNull(ssoLoginStates.consumedAt),
          gt(ssoLoginStates.expiresAt, new Date()),
        ),
      )
      .returning();

    if (!row) {
      return null;
    }

    const identity = JSON.parse(
      decryptSsoSecret(
        {
          ciphertext: row.codeVerifierCiphertext,
          iv: row.codeVerifierIv,
          authTag: row.codeVerifierAuthTag,
        },
        this.cipherKeys(),
      ),
    ) as SsoIdentityExchangeRecord["identity"];

    return { identity, nonce: row.nonce };
  }

  /**
   * Encryption keys for SSO secrets at rest, by cipher version:
   * v1 = legacy MFA_ENCRYPTION_KEY, v2 = dedicated SSO_ENCRYPTION_KEY.
   */
  private cipherKeys(): SsoCipherKeys {
    return {
      v1: this.environmentService.values.MFA_ENCRYPTION_KEY,
      v2: this.environmentService.values.SSO_ENCRYPTION_KEY,
    };
  }

  private warnLegacyKeyFallbackOnce(message: string): void {
    if (this.warnedLegacyKeyFallback) {
      return;
    }

    this.warnedLegacyKeyFallback = true;
    this.logger.warn(message);
  }

  private toLoginStateRecord(state: typeof ssoLoginStates.$inferSelect): SsoLoginStateRecord {
    const codeVerifier = decryptSsoSecret(
      {
        ciphertext: state.codeVerifierCiphertext,
        iv: state.codeVerifierIv,
        authTag: state.codeVerifierAuthTag,
      },
      this.cipherKeys(),
    );

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
