"use client";

import { cn } from "../utils";
import { Card, CardDescription, CardHeader, CardTitle } from "./card";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";

interface FullScreenLoadingProps {
  title?: string;
  description?: string;
  className?: string;
}

function FullScreenLoading({
  title = "Restoring session",
  description = "Loading authorization and workspace settings...",
  className,
}: FullScreenLoadingProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md transition-all duration-300",
        className,
      )}
    >
      <div className="relative w-full max-w-xs text-center space-y-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-20 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <Card className="border border-border/50 bg-card/90 shadow-2xl relative">
          <CardHeader className="items-center gap-3.5 pt-6 pb-6 px-5">
            <div className="relative">
              <Spinner className="size-6 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                {title}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground leading-normal">
                {description}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

interface SectionLoadingProps {
  title?: string;
  className?: string;
}

function SectionLoading({
  title = "Loading data...",
  className,
}: SectionLoadingProps) {
  return (
    <div
      className={cn(
        "flex min-h-48 w-full flex-col items-center justify-center gap-2.5 p-6 text-center transition-all",
        className,
      )}
    >
      <Spinner className="size-5 text-primary" />
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
    </div>
  );
}

interface PageLoadingProps {
  className?: string;
}

function PageLoading({ className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-col",
        className,
      )}
    >
      {/* Top nav skeleton */}
      <div className="flex h-14 items-center gap-3 border-b px-6">
        <Skeleton className="size-8 rounded-full" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      {/* Page content skeleton */}
      <div className="flex flex-1 gap-6 p-6">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="pt-4 space-y-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-3/4 rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-5/6 rounded-md" />
          </div>
        </div>
        <div className="hidden w-72 space-y-4 lg:block">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  spinnerSize?: string;
  className?: string;
}

function LoadingOverlay({
  loading,
  children,
  spinnerSize = "size-6",
  className,
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px] transition-all">
          <Spinner className={cn("text-primary", spinnerSize)} />
        </div>
      )}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header row */}
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`h-${i}`}
            className={cn("h-4", i === 0 ? "w-32" : i === columns - 1 ? "w-20" : "flex-1")}
          />
        ))}
      </div>
      {/* Data rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`r-${r}`} className="flex gap-4 py-3">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={`c-${r}-${c}`}
                className={cn(
                  "h-4",
                  c === 0 ? "w-32" : c === columns - 1 ? "w-20" : "flex-1",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  FullScreenLoading,
  LoadingOverlay,
  PageLoading,
  SectionLoading,
  TableSkeleton,
};
