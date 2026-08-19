"use client";

import { classifyError } from "@repo/web-utils/errors";
import * as React from "react";

import { ErrorState } from "./error-state";

interface ErrorFallbackProps {
  /** The error handed over by a Next.js error boundary or React ErrorBoundary. */
  error: Error & { digest?: string };
  /**
   * Re-renders the failed segment — pass Next.js's `unstable_retry`. Omit when
   * recovery is not possible.
   */
  onRetry?: () => void;
  /** Overrides the classified title (e.g. per-route wording). */
  title?: string;
  variant?: "full-page" | "inline";
}

/**
 * Shared presentation for caught render errors. Classifies the error so the
 * copy and the retry affordance match its kind, and never renders the raw
 * message for unknown errors — those can carry internals. See CODING_RULES.md §18.
 */
function ErrorFallback({ error, onRetry, title, variant = "full-page" }: ErrorFallbackProps) {
  const classified = classifyError(error);

  return (
    <ErrorState
      variant={variant}
      title={title ?? "Something went wrong"}
      description={
        classified.status
          ? classified.message
          : // Unclassified render errors: show generic copy plus the digest so
            // support can correlate with server logs.
            `${classified.message}${error.digest ? ` (ref: ${error.digest})` : ""}`
      }
      // A caught render error is always worth one retry — the boundary re-runs
      // the segment, which is a different attempt than re-issuing a request.
      {...(onRetry ? { action: { label: "Try again", onClick: onRetry } } : {})}
    />
  );
}

export { ErrorFallback };
