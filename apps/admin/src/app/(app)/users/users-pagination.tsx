"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { USERS_PAGE_SIZE_OPTIONS, type UsersPageSize } from "./types";

export function UsersPagination({
  page,
  limit,
  totalPages,
  total,
  onPageChange,
  onLimitChange,
  isLoading,
}: {
  page: number;
  limit: UsersPageSize;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: UsersPageSize) => void;
  isLoading?: boolean;
}) {
  const safeTotalPages = Math.max(totalPages, 1);
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * limit, total);

  const pageNumbers: (number | "dots")[] = [];
  if (safeTotalPages <= 7) {
    for (let i = 1; i <= safeTotalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("dots");
    const start = Math.max(2, page - 1);
    const end = Math.min(safeTotalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pageNumbers.push(i);
    if (page < safeTotalPages - 2) pageNumbers.push("dots");
    pageNumbers.push(safeTotalPages);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-xs">
          {total === 0
            ? "No users"
            : `${rangeStart}–${rangeEnd} of ${total}`}
        </p>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="users-page-size"
            className="text-xs text-muted-foreground"
          >
            Rows
          </Label>
          <select
            id="users-page-size"
            value={limit}
            disabled={isLoading}
            onChange={(event) =>
              onLimitChange(Number(event.target.value) as UsersPageSize)
            }
            className={cn(
              "h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {USERS_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={(isLoading ?? false) || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-7 px-2 text-xs"
        >
          Prev
        </Button>
        {pageNumbers.map((item, idx) =>
          item === "dots" ? (
            <span key={`dots-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "default" : "outline"}
              size="sm"
              disabled={isLoading}
              onClick={() => onPageChange(item)}
              className="h-7 min-w-7 px-1 text-xs"
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={(isLoading ?? false) || page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-7 px-2 text-xs"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
