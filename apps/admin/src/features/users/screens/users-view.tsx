"use client";

import { ErrorState } from "@repo/web-ui/error-state";
import { Spinner } from "@repo/web-ui/spinner";
import {
  getCoreRowModel,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { useUsersListController } from "@/features/users/controllers/use-users-list-controller";
import {
  paramsFromSortingState,
  sortingStateFromParams,
  usersSortChanged,
} from "@/features/users/model/sorting";

import { UsersListView } from "../ui/users-list-view";
import { createUsersTableColumns } from "../ui/users-table-columns";

export function UsersView() {
  const controller = useUsersListController();

  const columns = useMemo(
    () =>
      createUsersTableColumns({
        canUpdate: controller.columnData.canUpdate,
        onActivate: controller.columnData.handleActivate,
        onBlock: controller.columnData.handleBlock,
        onResendVerification: controller.columnData.handleResendVerification,
        isDisabled: controller.columnData.isMutating,
      }),
    [
      controller.columnData.canUpdate,
      controller.columnData.handleActivate,
      controller.columnData.handleBlock,
      controller.columnData.handleResendVerification,
      controller.columnData.isMutating,
    ],
  );

  const sorting = useMemo(
    () => sortingStateFromParams(controller.columnData.listParams),
    [controller.columnData.listParams],
  );

  const handleSortingChange = (updater: Updater<SortingState>) => {
    const currentSorting = sortingStateFromParams(controller.columnData.listParams);
    const nextSorting =
      typeof updater === "function" ? updater(currentSorting) : updater;
    const resolvedSorting =
      nextSorting.length > 0 ? nextSorting : currentSorting;
    const { sort: nextSort } = paramsFromSortingState(
      resolvedSorting,
      controller.columnData.listParams,
    );

    if (!usersSortChanged(controller.columnData.listParams.sort, nextSort)) {
      return;
    }

    controller.columnData.onSortChange(nextSort);
    controller.bulk.onClearSelection();
  };

  const table = useReactTable({
    data: controller.columnData.pageUsers,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableMultiSort: true,
    maxMultiSortColCount: 4,
    enableSortingRemoval: false,
    onSortingChange: handleSortingChange,
    state: { sorting },
  });

  if (controller.session.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (controller.session.isError) {
    return (
      <ErrorState
        title="Session error"
        description="Could not load your session. Try refreshing the page."
      />
    );
  }

  return (
    <UsersListView
      {...controller}
      table={table}
    />
  );
}
