import type { ReactNode } from "react";

import { cn } from "@repo/web-utils/utils";
import { Search, X } from "lucide-react";

import { Button } from "./button";
import { Input } from "./input";

export function ResourceToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
  resultLabel,
  hasFilters,
  onClearFilters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters?: ReactNode;
  actions?: ReactNode;
  resultLabel?: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-5 py-3 md:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                "h-9 bg-muted/40 border-transparent focus:border-input focus:bg-background transition-colors",
                "pl-9",
                search && "pr-9",
              )}
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          {filters}
          {hasFilters && onClearFilters ? (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X data-icon="inline-start" />
              Clear
            </Button>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {resultLabel ? <p className="text-xs text-muted-foreground">{resultLabel}</p> : null}
    </div>
  );
}
