import { describe, expect, it, vi } from 'vitest';

import { ERROR_CODES } from '@repo/api-core';

import { HandleSsoCallbackUseCase } from '../handle-sso-callback.use-case';

const buildTransactionPort = () => ({
  run: vi.fn().mockImplementation(async (fn: any) => fn('tx')),
});

const buildLoginState = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'state-1',
  provider: 'fake',
  codeVerifier: 'verifier',
  nonce: 'nonce-1',
  redirectUri: 'http://localhost:3005/sso/callback',
  ...overrides,
});

const buildIssueSessionUseCase = () => ({
  execute: vi.fn(async () => ({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    organizationId: 'org-1',
  })),
});

const buildAccessControlService = () => ({
  getRoleByName: vi.fn(async () => ({ id: 'role-user' })),
  replaceUserRoles: vi.fn(async () => undefined),
});

const buildOrganizationsService = () => ({
  ensurePersonalOrganization: vi.fn(async () => undefined),
});

interface BuildArgsOverrides {
  providers?: Map<string, unknown>;
  transactionPort?: unknown;
  ssoRepository?: unknown;
  usersRepository?: unknown;
  accessControlService?: unknown;
  organizationsService?: unknown;
  issueSessionUseCase?: unknown;
  auditWriter?: unknown;
}

const buildUseCase = (overrides: BuildArgsOverrides = {}) =>
  new HandleSsoCallbackUseCase(
    (overrides.providers ?? new Map()) as never,
    (overrides.transactionPort ?? buildTransactionPort()) as never,
    (overrides.ssoRepository ?? {}) as never,
    (overrides.usersRepository ?? {}) as never,
    (overrides.accessControlService ?? buildAccessControlService()) as never,
    (overrides.organizationsService ?? buildOrganizationsService()) as never,
    (overrides.issueSessionUseCase ?? buildIssueSessionUseCase()) as never,
    (overrides.auditWriter ?? { log: vi.fn(async () => undefined) }) as never,
  );

describe('HandleSsoCallbackUseCase', () => {
  it('rejects an unknown provider', async () => {
    const useCase = buildUseCase();

    await expect(
      useCase.execute({ provider: 'unknown', code: 'c', state: 's' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SSO_PROVIDER_UNAVAILABLE });
  });

  it('rejects an invalid or expired state', async () => {
    const ssoRepository = {
      findValidLoginStateByStateHash: vi.fn(async () => null),
    };
    const useCase = buildUseCase({
      providers: new Map([['fake', {}]]),
      ssoRepository,
    });

    await expect(
      useCase.execute({ provider: 'fake', code: 'c', state: 's' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SSO_STATE_INVALID });
  });

  it('rejects a state a concurrent request already consumed (replay)', async () => {
    const ssoRepository = {
      findValidLoginStateByStateHash: vi.fn(async () => buildLoginState()),
      // CAS consume loses the race: this state was already replayed.
      consumeLoginState: vi.fn(async () => false),
    };
    const provider = {
      exchangeCode: vi.fn(async () => ({ idToken: 'idtok' })),
    };
    const issueSessionUseCase = buildIssueSessionUseCase();
    const useCase = buildUseCase({
      providers: new Map([['fake', provider]]),
      ssoRepository,
      issueSessionUseCase,
    });

    await expect(
      useCase.execute({ provider: 'fake', code: 'c', state: 's' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SSO_STATE_INVALID });
    // Consume-first: no provider exchange, no account/session side effects.
    expect(provider.exchangeCode).not.toHaveBeenCalled();
    expect(issueSessionUseCase.execute).not.toHaveBeenCalled();
  });

  it('rejects when the state belongs to a different provider', async () => {
    const ssoRepository = {
      findValidLoginStateByStateHash: vi.fn(async () =>
        buildLoginState({ provider: 'google' }),
      ),
    };
    const useCase = buildUseCase({
      providers: new Map([['fake', {}]]),
      ssoRepository,
    });

    await expect(
      useCase.execute({ provider: 'fake', code: 'c', state: 's' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SSO_STATE_INVALID });
  });

  it('audits and rejects when the provider fails to verify the identity', async () => {
    const ssoRepository = {
      findValidLoginStateByStateHash: vi.fn(async () => buildLoginState()),
      consumeLoginState: vi.fn(async () => true),
    };
    const provider = {
      exchangeCode: vi.fn(async () => {
        throw new Error('boom');
      }),
    };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = buildUseCase({
      providers: new Map([['fake', provider]]),
      ssoRepository,
      auditWriter,
    });

    await expect(
      useCase.execute({ provider: 'fake', code: 'c', state: 's' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SSO_TOKEN_INVALID });
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.sso.failed' }),
    );
  });

  it('rejects creating a new account when the provider did not verify the email', async () => {
    const ssoRepository = {
      findValidLoginStateByStateHash: vi.fn(async () => buildLoginState()),
      consumeLoginState: vi.fn(async () => true),
      findIdentity: vi.fn(async () => null),
    };
    const provider = {
      exchangeCode: vi.fn(async () => ({ idToken: 'idtok' })),
      verifyIdToken: vi.fn(async () => ({
        subject: 'sub-1',
        email: 'new@example.com',
        emailVerified: false,
      })),
    };
    const usersRepository = { findByEmail: vi.fn(async () => null) };
    const useCase = buildUseCase({
      providers: new Map([['fake', provider]]),
      ssoRepository,
      usersRepository,
    });

    await expect(
      useCase.execute({ provider: 'fake', code: 'c', state: 's' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SSO_TOKEN_INVALID });
  });

  it('rejects linking onto an unverified existing account (conflict)', async () => {
    const ssoRepository = {
      findValidLoginStateByStateHash: vi.fn(async () => buildLoginState()),
      consumeLoginState: vi.fn(async () => true),
      findIdentity: vi.fn(async () => null),
    };
    const provider = {
      exchangeCode: vi.fn(async () => ({ idToken: 'idtok' })),
      verifyIdToken: vi.fn(async () => ({
        subject: 'sub-1',
        email: 'taken@example.com',
        emailVerified: true,
      })),
    };
    const usersRepository = {
      findByEmail: vi.fn(async () => ({
        id: 'existing-user',
        emailVerifiedAt: null,
      })),
    };
    const useCase = buildUseCase({
      providers: new Map([['fake', provider]]),
      ssoRepository,
      usersRepository,
    });

    await expect(
      useCase.execute({ provider: 'fake', code: 'c', state: 's' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SSO_EMAIL_CONFLICT });
  });

  it('rejects linking when the provider did not verify the email', async () => {
    const ssoRepository = {
      findValidLoginStateByStateHash: vi.fn(async () => buildLoginState()),
      consumeLoginState: vi.fn(async () => true),
      findIdentity: vi.fn(async () => null),
    };
    const provider = {
      exchangeCode: vi.fn(async () => ({ idToken: 'idtok' })),
      verifyIdToken: vi.fn(async () => ({
        subject: 'sub-1',
        email: 'verified@example.com',
        emailVerified: false,
      })),
    };
    const usersRepository = {
      findByEmail: vi.fn(async () => ({
        id: 'existing-user',
        emailVerifiedAt: new Date(),
      })),
    };
    const useCase = buildUseCase({
      providers: new Map([['fake', provider]]),
      ssoRepository,
      usersRepository,
    });

    await expect(
      useCase.execute({ provider: 'fake', code: 'c', state: 's' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SSO_TOKEN_INVALID });
  });

  it('links to a verified existing account and issues a session', async () => {
    const ssoRepository = {
      findValidLoginStateByStateHash: vi.fn(async () => buildLoginState()),
      consumeLoginState: vi.fn(async () => true),
      findIdentity: vi.fn(async () => null),
      createIdentity: vi.fn(async () => undefined),
    };
    const provider = {
      exchangeCode: vi.fn(async () => ({ idToken: 'idtok' })),
      verifyIdToken: vi.fn(async () => ({
        subject: 'sub-1',
        email: 'verified@example.com',
        emailVerified: true,
      })),
    };
    const existingUser = {
      id: 'existing-user',
      emailVerifiedAt: new Date(),
    };
    const usersRepository = {
      findByEmail: vi.fn(async () => existingUser),
    };
    const issueSessionUseCase = buildIssueSessionUseCase();
    const accessControlService = buildAccessControlService();
    const organizationsService = buildOrganizationsService();
    const useCase = buildUseCase({
      providers: new Map([['fake', provider]]),
      ssoRepository,
      usersRepository,
      accessControlService,
      organizationsService,
      issueSessionUseCase,
    });

    const result = await useCase.execute({
      provider: 'fake',
      code: 'c',
      state: 's',
    });

    expect(issueSessionUseCase.execute).toHaveBeenCalledWith(
      existingUser,
      undefined,
    );
    expect(ssoRepository.createIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'existing-user',
        provider: 'fake',
        providerSubject: 'sub-1',
      }),
      'tx',
    );
    // Linking onto an existing account must not re-run new-account bootstrap.
    expect(accessControlService.replaceUserRoles).not.toHaveBeenCalled();
    expect(organizationsService.ensurePersonalOrganization).not.toHaveBeenCalled();
    expect(result.redirectUri).toBe('http://localhost:3005/sso/callback');
    expect(result.session.accessToken).toBe('access-token');
  });

  it('creates a new account, assigns the USER role, and provisions a personal organization', async () => {
    const ssoRepository = {
      findValidLoginStateByStateHash: vi.fn(async () => buildLoginState()),
      consumeLoginState: vi.fn(async () => true),
      findIdentity: vi.fn(async () => null),
      createIdentity: vi.fn(async () => undefined),
    };
    const provider = {
      exchangeCode: vi.fn(async () => ({ idToken: 'idtok' })),
      verifyIdToken: vi.fn(async () => ({
        subject: 'sub-1',
        email: 'fresh@example.com',
        emailVerified: true,
      })),
    };
    const createdUser = { id: 'new-user', displayName: 'fresh' };
    const usersRepository = {
      findByEmail: vi.fn(async () => null),
      create: vi.fn(async () => createdUser),
    };
    const issueSessionUseCase = buildIssueSessionUseCase();
    const accessControlService = buildAccessControlService();
    const organizationsService = buildOrganizationsService();
    const useCase = buildUseCase({
      providers: new Map([['fake', provider]]),
      ssoRepository,
      usersRepository,
      accessControlService,
      organizationsService,
      issueSessionUseCase,
    });

    await useCase.execute({ provider: 'fake', code: 'c', state: 's' });

    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'fresh@example.com',
        status: 'ACTIVE',
      }),
      'tx',
    );
    expect(accessControlService.getRoleByName).toHaveBeenCalledWith(
      'USER',
      null,
      'tx',
    );
    expect(accessControlService.replaceUserRoles).toHaveBeenCalledWith(
      'new-user',
      ['role-user'],
      null,
      'tx',
    );
    expect(
      organizationsService.ensurePersonalOrganization,
    ).toHaveBeenCalledWith('new-user', 'fresh', 'tx');
    expect(issueSessionUseCase.execute).toHaveBeenCalledWith(
      createdUser,
      undefined,
    );
  });

  it('reuses an already-linked identity without re-deciding account linking', async () => {
    const linkedUser = { id: 'linked-user' };
    const ssoRepository = {
      findValidLoginStateByStateHash: vi.fn(async () => buildLoginState()),
      consumeLoginState: vi.fn(async () => true),
      findIdentity: vi.fn(async () => ({ userId: 'linked-user' })),
    };
    const provider = {
      exchangeCode: vi.fn(async () => ({ idToken: 'idtok' })),
      verifyIdToken: vi.fn(async () => ({
        subject: 'sub-1',
        email: 'returning@example.com',
        emailVerified: true,
      })),
    };
    const usersRepository = {
      findById: vi.fn(async () => linkedUser),
      findByEmail: vi.fn(),
      create: vi.fn(),
    };
    const issueSessionUseCase = buildIssueSessionUseCase();
    const useCase = buildUseCase({
      providers: new Map([['fake', provider]]),
      ssoRepository,
      usersRepository,
      issueSessionUseCase,
    });

    await useCase.execute({ provider: 'fake', code: 'c', state: 's' });

    expect(usersRepository.findByEmail).not.toHaveBeenCalled();
    expect(issueSessionUseCase.execute).toHaveBeenCalledWith(
      linkedUser,
      undefined,
    );
  });
});
