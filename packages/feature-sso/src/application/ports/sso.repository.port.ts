import type { TransactionExecutor } from "@repo/api-kernel";

import type { SsoIdentity } from "./sso-provider.port";

export interface SsoLoginStateRecord {
  id: string;
  provider: string;
  stateHash: string;
  nonce: string;
  /** Plaintext PKCE verifier — decrypted by infrastructure on read. */
  codeVerifier: string;
  redirectUri: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface SsoSessionExchangeRecord {
  id: string;
  codeHash: string;
  sessionId: string;
  organizationId: string | null;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface ExternalIdentityRecord {
  id: string;
  userId: string;
  provider: string;
  providerSubject: string;
  email: string;
  createdAt: Date;
}

/** A provider-resolved identity held for one callback round trip. */
export interface SsoIdentityExchangeRecord {
  identity: SsoIdentity;
  /** Nonce bound to the login state this identity belongs to ("" when unused). */
  nonce: string;
}

export interface SsoRepositoryPort {
  createLoginState(
    values: {
      provider: string;
      stateHash: string;
      nonce: string;
      codeVerifier: string;
      redirectUri: string;
      expiresAt: Date;
    },
    executor?: TransactionExecutor,
  ): Promise<SsoLoginStateRecord | null>;

  findValidLoginStateByStateHash(
    stateHash: string,
    executor?: TransactionExecutor,
  ): Promise<SsoLoginStateRecord | null>;

  /**
   * CAS-consume a login state: only succeeds when still unconsumed.
   * Returns false if a concurrent request already replayed the same state.
   */
  consumeLoginState(id: string, executor?: TransactionExecutor): Promise<boolean>;

  createSessionExchange(
    values: {
      codeHash: string;
      sessionId: string;
      organizationId: string | null;
      expiresAt: Date;
    },
    executor?: TransactionExecutor,
  ): Promise<SsoSessionExchangeRecord | null>;

  findValidSessionExchangeByCodeHash(
    codeHash: string,
    executor?: TransactionExecutor,
  ): Promise<SsoSessionExchangeRecord | null>;

  /**
   * CAS-consume a session exchange: only succeeds when still unconsumed.
   * Returns false if a concurrent request already redeemed the same code.
   */
  consumeSessionExchange(id: string, executor?: TransactionExecutor): Promise<boolean>;

  findIdentity(
    provider: string,
    providerSubject: string,
    executor?: TransactionExecutor,
  ): Promise<ExternalIdentityRecord | null>;

  createIdentity(
    values: {
      userId: string;
      provider: string;
      providerSubject: string;
      email: string;
    },
    executor?: TransactionExecutor,
  ): Promise<ExternalIdentityRecord | null>;

  /**
   * Persist a provider-resolved identity for one callback round trip and
   * return its one-time opaque handle (doubles as the adapter's idToken).
   *
   * Backed by the same store as login states so the exchange survives process
   * boundaries: `exchangeCode` and `verifyIdToken` may land on different
   * instances. The payload is encrypted at rest with the same versioned key
   * scheme as login states and expires with the given TTL.
   */
  storeIdentityExchange(
    values: {
      provider: string;
      identity: SsoIdentity;
      nonce: string;
      expiresAt: Date;
    },
    executor?: TransactionExecutor,
  ): Promise<string>;

  /**
   * CAS-consume a stored identity exchange by handle. Returns null when the
   * handle is unknown, expired, or already consumed — callers must reject the
   * identity instead of replaying it (TOCTOU guard).
   */
  consumeIdentityExchange(
    handle: string,
    executor?: TransactionExecutor,
  ): Promise<SsoIdentityExchangeRecord | null>;
}

export const SSO_REPOSITORY = Symbol("SSO_REPOSITORY");
