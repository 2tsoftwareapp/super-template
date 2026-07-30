"use client";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { getErrorMessage } from "@repo/web-utils/errors";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  UsersListParams,
  UsersListViewModel,
  UsersPageSize,
  UsersTableColumnFactory,
  UserStatusFilter,
} from "@/features/users/model/users.types";

import {
  useActivateUsers,
  useBlockUsers,
  useResendVerification,
} from "@/features/users/api/users.mutations";
import { useUsersListQuery } from "@/features/users/api/users.queries";
import { selectUserManagementPermissions } from "@/features/users/model/users.permissions";
import {
  parseUsersListSearchParams,
  serializeUsersListSearchParams,
} from "@/features/users/model/users.search-params";
import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";

import { useCreateUserDrawer } from "./use-create-user-drawer";
import { useUsersBulkActions } from "./use-users-bulk-actions";
import { useUsersConfirmBlock } from "./use-users-confirm-block";
import { useUsersTableConfig } from "./use-users-table-config";

export type { UsersListViewModel };

interface UseUsersListControllerOptions {
  /** Column factory from ui/users-table-columns, injected by the screen (§10). */
  createColumns: UsersTableColumnFactory;
}

/**
 * Orchestration hook for the users list screen.
 *
 * Flow:
 *   1. Parse URL list params; debounce search; sync toolbar input.
 *   2. List query + session permissions; table config owns sort + row selection.
 *   3. Row/bulk activate-block with confirm dialog; toast on mutation errors.
 *   4. Create-user drawer (roles/orgs) when permitted.
 * Owns: URL list params, list query, bulk/create composition.
 * Does not own: table config (use-users-table-config) or column atoms.
 */
export function useUsersListController({
  createColumns,
}: UseUsersListControllerOptions): UsersListViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const searchParams = useSearchParams();

  const listParams = useMemo(
    () => parseUsersListSearchParams(searchParams),
    [searchParams],
  );
  const [searchInput, setSearchInput] = useState(listParams.search);
  const [showCreate, setShowCreate] = useState(false);

  const debouncedSearch = useDebouncedValue(searchInput, 500);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the search input when the URL param changes (e.g. back/forward, clear filters)
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
    if (debouncedSearch !== listParams.search) {
      patchListParams({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, listParams.search, patchListParams]);

  const queryParams = useMemo(
    () => ({ ...listParams, search: debouncedSearch }),
    [listParams, debouncedSearch],
  );

  const users = useUsersListQuery(queryParams);
  const activateUsers = useActivateUsers();
  const blockUsers = useBlockUsers();
  const resendVerification = useResendVerification();

  const { confirmBlock, requestBlock, cancelBlock } = useUsersConfirmBlock();
  const { isMutating, handleBulkActivate, handleBulkBlock } = useUsersBulkActions(
    activateUsers,
    blockUsers,
    requestBlock,
  );

  const actorRoles = session.data?.data.user.roles ?? [];
  const actorOrganizationId = session.data?.data.organizationId;
  const { canCreate, canUpdate } = selectUserManagementPermissions(
    session.data?.data.permissions,
  );

  const drawerController = useCreateUserDrawer({
    open: showCreate,
    actorRoles,
    actorOrganizationId,
    onClose: () => setShowCreate(false),
  });

  const pageUsers = users.data?.data ?? [];
  const total = users.data?.meta?.total ?? 0;
  const totalPages = users.data?.meta?.totalPages ?? 1;
  const currentPage = users.data?.meta?.page ?? queryParams.page;

  const handleActivate = useCallback(
    async (userId: string) => {
      try {
        await activateUsers.mutateAsync([userId]);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [activateUsers],
  );

  const handleBlock = useCallback(
    (userId: string) => {
      requestBlock([userId], "this user", 1);
    },
    [requestBlock],
  );

  const handleResendVerification = useCallback(
    (email: string) => {
      resendVerification.mutate(email, {
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      });
    },
    [resendVerification],
  );

  const handleSortChange = useCallback(
    (nextSort: UsersListParams["sort"]) => {
      patchListParams({ sort: nextSort, page: 1 });
    },
    [patchListParams],
  );

  const { table, selectedIds, clearSelection } = useUsersTableConfig({
    pageUsers,
    listParams,
    canUpdate,
    isMutating,
    handleActivate,
    handleBlock,
    handleResendVerification,
    onSortChange: handleSortChange,
    createColumns,
  });

  const hasFilters = Boolean(searchInput || queryParams.status !== "all");

  const handleRowClick = (id: string) => {
    const returnTo = serializeUsersListSearchParams(queryParams).toString();
    const suffix = returnTo
      ? `?returnTo=${encodeURIComponent(`/users?${returnTo}`)}`
      : "";
    void router.push(`/users/${id}${suffix}`);
  };

  const handleBulkActivateAction = async () => {
    await handleBulkActivate(selectedIds, clearSelection);
  };

  const handleConfirmBlock = async () => {
    if (!confirmBlock) return;
    clearSelection();
    try {
      await blockUsers.mutateAsync(confirmBlock.userIds);
      cancelBlock();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleStatusFilter = (status: UserStatusFilter) => {
    patchListParams({ status, page: 1 });
    clearSelection();
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    clearSelection();
  };

  const handleClearFilters = () => {
    setSearchInput("");
    patchListParams({ status: "all", search: "", page: 1 });
    clearSelection();
  };

  const handlePageChange = (page: number) => {
    patchListParams({ page });
    clearSelection();
  };

  const handlePageSizeChange = (limit: number) => {
    patchListParams({ limit: limit as UsersPageSize, page: 1 });
    clearSelection();
  };

  return {
    session: { isLoading: session.isLoading, isError: session.isError },
    columnData: {
      pageUsers,
      canUpdate,
      isMutating,
      handleActivate,
      handleBlock,
      handleResendVerification,
      listParams,
      onSortChange: handleSortChange,
    },
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
      hasFilters,
      emptyTitle: hasFilters ? "No users match your filters" : "No users yet",
      emptyDescription: hasFilters
        ? "Clear filters or adjust the search terms."
        : "Create a user to start managing access.",
      onRowClick: handleRowClick,
    },
    toolbar: {
      search: searchInput,
      onSearchChange: handleSearchChange,
      onClearFilters: handleClearFilters,
      currentStatus: queryParams.status,
      onStatusFilter: handleStatusFilter,
    },
    bulk: {
      canUpdate,
      selectedIds,
      isMutating,
      isActivating: activateUsers.isPending,
      isBlocking: Boolean(confirmBlock && blockUsers.isPending),
      onClearSelection: clearSelection,
      onBulkActivate: handleBulkActivateAction,
      onBulkBlock: () => handleBulkBlock(selectedIds),
    },
    pagination: {
      page: currentPage,
      pageSize: queryParams.limit,
      totalPages,
      total,
      isFetching: users.isFetching,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
    },
    createDrawer: {
      open: showCreate,
      actorRoles,
      actorOrganizationId,
      assignableRoles: drawerController.allAssignable,
      organizations: drawerController.organizations,
      isOrganizationsLoading: drawerController.isOrganizationsLoading,
      isSaving: drawerController.isSaving,
      onClose: () => setShowCreate(false),
      onSubmit: drawerController.onSubmit,
    },
    confirmBlock: {
      state: confirmBlock,
      isLoading: Boolean(confirmBlock && blockUsers.isPending),
      onCancel: cancelBlock,
      onConfirm: handleConfirmBlock,
    },
    table,
  };
}
