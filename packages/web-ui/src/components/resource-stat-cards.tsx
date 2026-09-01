import type { ComponentType, ReactNode } from "react";

import { cn } from "@repo/web-utils/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

export interface ResourceStatCardChange {
  value: string;
  positive: boolean;
}

export interface ResourceStatCardItem {
  label: string;
  value: string | number | ReactNode;
  description?: string | ReactNode | undefined;
  icon?: ComponentType<{ className?: string }> | undefined;
  change?: ResourceStatCardChange | undefined;
  trend?: string | ReactNode | undefined;
  href?: string | undefined;
  iconBg?: string | undefined;
  className?: string | undefined;
}

export interface ResourceStatCardProps extends ResourceStatCardItem {
  linkComponent?:
    | ComponentType<{
        href: string;
        className?: string | undefined;
        children?: ReactNode | undefined;
      }>
    | undefined;
}

export function ResourceStatCardSkeleton({ className }: { className?: string | undefined }) {
  return (
    <Card
      className={cn("overflow-hidden border border-border/80 bg-card p-5 shadow-xs", className)}
    >
      <CardContent className="flex flex-col gap-3 p-0">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ResourceStatCard({
  label,
  value,
  description,
  icon: Icon,
  change,
  trend,
  href,
  iconBg,
  className,
  linkComponent: LinkComponent,
}: ResourceStatCardProps) {
  const content = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        {Icon ? (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors group-hover/stat:border-primary/30 group-hover/stat:bg-primary/10 group-hover/stat:text-primary",
              iconBg,
            )}
          >
            <Icon className="size-4.5" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</div>

        {change || trend || description ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
            {change ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                  change.positive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                )}
              >
                {change.positive ? (
                  <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="size-3 shrink-0" aria-hidden="true" />
                )}
                {change.value}
              </span>
            ) : null}

            {trend ? (
              <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                {trend}
              </span>
            ) : null}

            {description ? <span className="text-muted-foreground">{description}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  const cardClasses = cn(
    "group/stat relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200",
    href && "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md cursor-pointer",
    className,
  );

  if (href) {
    if (LinkComponent) {
      return (
        <LinkComponent href={href} className={cardClasses}>
          {content}
        </LinkComponent>
      );
    }
    return (
      <a href={href} className={cardClasses}>
        {content}
      </a>
    );
  }

  return <div className={cardClasses}>{content}</div>;
}

export interface ResourceStatCardsProps {
  items?: ResourceStatCardItem[] | undefined;
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  isLoading?: boolean | undefined;
  loading?: boolean | undefined;
  skeletonCount?: number | undefined;
  className?: string | undefined;
  linkComponent?:
    | ComponentType<{
        href: string;
        className?: string | undefined;
        children?: ReactNode | undefined;
      }>
    | undefined;
}

const columnClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

export function ResourceStatCards({
  items = [],
  columns = 4,
  isLoading,
  loading,
  skeletonCount,
  className,
  linkComponent,
}: ResourceStatCardsProps) {
  const isCurrentlyLoading = isLoading ?? loading ?? false;
  const count = skeletonCount ?? (items.length > 0 ? items.length : 4);
  const gridClass = columnClasses[columns] ?? columnClasses[4];

  if (isCurrentlyLoading) {
    return (
      <div className={cn("grid gap-4", gridClass, className)} data-testid="stat-cards-skeleton">
        {Array.from({ length: count }).map((_, index) => (
          <ResourceStatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return null;
  }

  return (
    <div className={cn("grid gap-4", gridClass, className)} data-testid="stat-cards-grid">
      {items.map((item, index) => (
        <ResourceStatCard
          key={item.label || index}
          {...item}
          {...(linkComponent ? { linkComponent } : {})}
        />
      ))}
    </div>
  );
}
