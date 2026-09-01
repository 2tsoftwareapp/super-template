import { Card, CardContent, CardHeader } from "@repo/web-ui/card";
import { Skeleton } from "@repo/web-ui/skeleton";

/**
 * App-level route segment loading skeleton.
 * Matches ResourcePageShell layout with stat cards and tabular data skeleton.
 */
export default function AppLoading() {
  return (
    <div
      className="flex flex-col gap-6 animate-pulse"
      aria-busy="true"
      aria-live="polite"
      data-testid="app-loading-skeleton"
    >
      {/* Shell header skeleton */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Skeleton className="hidden size-11 shrink-0 rounded-xl sm:block" />
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-4 w-80 max-w-full rounded-md" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Top stat / summary cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="size-4 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content / Table skeleton */}
      <Card className="border-border/60">
        {/* Toolbar skeleton */}
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Skeleton className="h-9 w-full max-w-sm rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>

        {/* Table skeleton */}
        <CardContent className="p-0">
          <div className="w-full">
            {/* Table header */}
            <div className="flex items-center gap-4 border-b border-border/60 bg-muted/40 px-4 py-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
              <div className="flex-1" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>

            {/* Table rows */}
            <div className="divide-y divide-border/60">
              {Array.from({ length: 6 }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex items-center gap-4 px-4 py-3.5">
                  <Skeleton className="size-4 rounded" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-24 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-28 rounded" />
                  <div className="flex-1" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
              <Skeleton className="h-4 w-32 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
