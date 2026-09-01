"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/web-ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { useI18n } from "@/lib/i18n";

/**
 * App-level route segment error boundary.
 * Displays localized copy, error digest correlation code, and reset retry action.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error("[admin-app] Unhandled segment error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  let title = "Something went wrong";
  let description = "An unexpected error occurred while loading this section.";
  let digestLabel = "Error digest";
  let resetLabel = "Try again";

  try {
    const translatedTitle = t("errors.title");
    if (translatedTitle && !translatedTitle.startsWith("errors.")) {
      title = translatedTitle;
    }
    const translatedDesc = t("errors.description");
    if (translatedDesc && !translatedDesc.startsWith("errors.")) {
      description = translatedDesc;
    }
    const translatedDigest = t("errors.digest");
    if (translatedDigest && !translatedDigest.startsWith("errors.")) {
      digestLabel = translatedDigest;
    }
    const translatedReset = t("errors.reset");
    if (translatedReset && !translatedReset.startsWith("errors.")) {
      resetLabel = translatedReset;
    }
  } catch {
    // Fall back to defaults if translation lookup encounters an issue
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/30 bg-card shadow-lg">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-1">
          {error.digest ? (
            <div className="rounded-md border border-border/60 bg-muted/50 px-3 py-2 text-xs">
              <span className="font-medium text-muted-foreground">{digestLabel}: </span>
              <code className="font-mono font-semibold text-foreground">{error.digest}</code>
            </div>
          ) : null}
          {error.message && process.env.NODE_ENV !== "production" ? (
            <p className="break-all rounded-md border border-border/40 bg-muted/30 p-2.5 font-mono text-[11px] text-muted-foreground">
              {error.message}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t border-border/40 pt-3">
          <Button variant="default" size="sm" onClick={() => reset()} className="gap-1.5">
            <RotateCcw className="size-3.5" />
            {resetLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
