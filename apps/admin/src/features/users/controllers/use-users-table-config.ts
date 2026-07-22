"use client";

import {
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

import type { UsersListParams } from "@/features/users/model/users.types";
import type { AdminUserDto } from "@/lib/api-types";

import {
  paramsFromSortingState,
  sortingStateFromParams,
  usersSortChanged,
} from "@/features/users/model/sorting";
import { createUsersTableColumns } from "@/features/users/ui/users-table-columns";

interface UseUsersTableConfigOptions {
  pageUsers: AdminUserDto[];
  listParams: UsersListParams;
  canUpdate: boolean;
  isMutating: boolean;
  handleActivate: (userId: string) => Promise<void>;
  handleBlock: (userId: string) => void;
  handleResendVerification: (email: string) => void;
  onSortChange: (nextSort: UsersListParams["sort"]) => void;
}

/**
 * TanStack table setup for the users list: columns, manual multi-sort,
 * and row selection state wired to bulk actions.
 */
export function useUsersTableConfig({
  pageUsers,
  listParams,
  canUpdate,
  isMutating,
  handleActivate,
  handleBlock,
  handleResendVerification,
  onSortChange,
}: UseUsersTableConfigOptions) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  const columns = useMemo(
    () =>
      createUsersTableColumns({
        canUpdate,
        onActivate: handleActivate,
        onBlock: handleBlock,
        onResendVerification: handleResendVerification,
        isDisabled: isMutating,
      }),
    [
      canUpdate,
      handleActivate,
      handleBlock,
      handleResendVerification,
      isMutating,
    ],
  );

  const sorting = useMemo(
    () => sortingStateFromParams(listParams),
    [listParams],
  );

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const currentSorting = sortingStateFromParams(listParams);
      const nextSorting =
        typeof updater === "function" ? updater(currentSorting) : updater;
      const resolvedSorting =
        nextSorting.length > 0 ? nextSorting : currentSorting;
      const { sort: nextSort } = paramsFromSortingState(
        resolvedSorting,
        listParams,
      );

      if (!usersSortChanged(listParams.sort, nextSort)) {
        return;
      }

      onSortChange(nextSort);
      clearSelection();
    },
    [clearSelection, listParams, onSortChange],
  );

  // TanStack Table returns unstable function refs; safe here — table stays in this hook.
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable is the supported table API
  const table = useReactTable({
    data: pageUsers,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableMultiSort: true,
    maxMultiSortColCount: 4,
    enableSortingRemoval: false,
    enableRowSelection: true,
    onSortingChange: handleSortingChange,
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
  });

  return { table, selectedIds, clearSelection };
}
