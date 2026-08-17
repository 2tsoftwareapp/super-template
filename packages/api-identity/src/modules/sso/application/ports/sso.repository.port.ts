import type { TransactionExecutor } from '@repo/api-core';

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
  consumeLoginState(
    id: string,
    executor?: TransactionExecutor,
  ): Promise<boolean>;

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
  consumeSessionExchange(
    id: string,
    executor?: TransactionExecutor,
  ): Promise<boolean>;

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
}

export const SSO_REPOSITORY = Symbol('SSO_REPOSITORY');
