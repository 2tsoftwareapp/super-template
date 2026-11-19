"use client";

import type { SortCriterion } from "@repo/api-sort";

import {
  type ColumnDef,
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";

import { sortChanged, type TableSortBridge } from "@/lib/table-sort";

interface UseResourceTableConfigOptions<T extends { id: string }, TField extends string> {
  data: T[];
  listParams?: { sort?: readonly SortCriterion<TField>[] };
  sortBridge?: TableSortBridge<TField>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors TanStack's own `columns: ColumnDef<TData, any>[]` input type
  columns: ColumnDef<T, any>[];
  onSortChange?: (nextSort: SortCriterion<TField>[]) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  enableSelection?: boolean;
  getRowId?: (row: T) => string;
  /**
   * Changes whenever the active filter/search changes. Selection is cleared so
   * a bulk action can never target rows that the operator can no longer see.
   */
  filterSignature?: string;
}

/**
 * Shared TanStack table setup for resource lists: manual multi-sort synced to
 * URL list params (when `sortBridge` + `onSortChange` are provided), and
 * optional row selection for bulk actions.
 *
 * Page resets stay in the caller's URL-patch handlers (atomic sort+page,
 * size+page updates) — this hook only clears selection when state changes.
 */
export function useResourceTableConfig<T extends { id: string }, TField extends string>({
  data,
  listParams,
  sortBridge,
  columns,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  enableSelection = true,
  getRowId = (row) => row.id,
  filterSignature,
}: UseResourceTableConfigOptions<T, TField>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  // TanStack keeps selection entries for ids that are no longer in `data`; a
  // filter change must drop them rather than leave invisible rows selected.
  useEffect(() => {
    if (!enableSelection) {
      return;
    }

    clearSelection();
  }, [clearSelection, enableSelection, filterSignature]);

  const canSort = Boolean(sortBridge && onSortChange && listParams?.sort);

  const sorting = useMemo(
    () =>
      sortBridge && listParams?.sort ? sortBridge.sortingStateFromParams(listParams.sort) : [],
    [listParams, sortBridge],
  );

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      if (!canSort || !sortBridge || !onSortChange || !listParams?.sort) {
        return;
      }
      const currentSorting = sortBridge.sortingStateFromParams(listParams.sort);
      const nextSorting = typeof updater === "function" ? updater(currentSorting) : updater;
      const resolvedSorting = nextSorting.length > 0 ? nextSorting : currentSorting;
      const nextSort = sortBridge.paramsFromSortingState(resolvedSorting, listParams.sort);

      if (!sortChanged(listParams.sort, nextSort)) {
        return;
      }

      // Caller owns atomic URL update (sort + page reset in one patch).
      onSortChange(nextSort);
      if (enableSelection) {
        clearSelection();
      }
    },
    [canSort, clearSelection, enableSelection, listParams, onSortChange, sortBridge],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      onPageChange?.(page);
      if (enableSelection) {
        clearSelection();
      }
    },
    [clearSelection, enableSelection, onPageChange],
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      onPageSizeChange?.(pageSize);
      if (enableSelection) {
        clearSelection();
      }
    },
    [clearSelection, enableSelection, onPageSizeChange],
  );

  // TanStack Table returns unstable function refs; safe here — table stays in this hook.
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable is the supported table API
  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: canSort,
    enableMultiSort: canSort,
    maxMultiSortColCount: 4,
    enableSortingRemoval: false,
    enableRowSelection: enableSelection,
    ...(canSort ? { onSortingChange: handleSortingChange } : {}),
    onRowSelectionChange: setRowSelection,
    state: { ...(canSort ? { sorting } : {}), ...(enableSelection ? { rowSelection } : {}) },
  });

  return { table, selectedIds, clearSelection, handlePageChange, handlePageSizeChange };
}
