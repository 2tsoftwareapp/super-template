import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";
import { describe, expect, it, vi } from "vitest";

import { REFRESH_ROTATION_GRACE_MS } from "../../../domain/refresh-rotation.policy";
import { FakeAuthSessionRepository } from "../../../testing/fake-auth-session.repository";
import { createTestSessionTokenService } from "../../../testing/session-token-test-harness";
import { hashRefreshToken, verifyRefreshTokenHash } from "../../auth.helpers";
import { AuthMapper } from "../../auth.mapper";
import { RefreshSessionUseCase } from "../refresh-session.use-case";

const USER_ID = "user-1";
const ORG_ID = "org-1";

/** A tab: holds one refresh token and can call the real use case with it. */
type Tab = {
  refreshToken: string;
  refresh: () => Promise<{ accessToken: string; refreshToken: string }>;
};

type Harness = Awaited<ReturnType<typeof createHarness>>;

/**
 * Wires the real `RefreshSessionUseCase` to the real `SessionTokenService`
 * (real JWT signing, real hashing) over the in-memory session store, with fake
 * access-profile / organization / user ports. Nothing about rotation is
 * stubbed, so a race here is a real race.
 */
async function createHarness() {
  const store = new FakeAuthSessionRepository();
  const tokenService = createTestSessionTokenService(store);
  const useCase = new RefreshSessionUseCase(
    store.asPort(),
    {
      findById: vi.fn(async () => ({
        id: USER_ID,
        status: "ACTIVE",
        email: "user@example.local",
        displayName: "User One",
        avatarUrl: null,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        mustChangePassword: false,
      })),
    } as never,
    {
      getAccessProfile: vi.fn(async () => ({ roles: ["USER"], permissions: [] })),
    } as never,
    { resolveOrganizationIdForUser: vi.fn(async () => ORG_ID) } as never,
    tokenService,
    new AuthMapper(),
  );

  const issued = await tokenService.createSessionTokens(USER_ID, ORG_ID, {
    ipAddress: null,
    userAgent: null,
  });

  return {
    store,
    useCase,
    sessionId: issued.session.id,
    liveRefreshToken: issued.refreshToken,
    /** A well-formed refresh token for this session that was never issued to it. */
    foreignRefreshToken: () =>
      tokenService.signToken(USER_ID, issued.session.id, "refresh", ORG_ID),
    openTab: (refreshToken: string): Tab => ({
      refreshToken,
      refresh: async () => {
        const result = await useCase.execute({ refreshToken });
        return { accessToken: result.accessToken, refreshToken: result.refreshToken };
      },
    }),
    currentRefreshHash: () => store.getSession(issued.session.id)?.refreshTokenHash ?? "",
  };
}

describe("RefreshSessionUseCase — concurrent refreshes of the same rotation", () => {
  it("returns the same token pair to every tab that presents the same token", async () => {
    // Three tabs hold the same refresh token and fire at the same moment
    // (network retry, dashboard fan-out, wake-from-sleep). They are retries of
    // ONE rotation, so they must not each mint a pair — the pairs issued to the
    // losers would be dead on arrival, and the session would be revoked as soon
    // as one of them is presented again.
    const harness = await createHarness();
    const tabs = Array.from({ length: 3 }, () => harness.openTab(harness.liveRefreshToken));

    const results = await Promise.all(tabs.map((tab) => tab.refresh()));

    expect(new Set(results.map((result) => result.refreshToken)).size).toBe(1);

    // Exactly one rotation reached the database.
    expect(harness.store.rotations).toHaveLength(1);
    expect(harness.store.revokedSessionIds).toEqual([]);
  });

  it("keeps the pair it handed to a tab as the session's live pair", async () => {
    // The consequence of the previous test: whatever pair a tab receives must
    // still be the session's current pair afterwards. Otherwise that tab's next
    // refresh presents a token the session no longer knows, reuse detection
    // fires, and a legitimate user is logged out.
    const harness = await createHarness();
    const [tabA, tabB] = Array.from({ length: 2 }, () =>
      harness.openTab(harness.liveRefreshToken),
    );

    const [first, second] = await Promise.all([tabA.refresh(), tabB.refresh()]);

    expect(await hashRefreshToken(first.refreshToken)).toBe(harness.currentRefreshHash());
    expect(await hashRefreshToken(second.refreshToken)).toBe(harness.currentRefreshHash());

    // Tab A comes back afterwards with the token it was handed. Inside the
    // grace window that must be accepted, not treated as reuse.
    const next = await tabA.refresh();
    expect(harness.store.revokedSessionIds).toEqual([]);
    expect(await hashRefreshToken(next.refreshToken)).toBe(harness.currentRefreshHash());
  });

  it("does not revoke the session when a retry loses the rotation race", async () => {
    // Four racers, one rotation: the losers must resolve by re-reading the
    // session, not by giving up and revoking.
    const harness = await createHarness();
    const tabs = Array.from({ length: 4 }, () => harness.openTab(harness.liveRefreshToken));

    const results = await Promise.all(tabs.map((tab) => tab.refresh()));

    expect(results).toHaveLength(4);
    expect(new Set(results.map((result) => result.refreshToken)).size).toBe(1);
    expect(harness.store.rotations).toHaveLength(1);
    expect(harness.store.revokedSessionIds).toEqual([]);
  });
});

describe("RefreshSessionUseCase — rotation state and reuse detection", () => {
  it("moves the presented hash into the grace slot when it rotates", async () => {
    const harness = await createHarness();
    const presented = harness.liveRefreshToken;

    const result = await harness.openTab(presented).refresh();
    const session = harness.store.getSession(harness.sessionId);

    expect(result.refreshToken).not.toBe(presented);
    expect(session?.refreshTokenHash).toBe(await hashRefreshToken(result.refreshToken));
    expect(
      await verifyRefreshTokenHash(session?.previousRefreshTokenHash ?? "", presented),
    ).toBe(true);
    expect(session?.previousRotatedAt).toBeInstanceOf(Date);
    expect(harness.store.revokedSessionIds).toEqual([]);
  });

  it("revokes the session when the previous token is outside the grace window", async () => {
    const harness = await createHarness();
    // Rotate once, then age the window past the grace period.
    const rotated = await harness.openTab(harness.liveRefreshToken).refresh();
    await harness.store.updateSession(harness.sessionId, {
      previousRotatedAt: new Date(Date.now() - REFRESH_ROTATION_GRACE_MS - 1_000),
    });

    await expect(harness.openTab(harness.liveRefreshToken).refresh()).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
    });
    expect(harness.store.revokedSessionIds).toEqual([harness.sessionId]);
    // The token issued by the rotation is untouched by the revocation decision.
    expect(rotated.refreshToken).toBeTruthy();
  });

  it("revokes the session for a token that is neither current nor previous", async () => {
    const harness = await createHarness();
    const foreign = await harness.foreignRefreshToken();

    await expect(harness.openTab(foreign).refresh()).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
    });
    expect(harness.store.revokedSessionIds).toEqual([harness.sessionId]);
  });

  it("rejects a token that is not a usable refresh token without touching the session", async () => {
    const harness = await createHarness();

    await expect(harness.openTab("not-a-jwt").refresh()).rejects.toMatchObject({
      code: "AUTH_UNAUTHORIZED",
    });
    expect(harness.store.revokedSessionIds).toEqual([]);
    expect(harness.store.rotations).toHaveLength(0);
  });

  it("revokes an expired session and reports the expiry", async () => {
    const harness = await createHarness();
    await harness.store.updateSession(harness.sessionId, {
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(harness.openTab(harness.liveRefreshToken).refresh()).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.AUTH_SESSION_EXPIRED,
    });
    expect(harness.store.revokedSessionIds).toEqual([harness.sessionId]);
  });
});
