// Pure domain rules for refresh-token rotation. Framework-free (see ADR 0001).
//
// Rotation is strict (one active refresh token per session) with a short grace
// window for the immediately-previous token. Without the grace, N concurrent
// requests that all hold the same token (parallel tabs, dashboard fan-out)
// race the rotation CAS: one wins, the rest are misclassified as token theft
// and the whole session gets revoked.

/** How long the previous refresh token stays acceptable after a rotation. */
export const REFRESH_ROTATION_GRACE_MS = 60_000;

export type RefreshAttemptDecision =
  /** Token is the current one — rotate normally. */
  | { action: "rotate" }
  /** Token is the previous one inside the grace window — rotate, but keep the
   *  original pre-race token as `previous` so later racers still qualify. */
  | { action: "grace-rotate" }
  /** Token matches neither current nor an in-grace previous — treat as reuse. */
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
      return { action: "grace-rotate" };
    }
  }

  return { action: "reuse" };
}
