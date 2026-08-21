import type { LucideIcon } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/web-ui/empty";

import { cn } from "@/lib/utils";

/**
 * Unified empty state for all admin resource list views.
 * Shows a subtle decorative illustration, a contextual icon, title, description,
 * and an optional call-to-action button.
 */
export function ResourceEmpty({
  icon: Icon,
  title,
  description,
  action,
  isFiltered = false,
  className,
}: {
  /** Lucide icon to show in the icon badge */
  icon: LucideIcon;
  /** Main heading text */
  title: string;
  /** Subtitle / explanation */
  description?: string;
  /** Optional CTA button */
  action?: { label: string; onClick: () => void };
  /** Whether the empty state is due to active filters (changes illustration opacity) */
  isFiltered?: boolean;
  className?: string;
}) {
  return (
    <Empty className={cn("py-10", className)}>
      <EmptyContent>
        {/* Decorative illustration */}
        <div className="relative mb-1 flex items-center justify-center">
          <div
            className={cn(
              "absolute size-20 rounded-full blur-2xl transition-opacity duration-500",
              isFiltered
                ? "bg-muted/60 opacity-60"
                : "bg-primary/10 opacity-80",
            )}
          />
          <EmptyMedia variant="icon">
            <Icon className="size-4" />
          </EmptyMedia>
        </div>

        <EmptyHeader>
          <EmptyTitle>{title}</EmptyTitle>
          {description ? <EmptyDescription>{description}</EmptyDescription> : null}
        </EmptyHeader>

        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {action.label}
          </button>
        ) : null}
      </EmptyContent>
    </Empty>
  );
}
