

import { Button } from "./button";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
export const DEFAULT_PAGE_SIZES = [10, 20, 50, 100] as const;
export type PageSize = (typeof DEFAULT_PAGE_SIZES)[number];

export function Pagination({
  page,
  pageSize,
  totalPages,
  total,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  pageSizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  isLoading?: boolean;
}) {
  const safeTotalPages = Math.max(totalPages, 1);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

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
          {total === 0 ? "No results" : `${rangeStart}–${rangeEnd} of ${total}`}
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <Label htmlFor="pagination-page-size" className="text-xs text-muted-foreground">
              Rows
            </Label>
            <Select
              value={String(pageSize)}
              disabled={isLoading}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger id="pagination-page-size" size="sm" className="h-7 w-[72px] text-xs">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent side="top" align="start">
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)} className="text-xs">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
            <span key={`dots-${idx}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
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
