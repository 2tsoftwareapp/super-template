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

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p>
          {total === 0
            ? "No users found"
            : `Showing ${rangeStart}–${rangeEnd} of ${total} users`}
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="users-page-size" className="text-xs text-muted-foreground">
            Rows per page
          </Label>
          <select
            id="users-page-size"
            value={limit}
            disabled={isLoading}
            onChange={(event) => onLimitChange(Number(event.target.value) as UsersPageSize)}
            className={cn(
              "h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground",
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
      <div className="flex items-center gap-3">
        <p className="text-xs">
          Page {page} of {safeTotalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={(isLoading ?? false) || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(isLoading ?? false) || page >= safeTotalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
