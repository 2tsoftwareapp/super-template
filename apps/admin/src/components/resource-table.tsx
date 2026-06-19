import {
  flexRender,
  type Table as ReactTable,
  type Row,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

import { Empty } from "./ui/empty";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function ResourceTable<T>({
  table,
  isLoading,
  emptyTitle,
  emptyDescription,
  onRowClick,
  binarySort = false,
  multiSort = false,
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
              const showSortPriority =
                multiSort && activeSortCount > 1 && sortIndex >= 0;
              return (
                <TableHead
                  key={header.id}
                  className={cn(canSort && "cursor-pointer select-none")}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : (
                    <span className="inline-flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {showSortPriority ? (
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                          {sortIndex + 1}
                        </span>
                      ) : null}
                      {canSort ? (
                        sorted === "asc" ? (
                          <ChevronUp />
                        ) : sorted === "desc" ? (
                          <ChevronDown />
                        ) : binarySort ? null : (
                          <ArrowUpDown className="opacity-40" />
                        )
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
              <TableCell colSpan={columnCount} className="px-4 py-3">
                <Skeleton className="h-8 w-full" />
              </TableCell>
            </TableRow>
          ))
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
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
