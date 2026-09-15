import { describe, expect, it } from "vitest";

import {
  REFRESH_ROTATION_GRACE_MS,
  resolveRefreshAttempt,
  resolveRotationIdentity,
} from "../refresh-rotation.policy";

const now = new Date("2026-07-12T00:00:00Z");

describe("resolveRefreshAttempt", () => {
  it("rotates normally when the token matches the current hash", () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: true,
        matchesPrevious: false,
        previousRotatedAt: null,
        now,
      }),
    ).toEqual({ action: "rotate" });
  });

  it("replays when the token is the previous one within the window", () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: true,
        previousRotatedAt: new Date(now.getTime() - 5_000),
        now,
      }),
    ).toEqual({ action: "replay" });
  });

  it("replays the previous token exactly at the grace boundary", () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: true,
        previousRotatedAt: new Date(now.getTime() - REFRESH_ROTATION_GRACE_MS),
        now,
      }),
    ).toEqual({ action: "replay" });
  });

  it("flags reuse when the previous token is past the grace window", () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: true,
        previousRotatedAt: new Date(now.getTime() - REFRESH_ROTATION_GRACE_MS - 1),
        now,
      }),
    ).toEqual({ action: "reuse" });
  });

  it("flags reuse when the previous token matches but rotation time is unknown", () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: true,
        previousRotatedAt: null,
        now,
      }),
    ).toEqual({ action: "reuse" });
  });

  it("flags reuse when the token matches nothing", () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: false,
        previousRotatedAt: new Date(now.getTime() - 1_000),
        now,
      }),
    ).toEqual({ action: "reuse" });
  });

  it("flags reuse for a previousRotatedAt in the future (clock skew safety)", () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: true,
        previousRotatedAt: new Date(now.getTime() + 10_000),
        now,
      }),
    ).toEqual({ action: "reuse" });
  });
});

describe("resolveRotationIdentity", () => {
  const base = {
    sessionId: "session-1",
    userId: "user-1",
    organizationId: "org-1",
    consumedTokenHash: "a".repeat(64),
    rotatedAt: new Date("2026-07-12T00:00:00.000Z"),
  };

  it("is deterministic: the same rotation yields the same identity", () => {
    expect(resolveRotationIdentity(base)).toEqual(resolveRotationIdentity({ ...base }));
  });

  it("is stable across sub-second drift, so a replay signs the same tokens", () => {
    // `rotatedAt` is stored with microsecond precision and read back as
    // milliseconds; the identity must not change with the fractional part or a
    // replay would mint a different pair than the rotation issued.
    const withMillis = resolveRotationIdentity({
      ...base,
      rotatedAt: new Date("2026-07-12T00:00:00.987Z"),
    });

    expect(withMillis).toEqual(resolveRotationIdentity(base));
  });

  it("separates token types so access and refresh ids differ", () => {
    const identity = resolveRotationIdentity(base);

    expect(identity.accessJti).not.toBe(identity.refreshJti);
  });

  it("changes when the consumed token, session, user or organization changes", () => {
    const identity = resolveRotationIdentity(base);
    const variations = [
      { consumedTokenHash: "b".repeat(64) },
      { sessionId: "session-2" },
      { userId: "user-2" },
      { organizationId: "org-2" },
      { organizationId: null },
      { rotatedAt: new Date("2026-07-12T00:00:01.000Z") },
    ];

    for (const variation of variations) {
      expect(resolveRotationIdentity({ ...base, ...variation })).not.toEqual(identity);
    }
  });

  it("never exposes the consumed hash verbatim in the token id", () => {
    const identity = resolveRotationIdentity(base);

    expect(identity.accessJti).not.toContain(base.consumedTokenHash);
    expect(identity.accessJti).toMatch(/^rot-a-[0-9a-f]{64}$/);
  });
});
