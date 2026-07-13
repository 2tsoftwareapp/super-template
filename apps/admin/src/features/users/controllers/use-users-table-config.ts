"use client";

import {
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import type { UsersListParams } from "@/features/users/model/types";
import type { AdminUserDto } from "@/lib/api-types";

import {
  paramsFromSortingState,
  sortingStateFromParams,
  usersSortChanged,
} from "@/features/users/model/sorting";

import { createUsersTableColumns } from "../ui/users-table-columns";

interface UseUsersTableConfigOptions {
  pageUsers: AdminUserDto[];
  canUpdate: boolean;
  isMutating: boolean;
  listParams: UsersListParams;
  handleActivate: (userId: string) => Promise<void>;
  handleBlock: (userId: string) => void;
  handleResendVerification: (email: string) => void;
  onSortChange: (nextSort: UsersListParams["sort"]) => void;
}

export function useUsersTableConfig(options: UseUsersTableConfigOptions) {
  const {
    pageUsers,
    canUpdate,
    isMutating,
    listParams,
    handleActivate,
    handleBlock,
    handleResendVerification,
    onSortChange,
  } = options;

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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

  const handleSortingChange = (updater: Updater<SortingState>) => {
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
    setRowSelection({});
  };

  const table = useReactTable({
    data: pageUsers,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableMultiSort: true,
    maxMultiSortColCount: 4,
    enableSortingRemoval: false,
    onSortingChange: handleSortingChange,
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
  });

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);

  const clearSelection = () => setRowSelection({});

  return { table, selectedIds, clearSelection, setRowSelection };
}
