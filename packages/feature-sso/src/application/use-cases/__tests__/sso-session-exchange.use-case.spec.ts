import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "@repo/api-runtime";

import {
  CreateSsoSessionExchangeUseCase,
  ExchangeSsoSessionUseCase,
} from "../sso-session-exchange.use-case";

describe("Sso session exchange use cases", () => {
  it("creates a one-time exchange code bound to a session id", async () => {
    const ssoRepository = {
      createSessionExchange: vi.fn(async () => ({ id: "exchange-1" })),
    };
    const useCase = new CreateSsoSessionExchangeUseCase(ssoRepository as never);

    const result = await useCase.execute({
      sessionId: "session-1",
      organizationId: "org-1",
    });

    expect(result.exchangeCode).toEqual(expect.any(String));
    expect(ssoRepository.createSessionExchange).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-1",
        organizationId: "org-1",
      }),
    );
    expect(ssoRepository.createSessionExchange).toHaveBeenCalledWith(
      expect.not.objectContaining({
        accessToken: expect.anything(),
        refreshToken: expect.anything(),
      }),
    );
  });

  it("re-issues tokens for the bound session and rejects replay", async () => {
    const ssoRepository = {
      findValidSessionExchangeByCodeHash: vi
        .fn()
        .mockResolvedValueOnce({
          id: "exchange-1",
          sessionId: "session-1",
          organizationId: "org-1",
        })
        .mockResolvedValueOnce(null),
      consumeSessionExchange: vi.fn(async () => true),
    };
    const authSessionRepository = {
      findSessionById: vi.fn(async () => ({
        id: "session-1",
        userId: "user-1",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        ipAddress: null,
        userAgent: null,
      })),
    };
    const tokenProvider = {
      reissueSessionTokens: vi.fn(async () => ({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        session: { id: "session-1" },
      })),
    };
    const useCase = new ExchangeSsoSessionUseCase(
      ssoRepository as never,
      authSessionRepository as never,
      tokenProvider as never,
    );

    const first = await useCase.execute("exchange-code");
    expect(first).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      organizationId: "org-1",
    });
    expect(tokenProvider.reissueSessionTokens).toHaveBeenCalledWith(
      "session-1",
      "user-1",
      "org-1",
      { ipAddress: null, userAgent: null },
    );
    expect(ssoRepository.consumeSessionExchange).toHaveBeenCalledWith("exchange-1");

    // Replay: the code is gone from the exchange table → rejected.
    await expect(useCase.execute("exchange-code")).rejects.toMatchObject({
      code: ERROR_CODES.SSO_EXCHANGE_INVALID,
    });
  });

  it("rejects a code a concurrent request already consumed (no double token mint)", async () => {
    const ssoRepository = {
      findValidSessionExchangeByCodeHash: vi.fn(async () => ({
        id: "exchange-1",
        sessionId: "session-1",
        organizationId: "org-1",
      })),
      // CAS consume loses the race: another request already redeemed this code.
      consumeSessionExchange: vi.fn(async () => false),
    };
    const authSessionRepository = {
      findSessionById: vi.fn(),
    };
    const tokenProvider = {
      reissueSessionTokens: vi.fn(),
    };
    const useCase = new ExchangeSsoSessionUseCase(
      ssoRepository as never,
      authSessionRepository as never,
      tokenProvider as never,
    );

    await expect(useCase.execute("exchange-code")).rejects.toMatchObject({
      code: ERROR_CODES.SSO_EXCHANGE_INVALID,
    });
    // Consume-first: tokens must never be re-issued after a lost race.
    expect(tokenProvider.reissueSessionTokens).not.toHaveBeenCalled();
    expect(authSessionRepository.findSessionById).not.toHaveBeenCalled();
  });
});
