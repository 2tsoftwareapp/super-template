"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { Checkbox } from "@repo/web-ui/checkbox";
import { Input } from "@repo/web-ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/web-ui/popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return permissions;
    const q = searchQuery.toLowerCase().trim();
    return permissions.filter((p) => p.name.toLowerCase().includes(q));
  }, [permissions, searchQuery]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionDto[]> = {};
    for (const p of filteredPermissions) {
      const prefix = p.name.includes(".")
        ? p.name.split(".")[0]!
        : p.name.includes(":")
          ? p.name.split(":")[0]!
          : "general";
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix]!.push(p);
    }
    return groups;
  }, [filteredPermissions]);

  const allFilteredSelected = useMemo(() => {
    if (filteredPermissions.length === 0) return false;
    return filteredPermissions.every((p) => selected.includes(p.id));
  }, [filteredPermissions, selected]);

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredPermissions.map((p) => p.id));
      onChange(selected.filter((id) => !filteredIds.has(id)));
    } else {
      const combined = new Set([...selected, ...filteredPermissions.map((p) => p.id)]);
      onChange(Array.from(combined));
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const selectedPermissionNames = useMemo(() => {
    return permissions.filter((p) => selected.includes(p.id)).map((p) => p.name);
  }, [permissions, selected]);

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-xs outline-hidden transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden",
            error && "border-destructive",
          )}
        >
          <span className="flex flex-wrap items-center gap-1.5 overflow-hidden">
            {selected.length === 0 ? (
              <span className="text-muted-foreground text-xs">Select permissions…</span>
            ) : selected.length <= 2 ? (
              selectedPermissionNames.map((name) => (
                <Badge key={name} variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                  {name}
                </Badge>
              ))
            ) : (
              <>
                <Badge variant="default" className="text-[10px] px-1.5 py-0 font-medium">
                  {selected.length} permissions
                </Badge>
                <span className="text-xs text-muted-foreground truncate">
                  {selectedPermissionNames.slice(0, 2).join(", ")} +{selected.length - 2} more
                </span>
              </>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          className="w-[380px] p-2 space-y-2 max-h-[380px] flex flex-col"
          align="start"
        >
          {/* Search bar inside popover */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permissions…"
              className="h-8 pl-8 pr-8 text-xs"
              autoFocus
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Quick actions */}
          <div className="flex items-center justify-between border-b border-border pb-1.5 text-xs text-muted-foreground">
            <span className="font-medium">
              {filteredPermissions.length} permission{filteredPermissions.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              {filteredPermissions.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAllFiltered}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {allFilteredSelected ? "Deselect all" : "Select all"}
                </button>
              )}
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear ({selected.length})
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list grouped by domain */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {Object.keys(groupedPermissions).length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No permissions matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([group, groupItems]) => (
                <div key={group} className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-1">
                    {group}
                  </div>
                  <div className="space-y-0.5">
                    {groupItems.map((p) => {
                      const isSelected = selected.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            onChange(
                              isSelected ? selected.filter((s) => s !== p.id) : [...selected, p.id],
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onChange(
                                isSelected
                                  ? selected.filter((s) => s !== p.id)
                                  : [...selected, p.id],
                              );
                            }
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors cursor-pointer",
                            isSelected
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Checkbox checked={isSelected} className="size-3.5" tabIndex={-1} />
                            <span className="font-mono text-xs truncate">{p.name}</span>
                          </div>
                          {isSelected && <Check className="size-3 shrink-0 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
