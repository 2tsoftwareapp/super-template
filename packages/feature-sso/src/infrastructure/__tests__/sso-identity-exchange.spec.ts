import { afterEach, describe, expect, it, vi } from "vitest";

import type { EnvironmentService } from "@repo/api-runtime";

import type { SsoRepositoryPort } from "../../application/ports/sso.repository.port";
import { FakeSsoAdapter } from "../fake-sso.adapter";
import { GithubSsoAdapter } from "../github-sso.adapter";

/**
 * In-memory stand-in for t_sso_login_states that mirrors the repository's CAS
 * consume semantics exactly one time per handle. Several "instances" (adapter +
 * repository pairs) share one store, the way several API processes share one
 * database.
 */
function createSharedIdentityStore() {
  let seq = 0;
  const rows = new Map<
    string,
    { identity: unknown; nonce: string; expiresAt: Date; consumedAt: Date | null }
  >();

  const storeIdentityExchange = vi.fn(
    async (values: { identity: unknown; nonce: string; expiresAt: Date }) => {
      const handle = `handle-${String(++seq).padStart(4, "0")}`;
      rows.set(handle, { ...values, consumedAt: null });
      return handle;
    },
  );

  const consumeIdentityExchange = vi.fn(async (handle: string) => {
    const row = rows.get(handle);

    if (!row || row.consumedAt !== null || row.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    // CAS: only one caller can observe the row as unconsumed per event-loop
    // turn, mirroring the single-statement UPDATE ... WHERE consumed_at IS NULL.
    row.consumedAt = new Date();

    return { identity: row.identity, nonce: row.nonce };
  });

  return { rows, storeIdentityExchange, consumeIdentityExchange };
}

function repositoryInstance(
  store: ReturnType<typeof createSharedIdentityStore>,
): SsoRepositoryPort {
  // A fresh repository object backed by the SAME store models a second API
  // instance with its own in-memory cache but the same database.
  return {
    storeIdentityExchange: store.storeIdentityExchange,
    consumeIdentityExchange: store.consumeIdentityExchange,
  } as unknown as SsoRepositoryPort;
}

const buildEnvironment = (values: Record<string, unknown>) =>
  ({ values }) as unknown as EnvironmentService;

const jsonResponse = (body: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  json: async () => body,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SSO identity exchange (DB-backed, cross-instance)", () => {
  describe("fake provider", () => {
    it("issues the code on instance A and redeems it exactly once on instance B", async () => {
      const store = createSharedIdentityStore();
      const instanceA = new FakeSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({ API_INTERNAL_URL: "http://api.internal" }),
      );
      const instanceB = new FakeSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({ API_INTERNAL_URL: "http://api.internal" }),
      );

      const authorizationUrl = await instanceA.buildAuthorizationUrl({
        state: "state-1",
        nonce: "nonce-1",
        codeChallenge: "challenge-1",
        testEmail: "someone@example.test",
      });
      const code = new URL(authorizationUrl).searchParams.get("code");

      const tokenSet = await instanceB.exchangeCode({ code: code!, codeVerifier: "verifier" });
      const identity = await instanceB.verifyIdToken(tokenSet.idToken, "nonce-1");

      expect(identity).toMatchObject({
        email: "someone@example.test",
        emailVerified: true,
      });

      // One-time consume: a second verification on any instance is refused.
      await expect(instanceB.verifyIdToken(tokenSet.idToken, "nonce-1")).rejects.toThrow(
        "Unknown fake id token",
      );
      await expect(instanceA.verifyIdToken(tokenSet.idToken, "nonce-1")).rejects.toThrow(
        "Unknown fake id token",
      );
    });

    it("rejects a nonce that does not match the login state", async () => {
      const store = createSharedIdentityStore();
      const instanceA = new FakeSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({ API_INTERNAL_URL: "http://api.internal" }),
      );
      const instanceB = new FakeSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({ API_INTERNAL_URL: "http://api.internal" }),
      );

      const authorizationUrl = await instanceA.buildAuthorizationUrl({
        state: "state-1",
        nonce: "nonce-1",
        codeChallenge: "challenge-1",
      });
      const code = new URL(authorizationUrl).searchParams.get("code");

      const tokenSet = await instanceB.exchangeCode({ code: code!, codeVerifier: "verifier" });

      await expect(instanceB.verifyIdToken(tokenSet.idToken, "other-nonce")).rejects.toThrow(
        "Nonce mismatch",
      );
    });

    it("rejects an unknown code at verify time", async () => {
      const store = createSharedIdentityStore();
      const instanceB = new FakeSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({ API_INTERNAL_URL: "http://api.internal" }),
      );

      await expect(instanceB.verifyIdToken("no-such-handle", "nonce-1")).rejects.toThrow(
        "Unknown fake id token",
      );
    });

    it("refuses an expired exchange", async () => {
      const store = createSharedIdentityStore();
      const instanceB = new FakeSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({ API_INTERNAL_URL: "http://api.internal" }),
      );

      const handle = await store.storeIdentityExchange({
        identity: { subject: "s", email: "e@example.test", emailVerified: true },
        nonce: "n",
        expiresAt: new Date(Date.now() - 1_000),
      });

      await expect(instanceB.verifyIdToken(handle, "n")).rejects.toThrow("Unknown fake id token");
    });
  });

  describe("github provider", () => {
    const stubGithubApis = (emails: unknown, user = { id: 42, login: "octocat" }) => {
      const fetchMock = vi.fn(async (input: unknown) => {
        const url = String(input);
        if (url.startsWith("https://github.com/login/oauth/access_token")) {
          return jsonResponse({ access_token: "gho_test_token" });
        }
        if (url.startsWith("https://api.github.com/user/emails")) {
          return jsonResponse(emails);
        }
        if (url.startsWith("https://api.github.com/user")) {
          return jsonResponse(user);
        }
        return jsonResponse({ message: "unexpected" }, false);
      });
      vi.stubGlobal("fetch", fetchMock);
      return fetchMock;
    };

    it("stores the identity on instance A during exchange and consumes it once on instance B", async () => {
      stubGithubApis([{ email: "octocat@example.com", primary: true, verified: true }]);
      const store = createSharedIdentityStore();
      const instanceA = new GithubSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({
          GITHUB_CLIENT_ID: "client-id",
          GITHUB_CLIENT_SECRET: "client-secret",
          API_INTERNAL_URL: "http://api.internal",
        }),
      );
      const instanceB = new GithubSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({
          GITHUB_CLIENT_ID: "client-id",
          GITHUB_CLIENT_SECRET: "client-secret",
          API_INTERNAL_URL: "http://api.internal",
        }),
      );

      const tokenSet = await instanceA.exchangeCode({ code: "gh-code", codeVerifier: "verifier" });
      const identity = await instanceB.verifyIdToken(tokenSet.idToken, "");

      expect(identity).toEqual({
        subject: "github:42",
        email: "octocat@example.com",
        emailVerified: true,
      });

      // One-time consume: replaying the same handle on either instance fails.
      await expect(instanceB.verifyIdToken(tokenSet.idToken, "")).rejects.toThrow(
        "GitHub identity not found or already consumed",
      );
      await expect(instanceA.verifyIdToken(tokenSet.idToken, "")).rejects.toThrow(
        "GitHub identity not found or already consumed",
      );
    });

    it("lets only one of two racing verifications win (CAS consume)", async () => {
      stubGithubApis([{ email: "octocat@example.com", primary: true, verified: true }]);
      const store = createSharedIdentityStore();
      const instanceA = new GithubSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({
          GITHUB_CLIENT_ID: "client-id",
          GITHUB_CLIENT_SECRET: "client-secret",
          API_INTERNAL_URL: "http://api.internal",
        }),
      );
      const instanceB = new GithubSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({
          GITHUB_CLIENT_ID: "client-id",
          GITHUB_CLIENT_SECRET: "client-secret",
          API_INTERNAL_URL: "http://api.internal",
        }),
      );

      const tokenSet = await instanceA.exchangeCode({ code: "gh-code", codeVerifier: "verifier" });

      const [first, second] = await Promise.allSettled([
        instanceA.verifyIdToken(tokenSet.idToken, ""),
        instanceB.verifyIdToken(tokenSet.idToken, ""),
      ]);

      const winners = [first, second].filter((r) => r.status === "fulfilled");
      const losers = [first, second].filter((r) => r.status === "rejected");

      expect(winners).toHaveLength(1);
      expect(losers).toHaveLength(1);
      expect((losers[0] as PromiseRejectedResult).reason).toBeInstanceOf(Error);
    });

    it("rejects the exchange when GitHub returns no primary email at all", async () => {
      stubGithubApis([]);
      const store = createSharedIdentityStore();
      const instanceA = new GithubSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({
          GITHUB_CLIENT_ID: "client-id",
          GITHUB_CLIENT_SECRET: "client-secret",
          API_INTERNAL_URL: "http://api.internal",
        }),
      );

      await expect(
        instanceA.exchangeCode({ code: "gh-code", codeVerifier: "verifier" }),
      ).rejects.toThrow("no verified primary email");
      expect(store.storeIdentityExchange).not.toHaveBeenCalled();
    });

    it("stores an unverified-email identity for the use case to reject (existing behavior)", async () => {
      stubGithubApis([{ email: "octocat@example.com", primary: true, verified: false }]);
      const store = createSharedIdentityStore();
      const instanceA = new GithubSsoAdapter(
        repositoryInstance(store),
        buildEnvironment({
          GITHUB_CLIENT_ID: "client-id",
          GITHUB_CLIENT_SECRET: "client-secret",
          API_INTERNAL_URL: "http://api.internal",
        }),
      );

      const tokenSet = await instanceA.exchangeCode({ code: "gh-code", codeVerifier: "verifier" });

      // Email-verification policy stays in HandleSsoCallbackUseCase; the adapter
      // only surfaces what GitHub reported.
      const identity = await instanceA.verifyIdToken(tokenSet.idToken, "");
      expect(identity).toMatchObject({
        email: "octocat@example.com",
        emailVerified: false,
      });
    });
  });
});
