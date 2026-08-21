import type { ReactNode } from "react";

import { RefreshButton } from "@repo/web-ui/refresh-button";

import type { AdminResourceConfig } from "@/lib/admin-resources";

import { Link } from "@/i18n/navigation";

export function ResourcePageShell({
  resource,
  title,
  description,
  actions,
  backHref,
  meta,
  isRefreshing,
  onRefresh,
  children,
}: {
  resource: AdminResourceConfig;
  title?: string;
  description: string;
  actions?: ReactNode;
  backHref?: string;
  meta?: ReactNode;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
}) {
  const Icon = resource.icon;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </Link>
          ) : null}
          <div className="flex items-start gap-4">
            <div className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 sm:flex">
              <Icon className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                {title ?? resource.label}
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              {meta ? <div className="mt-3 flex flex-wrap gap-2">{meta}</div> : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onRefresh ? (
            <RefreshButton {...(isRefreshing ? { isRefreshing } : {})} onClick={onRefresh} />
          ) : null}
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}
