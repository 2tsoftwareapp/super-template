"use client";

import { cn } from "../utils";
import { Card, CardDescription, CardHeader, CardTitle } from "./card";
import { Spinner } from "./spinner";

interface FullScreenLoadingProps {
  title?: string;
  description?: string;
  className?: string;
}

export function FullScreenLoading({
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
        {/* Glow backdrop behind spinner */}
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

export function SectionLoading({
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
