"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PermissionDto {
  id: string;
  name: string;
}

export function PermissionMultiSelect({
  permissions,
  selected,
  onChange,
  error,
}: {
  permissions: PermissionDto[];
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string | undefined;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden",
            error && "border-destructive",
            selected.length === 0 && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {selected.length === 0
              ? "Select permissions…"
              : `${selected.length} selected`}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--anchor-width)] p-1" align="start">
          <div className="max-h-60 overflow-y-auto">
            {permissions.map((p) => {
              const isSelected = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    onChange(
                      isSelected
                        ? selected.filter((s) => s !== p.id)
                        : [...selected, p.id],
                    )
                  }
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                    isSelected && "bg-accent font-medium",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-xs",
                      isSelected && "text-foreground",
                      !isSelected && "text-muted-foreground",
                    )}
                  >
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
