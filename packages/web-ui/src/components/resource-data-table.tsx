"use client";

import type { Table as ReactTable, Row } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";

import { cn } from "@repo/web-utils/utils";
import { flexRender } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Rows3 } from "lucide-react";
import * as React from "react";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";
import { ErrorState } from "./error-state";
import { Skeleton } from "./skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type TableDensity = "compact" | "normal" | "comfortable";

const DENSITY_HEAD_CLASSES: Record<TableDensity, string> = {
  compact: "h-8 px-3 text-xs",
  normal: "h-10 px-4 text-sm",
  comfortable: "h-12 px-5 text-sm",
};

const DENSITY_CELL_CLASSES: Record<TableDensity, string> = {
  compact: "px-3 py-1.5 text-xs",
  normal: "px-4 py-3 text-sm",
  comfortable: "px-5 py-4.5 text-sm",
};

export interface ResourceDataTableProps<TData> {
  table: ReactTable<TData>;
  isLoading?: boolean | undefined;
  loadingRowCount?: number | undefined;
  error?:
    | {
        title: string;
        description?: string | undefined;
        onRetry?: (() => void) | undefined;
      }
    | undefined;
  empty?:
    | {
        title?: string | undefined;
        description?: string | undefined;
        icon?: LucideIcon | React.ComponentType<{ className?: string }> | undefined;
        action?:
          | {
              label: string;
              onClick: () => void;
            }
          | undefined;
      }
    | undefined;
  onRowClick?: ((row: TData) => void) | undefined;
  enableDensityToggle?: boolean | undefined;
  enableColumnVisibility?: boolean | undefined;
  density?: TableDensity | undefined;
  onDensityChange?: ((density: TableDensity) => void) | undefined;
  multiSort?: boolean | undefined;
  className?: string | undefined;
}
export function ResourceDataTable<TData>({
  table,
  isLoading = false,
  loadingRowCount = 5,
  error,
  empty,
  onRowClick,
  enableDensityToggle = false,
  enableColumnVisibility = false,
  density: propDensity,
  onDensityChange,
  multiSort = false,
  className,
}: ResourceDataTableProps<TData>) {
  const [internalDensity, setInternalDensity] = React.useState<TableDensity>("normal");
  const currentDensity = propDensity ?? internalDensity;

  const handleDensitySelect = (val: string) => {
    const nextDensity = val as TableDensity;
    setInternalDensity(nextDensity);
    onDensityChange?.(nextDensity);
  };

  const visibleColumns = table.getVisibleLeafColumns();
  const columnCount = visibleColumns.length;
  const activeSortCount = table.getState().sorting?.length ?? 0;
  const hideableColumns = table.getAllLeafColumns().filter((col) => col.getCanHide());

  const showControls = enableDensityToggle || enableColumnVisibility;

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showControls ? (
        <div className="flex items-center justify-end gap-2">
          {enableDensityToggle ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  aria-label="Table density"
                >
                  <Rows3 className="size-3.5" />
                  <span className="hidden sm:inline">Density</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuLabel>Density</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={currentDensity} onValueChange={handleDensitySelect}>
                  <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="normal">Normal</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {enableColumnVisibility && hideableColumns.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  aria-label="Toggle columns"
                >
                  <Columns3 className="size-3.5" />
                  <span className="hidden sm:inline">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hideableColumns.map((column) => {
                  const headerTitle =
                    typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                      className="capitalize"
                    >
                      {headerTitle}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  const sortIndex = header.column.getSortIndex();
                  const showSortPriority = multiSort && activeSortCount > 1 && sortIndex >= 0;
                  const meta = header.column.columnDef.meta as { className?: string } | undefined;

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        DENSITY_HEAD_CLASSES[currentDensity],
                        canSort && "cursor-pointer select-none hover:bg-muted/40",
                        sorted && "text-foreground font-semibold",
                        meta?.className,
                      )}
                      style={{
                        width: header.getSize() ? `${header.getSize()}px` : undefined,
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                      tabIndex={canSort ? 0 : undefined}
                      onKeyDown={
                        canSort
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                header.column.getToggleSortingHandler()?.(e);
                              }
                            }
                          : undefined
                      }
                      role={canSort ? "columnheader" : undefined}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <div className="inline-flex items-center gap-1.5">
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
                                sorted ? "text-foreground" : "text-muted-foreground/30",
                              )}
                              aria-hidden="true"
                            >
                              {sorted === "asc" ? (
                                <ArrowUp className="size-3.5" />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="size-3.5" />
                              ) : (
                                <ArrowUpDown className="size-3.5" />
                              )}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: loadingRowCount }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {visibleColumns.map((col) => {
                    const width = col.getSize();
                    const isCheckbox = col.id === "select";
                    const isNarrow = col.id === "status" || col.id === "actions" || width < 100;
                    return (
                      <TableCell
                        key={col.id}
                        className={DENSITY_CELL_CLASSES[currentDensity]}
                        style={{ width: width ? `${width}px` : undefined }}
                      >
                        <Skeleton
                          className={
                            isCheckbox
                              ? "size-4 rounded"
                              : isNarrow
                                ? "h-4 w-16"
                                : "h-4 w-full max-w-[200px]"
                          }
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="p-6">
                  <div className="space-y-1">
                    <ErrorState
                      variant="inline"
                      title={error.title}
                      {...(error.description ? { description: error.description } : {})}
                      {...(error.onRetry
                        ? { action: { label: "Retry", onClick: error.onRetry } }
                        : {})}
                    />
                    {error.description ? (
                      <p className="px-4 text-xs text-muted-foreground">{error.description}</p>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-12 text-center">
                  <Empty>
                    {empty?.icon ? (
                      <EmptyMedia>
                        <empty.icon className="size-8 text-muted-foreground" />
                      </EmptyMedia>
                    ) : null}
                    <EmptyHeader>
                      <EmptyTitle>{empty?.title ?? "No results found"}</EmptyTitle>
                      {empty?.description ? (
                        <EmptyDescription>{empty.description}</EmptyDescription>
                      ) : null}
                    </EmptyHeader>
                    {empty?.action ? (
                      <EmptyContent className="mt-4">
                        <Button variant="outline" size="sm" onClick={empty.action.onClick}>
                          {empty.action.label}
                        </Button>
                      </EmptyContent>
                    ) : null}
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row: Row<TData>) => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && "cursor-pointer transition-colors hover:bg-muted/50")}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(DENSITY_CELL_CLASSES[currentDensity], meta?.className)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
