"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@repo/web-utils/utils";
import { Check, PlusCircle, RotateCcw, Search, X } from "lucide-react";
import * as React from "react";

import { Badge } from "./badge";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";
import { DatePickerWithRange } from "./date-picker";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Separator } from "./separator";

export interface ResourceFacetOption {
  label: string;
  value: string;
  icon?: (LucideIcon | React.ComponentType<{ className?: string }>) | undefined;
  count?: number | undefined;
}

export interface ResourceFacetFilter {
  key: string;
  label: string;
  options: ResourceFacetOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export interface ResourceDateRange {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

export interface ResourceActiveFilter {
  key?: string | undefined;
  label: string;
  onRemove: () => void;
}

export interface ResourceFilterSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  debounceMs?: number | undefined;
}

export interface ResourceFacetedFilterProps {
  title: string;
  options: ResourceFacetOption[];
  selectedValues?: string[] | undefined;
  onChange?: ((values: string[]) => void) | undefined;
  className?: string | undefined;
}

export function ResourceFacetedFilter({
  title,
  options,
  selectedValues = [],
  onChange,
  className,
}: ResourceFacetedFilterProps) {
  const selectedSet = React.useMemo(() => new Set(selectedValues), [selectedValues]);

  const handleSelect = React.useCallback(
    (value: string) => {
      if (!onChange) return;
      const next = new Set(selectedSet);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      onChange(Array.from(next));
    },
    [onChange, selectedSet],
  );

  const handleClear = React.useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 border-dashed", className)}
          aria-label={`Filter by ${title}`}
        >
          <PlusCircle className="size-3.5 text-muted-foreground" />
          <span>{title}</span>
          {selectedValues.length > 0 ? (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.length}
              </Badge>
              <div className="hidden gap-1 lg:flex">
                {selectedValues.length > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.length} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedSet.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value);
                const OptionIcon = option.icon;
                return (
                  <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                    <div
                      className={cn(
                        "mr-2 flex size-4 items-center justify-center rounded-xs border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                      aria-hidden="true"
                    >
                      <Check className="size-3" />
                    </div>
                    {OptionIcon ? (
                      <OptionIcon className="mr-2 size-4 text-muted-foreground" />
                    ) : null}
                    <span className="truncate">{option.label}</span>
                    {typeof option.count === "number" ? (
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {option.count}
                      </span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className="justify-center text-center font-medium text-destructive focus:text-destructive"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export interface ResourceFilterBarProps {
  search?: ResourceFilterSearch | undefined;
  facets?: ResourceFacetFilter[] | undefined;
  dateRange?: ResourceDateRange | undefined;
  activeFilters?: ResourceActiveFilter[] | undefined;
  onClearAll?: (() => void) | undefined;
  actions?: React.ReactNode | undefined;
  children?: React.ReactNode | undefined;
  className?: string | undefined;
}
export function ResourceFilterBar({
  search,
  facets = [],
  dateRange,
  activeFilters,
  onClearAll,
  actions,
  children,
  className,
}: ResourceFilterBarProps) {
  // Controlled/debounced search handling
  const [internalSearch, setInternalSearch] = React.useState(search?.value ?? "");

  React.useEffect(() => {
    setInternalSearch(search?.value ?? "");
  }, [search?.value]);

  const searchOnChange = search?.onChange;
  const searchDebounceMs = search?.debounceMs;

  React.useEffect(() => {
    if (!searchDebounceMs || searchDebounceMs <= 0 || !searchOnChange) return;
    if (internalSearch === (search?.value ?? "")) return;

    const timer = setTimeout(() => {
      searchOnChange(internalSearch);
    }, searchDebounceMs);

    return () => clearTimeout(timer);
  }, [internalSearch, searchDebounceMs, search?.value, searchOnChange]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalSearch(val);
    if (!searchDebounceMs || searchDebounceMs <= 0) {
      search?.onChange(val);
    }
  };

  const handleClearSearch = () => {
    setInternalSearch("");
    search?.onChange("");
  };

  // Derive active filters if not explicitly provided
  const resolvedActiveFilters = React.useMemo(() => {
    if (activeFilters !== undefined) {
      return activeFilters;
    }

    const list: ResourceActiveFilter[] = [];

    for (const facet of facets) {
      for (const val of facet.selectedValues) {
        const option = facet.options.find((o) => o.value === val);
        const label = option ? `${facet.label}: ${option.label}` : `${facet.label}: ${val}`;
        list.push({
          key: `${facet.key}-${val}`,
          label,
          onRemove: () => {
            facet.onChange(facet.selectedValues.filter((v) => v !== val));
          },
        });
      }
    }

    if (dateRange && (dateRange.from || dateRange.to)) {
      const fromLabel = dateRange.from || "Start";
      const toLabel = dateRange.to || "End";
      list.push({
        key: "date-range",
        label: `Date: ${fromLabel} – ${toLabel}`,
        onRemove: () => {
          dateRange.onChange({ from: "", to: "" });
        },
      });
    }

    return list;
  }, [activeFilters, facets, dateRange]);

  const hasAnyActiveFilter = resolvedActiveFilters.length > 0 || Boolean(search?.value);

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
      return;
    }

    // Default clear all behavior across controls
    if (search?.onChange) {
      search.onChange("");
      setInternalSearch("");
    }
    for (const facet of facets) {
      facet.onChange([]);
    }
    if (dateRange) {
      dateRange.onChange({ from: "", to: "" });
    }
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {search ? (
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                value={internalSearch}
                onChange={handleSearchInputChange}
                placeholder={search.placeholder ?? "Search..."}
                className={cn("h-8 pl-8 text-sm", internalSearch && "pr-8")}
                aria-label={search.placeholder ?? "Search"}
              />
              {internalSearch ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}

          {facets.map((facet) => (
            <ResourceFacetedFilter
              key={facet.key}
              title={facet.label}
              options={facet.options}
              selectedValues={facet.selectedValues}
              onChange={facet.onChange}
            />
          ))}

          {dateRange ? (
            <DatePickerWithRange
              value={{ from: dateRange.from, to: dateRange.to }}
              onChange={dateRange.onChange}
            />
          ) : null}

          {children}
        </div>

        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      {resolvedActiveFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
          {resolvedActiveFilters.map((filter) => (
            <Badge
              key={filter.key ?? filter.label}
              variant="secondary"
              className="gap-1 rounded-md px-2 py-0.5 text-xs font-normal"
            >
              <span>{filter.label}</span>
              <button
                type="button"
                onClick={filter.onRemove}
                aria-label={`Remove filter ${filter.label}`}
                className="rounded-xs p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {hasAnyActiveFilter ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1 size-3" />
              Clear all
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
