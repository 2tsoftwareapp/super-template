import { describe, expect, it } from "vitest";

import { apiPaths, SSO_PROVIDERS } from "../api-paths";

const testRedirectUri = "http://localhost:3002/login/sso/callback?from=/users";

describe("apiPaths", () => {
  it("centralizes auth BFF paths", () => {
    expect(apiPaths.auth.login).toBe("/api/auth/login");
    expect(apiPaths.auth.logout).toBe("/api/auth/logout");
    expect(apiPaths.auth.mfaVerifyChallenge).toBe(
      "/api/auth/mfa/verify-challenge",
    );
  });

  it("encodes SSO start redirect URIs", () => {
    expect(apiPaths.auth.ssoStart(SSO_PROVIDERS.google, testRedirectUri)).toBe(
      "/api/auth/sso/google/start?redirectUri=http%3A%2F%2Flocalhost%3A3002%2Flogin%2Fsso%2Fcallback%3Ffrom%3D%2Fusers",
    );
  });
});
