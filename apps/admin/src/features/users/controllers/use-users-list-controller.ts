"use client";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  UsersListParams,
  UsersPageSize,
  UserStatusFilter,
} from "@/features/users/model/types";
import type {
  AdminUserDto,
  OrganizationDto,
  RoleDto,
} from "@/lib/api-types";

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

import { useCreateUserDrawerController } from "./use-create-user-drawer-controller";
import { useUsersBulkActions } from "./use-users-bulk-actions";
import { useUsersConfirmBlock } from "./use-users-confirm-block";

export interface UsersListViewModel {
  session: { isLoading: boolean; isError: boolean };
  columnData: {
    pageUsers: AdminUserDto[];
    canUpdate: boolean;
    isMutating: boolean;
    handleActivate: (userId: string) => Promise<void>;
    handleBlock: (userId: string) => void;
    handleResendVerification: (email: string) => void;
    listParams: UsersListParams;
    onSortChange: (nextSort: UsersListParams["sort"]) => void;
  };
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
    actorOrganizationId: string | null | undefined;
    assignableRoles: RoleDto[];
    organizations: OrganizationDto[];
    isOrganizationsLoading: boolean;
    isSaving: boolean;
    onClose: () => void;
    onSubmit: (values: { email: string; password: string; displayName: string; roleId: string; organizationId?: string | undefined }) => Promise<{ data: AdminUserDto }>;
  };
  confirmBlock: {
    state: { userIds: string[]; label: string; count: number } | null;
    isLoading: boolean;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
  };
}

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
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const drawerController = useCreateUserDrawerController({
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
      await activateUsers.mutateAsync([userId]);
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
      resendVerification.mutate(email);
    },
    [resendVerification],
  );

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const handleSortChange = useCallback(
    (nextSort: UsersListParams["sort"]) => {
      patchListParams({ sort: nextSort, page: 1 });
    },
    [patchListParams],
  );

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
    await blockUsers.mutateAsync(confirmBlock.userIds);
    cancelBlock();
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
  };
}
