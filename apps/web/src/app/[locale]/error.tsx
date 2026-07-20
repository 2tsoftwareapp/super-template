"use client"; // Error boundaries must be Client Components.

import { ErrorFallback } from "@repo/web-ui/error-fallback";
import { useEffect } from "react";

/**
 * Locale-segment error boundary — mirrors apps/admin. Catches render errors
 * from every page and nested layout below `[locale]`; failures in
 * `[locale]/layout.tsx` itself bubble to `app/global-error.tsx`.
 * See CODING_RULES.md §18.2.
 */
export default function LocaleError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[web] unhandled render error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return <ErrorFallback error={error} onRetry={unstable_retry} />;
}
