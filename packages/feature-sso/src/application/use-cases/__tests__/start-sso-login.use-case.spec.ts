import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES, EnvironmentService } from "@repo/api-runtime";

import { StartSsoLoginUseCase } from "../start-sso-login.use-case";

const buildEnvironmentService = (ssoRedirectOrigins: string[], ssoRedirectUris: string[] = []) =>
  ({
    ssoRedirectOrigins,
    ssoRedirectUris,
  }) as unknown as EnvironmentService;

describe("StartSsoLoginUseCase", () => {
  it("rejects an unknown provider", async () => {
    const useCase = new StartSsoLoginUseCase(
      new Map(),
      { createLoginState: vi.fn() } as never,
      buildEnvironmentService(["http://localhost:3005"]),
    );

    await expect(
      useCase.execute({
        provider: "unknown",
        redirectUri: "http://localhost:3005/sso/callback",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SSO_PROVIDER_UNAVAILABLE });
  });

  it("rejects a redirectUri outside the allowed origins", async () => {
    const provider = {
      provider: "fake",
      buildAuthorizationUrl: vi.fn(),
    };
    const useCase = new StartSsoLoginUseCase(
      new Map([["fake", provider as never]]),
      { createLoginState: vi.fn() } as never,
      buildEnvironmentService(["http://localhost:3005"]),
    );

    await expect(
      useCase.execute({
        provider: "fake",
        redirectUri: "http://evil.example.com/sso/callback",
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.SSO_INVALID_REDIRECT });
    expect(provider.buildAuthorizationUrl).not.toHaveBeenCalled();
  });

  it("persists a login state and returns the authorization url", async () => {
    const provider = {
      provider: "fake",
      buildAuthorizationUrl: vi.fn(() => "https://provider.example.com/authorize"),
    };
    const ssoRepository = { createLoginState: vi.fn(async () => undefined) };
    const useCase = new StartSsoLoginUseCase(
      new Map([["fake", provider as never]]),
      ssoRepository as never,
      buildEnvironmentService(["http://localhost:3005"]),
    );

    const result = await useCase.execute({
      provider: "fake",
      redirectUri: "http://localhost:3005/sso/callback",
      testEmail: "someone@example.com",
    });

    expect(result).toEqual({
      authorizationUrl: "https://provider.example.com/authorize",
    });
    expect(ssoRepository.createLoginState).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "fake",
        redirectUri: "http://localhost:3005/sso/callback",
      }),
    );
    expect(provider.buildAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({ testEmail: "someone@example.com" }),
    );
  });

  it("allows an exact native redirect URI from SSO_REDIRECT_URIS", async () => {
    const provider = {
      provider: "fake",
      buildAuthorizationUrl: vi.fn(() => "https://provider.example.com/authorize"),
    };
    const ssoRepository = { createLoginState: vi.fn(async () => undefined) };
    const useCase = new StartSsoLoginUseCase(
      new Map([["fake", provider as never]]),
      ssoRepository as never,
      buildEnvironmentService([], ["myapp://sso/callback"]),
    );

    await useCase.execute({
      provider: "fake",
      redirectUri: "myapp://sso/callback",
    });

    expect(ssoRepository.createLoginState).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUri: "myapp://sso/callback",
      }),
    );
  });
});
