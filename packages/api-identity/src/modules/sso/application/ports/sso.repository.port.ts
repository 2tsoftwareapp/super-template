import type { TransactionExecutor } from '@repo/api-core';

export interface SsoLoginStateRecord {
  id: string;
  provider: string;
  stateHash: string;
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface SsoSessionExchangeRecord {
  id: string;
  codeHash: string;
  accessToken: string;
  refreshToken: string;
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

  consumeLoginState(
    id: string,
    executor?: TransactionExecutor,
  ): Promise<void>;

  createSessionExchange(
    values: {
      codeHash: string;
      accessToken: string;
      refreshToken: string;
      organizationId: string | null;
      expiresAt: Date;
    },
    executor?: TransactionExecutor,
  ): Promise<SsoSessionExchangeRecord | null>;

  findValidSessionExchangeByCodeHash(
    codeHash: string,
    executor?: TransactionExecutor,
  ): Promise<SsoSessionExchangeRecord | null>;

  consumeSessionExchange(
    id: string,
    executor?: TransactionExecutor,
  ): Promise<void>;

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
