"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import type {
  UsersListParams,
  UsersListViewModel,
  UsersPageSize,
  UsersSortCriterion,
  UsersTableColumnFactory,
  UserStatusFilter,
} from "@/features/users/model/users.types";
import type { AdminUserDto } from "@/lib/api-types";

import { useResourceTableConfig } from "@/components/use-resource-table-config";
import {
  useActivateUsers,
  useBlockUsers,
  useResendVerification,
} from "@/features/users/api/users.mutations";
import { useUsersListQuery } from "@/features/users/api/users.queries";
import { selectUserManagementPermissions } from "@/features/users/model/users.permissions";
import { serializeUsersListSearchParams } from "@/features/users/model/users.search-params";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "@/i18n/navigation";
import { createTableSortBridge } from "@/lib/table-sort";

import { useCreateUserDrawer } from "./use-create-user-drawer";
import { useUsersBulkActions } from "./use-users-bulk-actions";
import { useUsersConfirmBlock } from "./use-users-confirm-block";
import { useUsersListUrlState } from "./use-users-list-url-state";

const usersSortBridge = createTableSortBridge<UsersSortCriterion["field"]>({
  fieldByColumn: { user: "displayName", email: "email", status: "status", createdAt: "createdAt" },
  columnByField: { displayName: "user", email: "email", status: "status", createdAt: "createdAt" },
});

export type { UsersListViewModel };

interface UseUsersListControllerOptions {
  createColumns: UsersTableColumnFactory;
}

/**
 * Orchestration hook for the users list screen.
 * Composes useUsersListUrlState (URL sync) with queries, mutations, and UI state.
 */
export function useUsersListController({
  createColumns,
}: UseUsersListControllerOptions): UsersListViewModel {
  const router = useRouter();
  const session = useSession();
  const { listParams, searchInput, setSearchInput, patchListParams, queryParams } =
    useUsersListUrlState();
  const [showCreate, setShowCreate] = useState(false);

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
  const { canCreate, canUpdate } = selectUserManagementPermissions(session.data?.data.permissions);

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

  const { table, selectedIds, clearSelection, handlePageChange, handlePageSizeChange } =
    useResourceTableConfig<AdminUserDto, UsersSortCriterion["field"]>({
      data: pageUsers,
      listParams,
      sortBridge: usersSortBridge,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- model now any[]
      columns: createColumns({
        canUpdate,
        onActivate: handleActivate,
        onBlock: handleBlock,
        onResendVerification: handleResendVerification,
        isDisabled: isMutating,
      }),
      onSortChange: handleSortChange,
      onPageChange: (page) => patchListParams({ page }),
      onPageSizeChange: (limit) => patchListParams({ limit: limit as UsersPageSize, page: 1 }),
    });

  const hasFilters = Boolean(searchInput || queryParams.status !== "all");

  const handleRowClick = (id: string) => {
    const returnTo = serializeUsersListSearchParams(queryParams).toString();
    const suffix = returnTo ? `?returnTo=${encodeURIComponent(`/users?${returnTo}`)}` : "";
    void router.push(`/users/${id}${suffix}`);
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
      hasFilters,
      emptyTitle: hasFilters ? "No users match your filters" : "No users yet",
      emptyDescription: hasFilters
        ? "Clear filters or adjust the search terms."
        : "Create a user to start managing access.",
      onRowClick: handleRowClick,
    },
    toolbar: {
      search: searchInput,
      onSearchChange: (v: string) => {
        setSearchInput(v);
        clearSelection();
      },
      onClearFilters: () => {
        setSearchInput("");
        patchListParams({ status: "all", search: "", page: 1 });
        clearSelection();
      },
      currentStatus: queryParams.status,
      onStatusFilter: (status: UserStatusFilter) => {
        patchListParams({ status, page: 1 });
        clearSelection();
      },
    },
    bulk: {
      canUpdate,
      selectedIds,
      isMutating,
      isActivating: activateUsers.isPending,
      isBlocking: Boolean(confirmBlock && blockUsers.isPending),
      onClearSelection: clearSelection,
      onBulkActivate: async () => {
        await handleBulkActivate(selectedIds, clearSelection);
      },
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
