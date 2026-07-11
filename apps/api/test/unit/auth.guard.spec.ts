import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { AuthService } from '@repo/api-identity/modules/auth/application/auth.service';

import { AppError } from '@repo/api-core';
import { describe, expect, it, vi } from 'vitest';

import { AuthGuard } from '../../src/shell/auth.guard';

interface RequestStub {
  headers: { authorization?: string };
  user?: unknown;
}

function createContext(request: RequestStub): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function createGuard(options: {
  isPublic: boolean;
  authenticate?: ReturnType<typeof vi.fn>;
}) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(options.isPublic),
  } as unknown as Reflector;
  const authenticate =
    options.authenticate ?? vi.fn().mockResolvedValue({ userId: 'u1' });
  const authService = {
    authenticateAccessToken: authenticate,
  } as unknown as AuthService;

  return { guard: new AuthGuard(reflector, authService), authenticate };
}

describe('AuthGuard', () => {
  it('allows public routes without touching the token', async () => {
    const { guard, authenticate } = createGuard({ isPublic: true });
    const request: RequestStub = { headers: {} };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(
      true,
    );
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('rejects protected routes without an authorization header', async () => {
    const { guard } = createGuard({ isPublic: false });
    const request: RequestStub = { headers: {} };

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('rejects non-bearer authorization schemes', async () => {
    const { guard } = createGuard({ isPublic: false });
    const request: RequestStub = {
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    };

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('authenticates the bearer token and attaches the user', async () => {
    const authenticatedUser = { userId: 'u1', roles: ['ADMIN'] };
    const authenticate = vi.fn().mockResolvedValue(authenticatedUser);
    const { guard } = createGuard({ isPublic: false, authenticate });
    const request: RequestStub = {
      headers: { authorization: 'Bearer token-123' },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(
      true,
    );
    expect(authenticate).toHaveBeenCalledWith('token-123');
    expect(request.user).toBe(authenticatedUser);
  });

  it('propagates token-validation failures', async () => {
    const authenticate = vi
      .fn()
      .mockRejectedValue(new AppError('AUTH_UNAUTHORIZED', 'expired', 401));
    const { guard } = createGuard({ isPublic: false, authenticate });
    const request: RequestStub = {
      headers: { authorization: 'Bearer stale' },
    };

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(AppError);
  });
});
