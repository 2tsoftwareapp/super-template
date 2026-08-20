import { Empty } from "@repo/web-ui/empty";
import { ErrorState } from "@repo/web-ui/error-state";
import { Skeleton } from "@repo/web-ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/web-ui/table";
import { flexRender, type Table as ReactTable, type Row } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function ResourceTable<T>({
  table,
  isLoading,
  emptyTitle,
  emptyDescription,
  onRowClick,
  binarySort: _binarySort = false,
  multiSort = false,
  error,
  onRetry,
}: {
  table: ReactTable<T>;
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  onRowClick?: (row: Row<T>) => void;
  /** When true, sorted columns show only asc/desc icons (no neutral state). */
  binarySort?: boolean;
  /** When true, show sort priority badges for multi-column sorting. */
  multiSort?: boolean;
  /** When set, renders an error state in place of rows/empty (wins over empty). */
  error?: { title: string; description?: string };
  /** Retry action for the error state. */
  onRetry?: () => void;
}) {
  const columnCount = table.getAllLeafColumns().length;
  const activeSortCount = table.getState().sorting.length;

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => {
              const sorted = header.column.getIsSorted();
              const canSort = header.column.getCanSort();
              const sortIndex = header.column.getSortIndex();
              const showSortPriority = multiSort && activeSortCount > 1 && sortIndex >= 0;
              return (
                <TableHead
                  key={header.id}
                  className={cn(
                    canSort && "cursor-pointer select-none",
                    sorted && "text-foreground",
                    (header.column.columnDef.meta as { className?: string } | undefined)?.className,
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : (
                    <span className="inline-flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {showSortPriority ? (
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                          {sortIndex + 1}
                        </span>
                      ) : null}
                      {canSort ? (
                        <span
                          className={cn(
                            "inline-flex transition-colors",
                            sorted ? "text-muted-foreground" : "text-muted-foreground/25",
                          )}
                        >
                          <ArrowUpDown
                            className={cn(
                              "size-3 transition-transform",
                              sorted === "asc" && "-rotate-180",
                              sorted === "desc" && "rotate-0",
                            )}
                          />
                        </span>
                      ) : null}
                    </span>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={index}>
              {table.getAllLeafColumns().map((col) => {
                const width = col.getSize();
                const isCheckbox = col.id === "select";
                const isNarrow = col.id === "status" || col.id === "actions" || width < 100;
                return (
                  <TableCell
                    key={col.id}
                    className="px-4 py-3"
                    style={{ width: col.getSize() ? `${col.getSize()}px` : undefined }}
                  >
                    <Skeleton
                      className={
                        isCheckbox ? "size-4" : isNarrow ? "h-5 w-16" : "h-5 w-full max-w-[240px]"
                      }
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        ) : error ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="p-4">
              <ErrorState
                variant="inline"
                title={error.title}
                {...(error.description ? { description: error.description } : {})}
                {...(onRetry ? { action: { label: "Retry", onClick: onRetry } } : {})}
              />
            </TableCell>
          </TableRow>
        ) : table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columnCount}>
              <Empty
                title={emptyTitle}
                {...(emptyDescription ? { description: emptyDescription } : {})}
              />
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(onRowClick && "cursor-pointer")}
              onClick={() => onRowClick?.(row)}
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                return (
                  <TableCell key={cell.id} className={meta?.className}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
