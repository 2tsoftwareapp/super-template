import type { ReactNode } from "react";

import type { AdminResourceConfig } from "@/lib/admin-resources";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";

export function ResourcePageShell({
  resource,
  title,
  description,
  actions,
  meta,
  isRefreshing,
  onRefresh,
  children,
}: {
  resource: AdminResourceConfig;
  title?: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
}) {
  const Icon = resource.icon;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          <Badge variant="outline" className="w-fit">
            {resource.group}
          </Badge>
          <div className="flex items-start gap-3">
            <div className="hidden size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card sm:flex">
              <Icon className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {title ?? resource.label}
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
              {meta ? <div className="mt-3 flex flex-wrap gap-2">{meta}</div> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onRefresh ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? <Spinner data-icon="inline-start" /> : null}
              Refresh
            </Button>
          ) : null}
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}
