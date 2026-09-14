import "reflect-metadata";

import { MODULE_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";

import { hashRefreshToken } from "../../application/auth.helpers";
import { AUTH_TOKEN_PROVIDER } from "../../application/ports/auth-token.provider.port";
import { AuthModule } from "../../auth.module";
import { resolveRotationIdentity } from "../../domain/refresh-rotation.policy";
import { FakeAuthSessionRepository } from "../../testing/fake-auth-session.repository";
import {
  createTestEnvironmentService,
  createTestSessionTokenService,
} from "../../testing/session-token-test-harness";
import { SessionTokenService } from "../session-token.service";

const USER_ID = "user-1";
const ORG_ID = "org-1";
const METADATA = { ipAddress: "127.0.0.1", userAgent: "vitest" };

async function createFixture() {
  const store = new FakeAuthSessionRepository();
  const service = createTestSessionTokenService(store);
  const issued = await service.createSessionTokens(USER_ID, ORG_ID, METADATA);

  return { store, service, issued };
}

describe("SessionTokenService — signing and verification", () => {
  it("signs a pair that verifies with its own type and carries the session", async () => {
    const { service, issued } = await createFixture();

    const access = await service.verifyToken(issued.accessToken, "access");
    const refresh = await service.verifyToken(issued.refreshToken, "refresh");

    expect(access).toMatchObject({ sub: USER_ID, sid: issued.session.id, typ: "access", oid: ORG_ID });
    expect(refresh).toMatchObject({
      sub: USER_ID,
      sid: issued.session.id,
      typ: "refresh",
      oid: ORG_ID,
    });
  });

  it("rejects a token presented as the wrong type", async () => {
    const { service, issued } = await createFixture();

    // An access token must not be usable to refresh (and vice versa).
    await expect(service.verifyToken(issued.accessToken, "refresh")).rejects.toThrow();
    await expect(service.verifyToken(issued.refreshToken, "access")).rejects.toThrow();
  });

  it("rejects a tampered token", async () => {
    const { service, issued } = await createFixture();
    const tampered = `${issued.refreshToken.slice(0, -2)}xy`;

    await expect(service.verifyToken(tampered, "refresh")).rejects.toThrow();
  });

  it("rejects a token signed with a different secret", async () => {
    const store = new FakeAuthSessionRepository();
    const otherService = createTestSessionTokenService(
      store,
      createTestEnvironmentService({ JWT_REFRESH_SECRET: "another-refresh-secret-0123456789" }),
    );
    const { service } = await createFixture();
    const foreign = await otherService.signToken(USER_ID, "session-1", "refresh", ORG_ID);

    await expect(service.verifyToken(foreign, "refresh")).rejects.toThrow();
  });

  it("hashes the refresh token it stores, never the plaintext", async () => {
    const { store, issued } = await createFixture();

    expect(store.getSession(issued.session.id)?.refreshTokenHash).toBe(
      await hashRefreshToken(issued.refreshToken),
    );
    expect(store.getSession(issued.session.id)?.refreshTokenHash).not.toBe(issued.refreshToken);
  });
});

describe("SessionTokenService — compare-and-swap rotation", () => {
  it("swaps the hash only when the presented one is still current", async () => {
    const { store, service, issued } = await createFixture();

    const rotated = await service.tryRotateSessionTokens(
      issued.session.id,
      issued.session.refreshTokenHash,
      USER_ID,
      ORG_ID,
      METADATA,
    );

    expect(rotated).not.toBeNull();
    expect(rotated?.refreshToken).not.toBe(issued.refreshToken);
    const session = store.getSession(issued.session.id);
    expect(session?.refreshTokenHash).toBe(await hashRefreshToken(rotated!.refreshToken));
  });

  it("records the consumed hash and rotation time as the grace slot", async () => {
    const { store, service, issued } = await createFixture();

    await service.tryRotateSessionTokens(
      issued.session.id,
      issued.session.refreshTokenHash,
      USER_ID,
      ORG_ID,
      METADATA,
    );

    const session = store.getSession(issued.session.id);
    expect(session?.previousRefreshTokenHash).toBe(issued.session.refreshTokenHash);
    expect(session?.previousRotatedAt).toBeInstanceOf(Date);
  });

  it("returns null and leaves the row untouched on a stale hash", async () => {
    const { store, service, issued } = await createFixture();
    const before = store.getSession(issued.session.id);

    const rotated = await service.tryRotateSessionTokens(
      issued.session.id,
      "hash-of-a-superseded-token",
      USER_ID,
      ORG_ID,
      METADATA,
    );

    expect(rotated).toBeNull();
    expect(store.getSession(issued.session.id)).toEqual(before);
    expect(store.rotations).toHaveLength(0);
  });

  it("returns null for a revoked session", async () => {
    const { store, service, issued } = await createFixture();
    await store.revokeSession(issued.session.id);

    const rotated = await service.tryRotateSessionTokens(
      issued.session.id,
      issued.session.refreshTokenHash,
      USER_ID,
      ORG_ID,
      METADATA,
    );

    expect(rotated).toBeNull();
  });

  it("lets only one of two racing rotations win the swap", async () => {
    const { store, service, issued } = await createFixture();
    const expectedHash = issued.session.refreshTokenHash;

    const [first, second] = await Promise.all([
      service.tryRotateSessionTokens(issued.session.id, expectedHash, USER_ID, ORG_ID, METADATA),
      service.tryRotateSessionTokens(issued.session.id, expectedHash, USER_ID, ORG_ID, METADATA),
    ]);

    expect([first, second].filter((result) => result !== null)).toHaveLength(1);
    expect(store.rotations).toHaveLength(1);
  });
});

describe("SessionTokenService — replaying one rotation", () => {
  it("re-derives the exact pair the rotation issued", async () => {
    // This is the property the idempotent retry rests on: the same rotation
    // identity signs the same bytes, so a retry can be answered with the pair
    // that was already handed out instead of minting a competing one.
    const { store, service, issued } = await createFixture();

    const rotated = await service.tryRotateSessionTokens(
      issued.session.id,
      issued.session.refreshTokenHash,
      USER_ID,
      ORG_ID,
      METADATA,
    );
    const session = store.getSession(issued.session.id);

    const replayed = await service.replayRotationTokens({
      sessionId: issued.session.id,
      userId: USER_ID,
      organizationId: ORG_ID,
      consumedTokenHash: session!.previousRefreshTokenHash!,
      rotatedAt: session!.previousRotatedAt!,
    });

    expect(replayed.accessToken).toBe(rotated?.accessToken);
    expect(replayed.refreshToken).toBe(rotated?.refreshToken);
    expect(replayed.refreshTokenHash).toBe(session?.refreshTokenHash);
  });

  it("writes nothing: a replay is a pure re-derivation", async () => {
    const { store, service, issued } = await createFixture();
    const rotated = await service.tryRotateSessionTokens(
      issued.session.id,
      issued.session.refreshTokenHash,
      USER_ID,
      ORG_ID,
      METADATA,
    );
    const session = store.getSession(issued.session.id);
    const rotationsBefore = store.rotations.length;

    await service.replayRotationTokens({
      sessionId: issued.session.id,
      userId: USER_ID,
      organizationId: ORG_ID,
      consumedTokenHash: session!.previousRefreshTokenHash!,
      rotatedAt: session!.previousRotatedAt!,
    });

    expect(rotated).not.toBeNull();
    expect(store.rotations).toHaveLength(rotationsBefore);
    expect(store.getSession(issued.session.id)).toEqual(session);
  });

  it("derives a different pair when the rotation identity differs", async () => {
    const { store, service, issued } = await createFixture();
    await service.tryRotateSessionTokens(
      issued.session.id,
      issued.session.refreshTokenHash,
      USER_ID,
      ORG_ID,
      METADATA,
    );
    const session = store.getSession(issued.session.id);

    // Same session, different consuming rotation (its hash and time differ).
    const foreign = await service.replayRotationTokens({
      sessionId: issued.session.id,
      userId: USER_ID,
      organizationId: ORG_ID,
      consumedTokenHash: "some-other-consumed-hash",
      rotatedAt: session!.previousRotatedAt!,
    });

    expect(foreign.refreshTokenHash).not.toBe(session?.refreshTokenHash);
  });

  it("keys the identity on the organization, so a switched organization cannot replay", async () => {
    const { store, service, issued } = await createFixture();
    await service.tryRotateSessionTokens(
      issued.session.id,
      issued.session.refreshTokenHash,
      USER_ID,
      ORG_ID,
      METADATA,
    );
    const session = store.getSession(issued.session.id);

    const otherOrg = await service.replayRotationTokens({
      sessionId: issued.session.id,
      userId: USER_ID,
      organizationId: "org-2",
      consumedTokenHash: session!.previousRefreshTokenHash!,
      rotatedAt: session!.previousRotatedAt!,
    });

    expect(otherOrg.refreshTokenHash).not.toBe(session?.refreshTokenHash);
    expect(resolveRotationIdentity({
      sessionId: issued.session.id,
      userId: USER_ID,
      organizationId: "org-2",
      consumedTokenHash: session!.previousRefreshTokenHash!,
      rotatedAt: session!.previousRotatedAt!,
    })).not.toEqual(
      resolveRotationIdentity({
        sessionId: issued.session.id,
        userId: USER_ID,
        organizationId: ORG_ID,
        consumedTokenHash: session!.previousRefreshTokenHash!,
        rotatedAt: session!.previousRotatedAt!,
      }),
    );
  });
});

describe("SessionTokenService — SSO re-issue", () => {
  it("replaces the refresh hash without opening a grace window", async () => {
    const { store, service, issued } = await createFixture();

    const reissued = await service.reissueSessionTokens(
      issued.session.id,
      USER_ID,
      ORG_ID,
      METADATA,
    );

    const session = store.getSession(issued.session.id);
    expect(session?.refreshTokenHash).toBe(await hashRefreshToken(reissued.refreshToken));
    // No previous hash means no token can be replayed after an SSO exchange.
    expect(session?.previousRefreshTokenHash).toBeNull();
    expect(session?.previousRotatedAt).toBeNull();
  });
});

describe("SessionTokenService — wiring", () => {
  it("is the implementation bound to AUTH_TOKEN_PROVIDER", () => {
    const providers = (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthModule) ??
      []) as unknown[];

    expect(providers).toContainEqual({
      provide: AUTH_TOKEN_PROVIDER,
      useExisting: SessionTokenService,
    });
  });
});
