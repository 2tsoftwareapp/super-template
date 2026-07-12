"use client";

import { useDebouncedValue } from "@repo/web-core/hooks";
import {
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
  type Table,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminUserDto } from "@/lib/api-types";

import {
  paramsFromSortingState,
  sortingStateFromParams,
  usersSortChanged,
} from "@/features/users/sorting";
import {
  type UsersListParams,
  type UsersPageSize,
  type UserStatusFilter,
} from "@/features/users/types";
import {
  useActivateUsers,
  useBlockUsers,
  useResendVerification,
} from "@/features/users/use-users-mutations";
import { useUsersListQuery } from "@/features/users/use-users-queries";
import { selectUserManagementPermissions } from "@/features/users/users-permissions";
import {
  parseUsersListSearchParams,
  serializeUsersListSearchParams,
} from "@/features/users/users-search-params";
import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";

import { createUsersTableColumns } from "./components/users-table-columns";

interface ConfirmBlockState {
  userIds: string[];
  label: string;
  count: number;
}

export interface UsersListViewModel {
  session: { isLoading: boolean; isError: boolean };
  header: {
    isLoading: boolean;
    isFetching: boolean;
    total: number;
    canCreate: boolean;
    onRefresh: () => void;
    onCreateClick: () => void;
  };
  list: {
    isError: boolean;
    isLoading: boolean;
    onRetry: () => void;
    table: Table<AdminUserDto>;
    hasFilters: boolean;
    emptyTitle: string;
    emptyDescription: string;
    onRowClick: (id: string) => void;
  };
  toolbar: {
    search: string;
    onSearchChange: (value: string) => void;
    onClearFilters: () => void;
    currentStatus: UserStatusFilter;
    onStatusFilter: (status: UserStatusFilter) => void;
  };
  bulk: {
    canUpdate: boolean;
    selectedIds: string[];
    isMutating: boolean;
    isActivating: boolean;
    isBlocking: boolean;
    onClearSelection: () => void;
    onBulkActivate: () => Promise<void>;
    onBulkBlock: () => void;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    total: number;
    isFetching: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (limit: number) => void;
  };
  createDrawer: {
    open: boolean;
    actorRoles: string[];
    onClose: () => void;
  };
  confirmBlock: {
    state: ConfirmBlockState | null;
    isLoading: boolean;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
  };
}

/**
 * Orchestration hook for the users list screen: URL/search-param state,
 * debounced search, server queries + mutations, permission selection, table /
 * sort / selection state, dialog state and event handlers. Returns a view model
 * consumed by the presentational UsersListView.
 */
export function useUsersListController(): UsersListViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const searchParams = useSearchParams();

  const listParams = useMemo(
    () => parseUsersListSearchParams(searchParams),
    [searchParams],
  );
  const [searchInput, setSearchInput] = useState(listParams.search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showCreate, setShowCreate] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "activate" | "block" | null
  >(null);
  const [confirmBlock, setConfirmBlock] = useState<ConfirmBlockState | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(searchInput, 500);

  useEffect(() => {
    setSearchInput(listParams.search);
  }, [listParams.search]);

  const patchListParams = useCallback(
    (patch: Partial<UsersListParams>) => {
      const next = { ...listParams, ...patch };
      const serialized = serializeUsersListSearchParams(next).toString();

      if (serialized === searchParams.toString()) {
        return;
      }

      router.replace(serialized ? `${pathname}?${serialized}` : pathname);
    },
    [listParams, pathname, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch === listParams.search) {
      return;
    }

    patchListParams({ search: debouncedSearch, page: 1 });
  }, [debouncedSearch, listParams.search, patchListParams]);

  const queryParams = useMemo(
    () => ({
      ...listParams,
      search: debouncedSearch,
    }),
    [listParams, debouncedSearch],
  );

  const users = useUsersListQuery(queryParams);
  const activateUsers = useActivateUsers();
  const blockUsers = useBlockUsers();
  const resendVerification = useResendVerification();

  const actorRoles = session.data?.data.user.roles ?? [];
  const { canCreate, canUpdate } = selectUserManagementPermissions(
    session.data?.data.permissions,
  );

  const pageUsers = users.data?.data ?? [];
  const total = users.data?.meta?.total ?? 0;
  const totalPages = users.data?.meta?.totalPages ?? 1;
  const currentPage = users.data?.meta?.page ?? queryParams.page;

  const handleActivate = useCallback(
    async (userId: string) => {
      setPendingAction("activate");
      try {
        await activateUsers.mutateAsync([userId]);
      } catch {
        // Ignored
      } finally {
        setPendingAction(null);
      }
    },
    [activateUsers],
  );

  const handleBlock = useCallback((userId: string) => {
    setConfirmBlock({ userIds: [userId], label: "this user", count: 1 });
  }, []);

  const handleResendVerification = useCallback(
    (email: string) => {
      resendVerification.mutate(email);
    },
    [resendVerification],
  );

  const columns = useMemo(
    () =>
      createUsersTableColumns({
        canUpdate,
        onActivate: handleActivate,
        onBlock: handleBlock,
        onResendVerification: handleResendVerification,
        isDisabled: activateUsers.isPending || blockUsers.isPending,
      }),
    [
      canUpdate,
      handleActivate,
      handleBlock,
      handleResendVerification,
      activateUsers.isPending,
      blockUsers.isPending,
    ],
  );

  const sorting = useMemo(
    () => sortingStateFromParams(queryParams),
    [queryParams],
  );

  const handleStatusFilter = (status: UserStatusFilter) => {
    patchListParams({ status, page: 1 });
    setRowSelection({});
  };

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

    patchListParams({ sort: nextSort, page: 1 });
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
  const hasFilters = Boolean(searchInput || queryParams.status !== "all");

  const clearSelection = () => setRowSelection({});

  const handleRowClick = (id: string) => {
    const returnTo = serializeUsersListSearchParams(queryParams).toString();
    const suffix = returnTo
      ? `?returnTo=${encodeURIComponent(`/users?${returnTo}`)}`
      : "";
    void router.push(`/users/${id}${suffix}`);
  };

  const handleBulkActivate = async () => {
    await activateUsers.mutateAsync(selectedIds);
    setRowSelection({});
  };

  const handleBulkBlock = () => {
    setConfirmBlock({
      userIds: selectedIds,
      label: `${selectedIds.length} user${selectedIds.length > 1 ? "s" : ""}`,
      count: selectedIds.length,
    });
  };

  const handleConfirmBlock = async () => {
    if (!confirmBlock) {
      return;
    }

    setPendingAction("block");
    try {
      await blockUsers.mutateAsync(confirmBlock.userIds);
    } finally {
      setPendingAction(null);
      const shouldClearSelection = confirmBlock.count > 1;
      setConfirmBlock(null);
      if (shouldClearSelection) {
        setRowSelection({});
      }
    }
  };

  const isMutating = activateUsers.isPending || blockUsers.isPending;

  return {
    session: { isLoading: session.isLoading, isError: session.isError },
    header: {
      isLoading: users.isLoading,
      isFetching: users.isFetching,
      total,
      canCreate,
      onRefresh: () => void users.refetch(),
      onCreateClick: () => setShowCreate(true),
    },
    list: {
      isError: users.isError,
      isLoading: users.isLoading,
      onRetry: () => void users.refetch(),
      table,
      hasFilters,
      emptyTitle: hasFilters ? "No users match your filters" : "No users yet",
      emptyDescription: hasFilters
        ? "Clear filters or adjust the search terms."
        : "Create a user to start managing access.",
      onRowClick: handleRowClick,
    },
    toolbar: {
      search: searchInput,
      onSearchChange: (value: string) => {
        setSearchInput(value);
        setRowSelection({});
      },
      onClearFilters: () => {
        setSearchInput("");
        patchListParams({ status: "all", search: "", page: 1 });
        setRowSelection({});
      },
      currentStatus: queryParams.status,
      onStatusFilter: handleStatusFilter,
    },
    bulk: {
      canUpdate,
      selectedIds,
      isMutating,
      isActivating: activateUsers.isPending,
      isBlocking: pendingAction === "block",
      onClearSelection: clearSelection,
      onBulkActivate: handleBulkActivate,
      onBulkBlock: handleBulkBlock,
    },
    pagination: {
      page: currentPage,
      pageSize: queryParams.limit,
      totalPages,
      total,
      isFetching: users.isFetching,
      onPageChange: (page: number) => {
        patchListParams({ page });
        setRowSelection({});
      },
      onPageSizeChange: (limit: number) => {
        patchListParams({ limit: limit as UsersPageSize, page: 1 });
        setRowSelection({});
      },
    },
    createDrawer: {
      open: showCreate,
      actorRoles,
      onClose: () => setShowCreate(false),
    },
    confirmBlock: {
      state: confirmBlock,
      isLoading: pendingAction === "block",
      onCancel: () => setConfirmBlock(null),
      onConfirm: handleConfirmBlock,
    },
  };
}
