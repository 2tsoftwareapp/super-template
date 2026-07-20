"use client"; // Error boundaries must be Client Components.

import { ErrorFallback } from "@repo/web-ui/error-fallback";
import { useEffect } from "react";

/**
 * Locale-segment error boundary — the app's outermost recoverable surface.
 * Catches render errors from every page and nested layout below `[locale]`.
 * Errors thrown by `[locale]/layout.tsx` itself bubble past this file to
 * `app/global-error.tsx`. See CODING_RULES.md §18.2.
 */
export default function LocaleError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Server Component errors arrive here with a generic message; `digest` is
    // the only handle back to the server log entry.
    console.error("[admin] unhandled render error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return <ErrorFallback error={error} onRetry={unstable_retry} />;
}
