// Pure domain rules for refresh-token rotation. Framework-free (see ADR 0001).
//
// Rotation is strict (one active refresh token per session) with a short grace
// window for the token the current rotation consumed. The grace exists because
// N concurrent requests can all hold the same token (parallel tabs, dashboard
// fan-out, a client retrying a dropped response): without it, one request
// rotates, the rest look like token theft, and a legitimate session dies.
//
// Inside the window a token identifies ONE rotation — not "a request that
// should rotate again". The only correct answer for a token the current
// rotation already consumed is that rotation's own result, so the decision is
// `replay`, never a second rotation. Rotating again would hand out a pair that
// is superseded before it is used, and the next request presenting that pair
// would trip reuse detection.

import { createHash } from "node:crypto";

/** How long the token consumed by the current rotation stays acceptable. */
export const REFRESH_ROTATION_GRACE_MS = 60_000;

export type RefreshAttemptDecision =
  /** Presented the current token — start a new rotation. */
  | { action: "rotate" }
  /** Presented the token the current rotation consumed, inside the window —
   *  return that rotation's already-issued pair (idempotent retry). */
  | { action: "replay" }
  /** Matches neither the current token nor the in-grace consumed one — reuse. */
  | { action: "reuse" };

export function resolveRefreshAttempt(input: {
  matchesCurrent: boolean;
  matchesPrevious: boolean;
  previousRotatedAt: Date | null;
  now?: Date;
}): RefreshAttemptDecision {
  if (input.matchesCurrent) {
    return { action: "rotate" };
  }

  if (input.matchesPrevious && input.previousRotatedAt) {
    const now = input.now?.getTime() ?? Date.now();
    const age = now - input.previousRotatedAt.getTime();

    if (age >= 0 && age <= REFRESH_ROTATION_GRACE_MS) {
      return { action: "replay" };
    }
  }

  return { action: "reuse" };
}

/**
 * Deterministic identity of one rotation. Signing a token pair from the same
 * identity reproduces that pair byte for byte, which is what makes a retry of
 * one rotation idempotent without storing issued plaintext tokens.
 *
 * The inputs are the rotation's durable state — the session, the token it
 * consumed, and when it happened. The rotating request and any later replay
 * derive them from the same session row, so both land on the same identity.
 *
 * Rollout note: rotations performed before this rule existed stored a random
 * `jti`, so their pair is not derivable. A retry of such a rotation, inside its
 * 60 s window and after the deploy, fails closed (reuse → revoke) instead of
 * replaying. The situation cannot outlive that window — the session re-rotates
 * on its next refresh — and is the only case a replay cannot reproduce.
 */
export interface RotationIdentity {
  accessJti: string;
  refreshJti: string;
  /** Whole seconds; the JWT `iat` claim and the base for `exp`. */
  issuedAtSeconds: number;
}

export function resolveRotationIdentity(input: {
  sessionId: string;
  userId: string;
  organizationId: string | null;
  consumedTokenHash: string;
  rotatedAt: Date;
}): RotationIdentity {
  const issuedAtSeconds = Math.floor(input.rotatedAt.getTime() / 1000);
  const seed = [
    input.sessionId,
    input.userId,
    input.organizationId ?? "",
    input.consumedTokenHash,
    String(issuedAtSeconds),
  ].join("|");

  return {
    accessJti: jti(seed, "access"),
    refreshJti: jti(seed, "refresh"),
    issuedAtSeconds,
  };
}

/** Opaque, deterministic id per (rotation, token type). */
const jti = (seed: string, type: "access" | "refresh"): string =>
  `rot-${type === "access" ? "a" : "r"}-${createHash("sha256")
    .update(`${seed}|${type}`)
    .digest("hex")}`;
