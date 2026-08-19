import type { SortCriterion, SortOrder } from "@repo/api-sort";
import type { ColumnDef, Table } from "@tanstack/react-table";
import type { UseFormReturn } from "react-hook-form";

import { PAGE_SIZE_OPTIONS, type PageSize } from "@repo/config";

import type { AdminUserDto, OrganizationDto, RoleDto } from "@/lib/api-types";

import type { ProfileForm } from "./users.schemas";

// ── List params & filter types (merged from types.ts) ──────────────────────

export type UserStatusFilter = "all" | "PENDING" | "ACTIVE" | "BLOCKED";

export const USERS_PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

export type UsersPageSize = PageSize;

export type UsersSortField = "createdAt" | "displayName" | "email" | "status";

export type UsersSortOrder = SortOrder;

export type UsersSortCriterion = SortCriterion<UsersSortField>;

// ── Users table column contract (implemented in ui/users-table-columns) ─────

export interface UsersTableColumnOptions {
  canUpdate?: boolean;
  onActivate?: (userId: string) => void | Promise<void>;
  onBlock?: (userId: string) => void | Promise<void>;
  onResendVerification?: (email: string) => void | Promise<void>;
  isDisabled?: boolean;
}

/**
 * Column-factory contract: the screen injects the ui/ implementation into the
 * handler so controllers never import from ui/ (see CODING_RULES.md §10).
 */
export type UsersTableColumnFactory = (
  options?: UsersTableColumnOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors TanStack's own `columns: ColumnDef<TData, any>[]` input type
) => ColumnDef<AdminUserDto, any>[];

export interface UsersListParams {
  page: number;
  limit: UsersPageSize;
  search: string;
  status: UserStatusFilter;
  sort: UsersSortCriterion[];
}

interface MutationState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface UserStatusViewModel {
  options: readonly ("PENDING" | "ACTIVE" | "BLOCKED")[];
  selected: "PENDING" | "ACTIVE" | "BLOCKED";
  onSelect: (status: "PENDING" | "ACTIVE" | "BLOCKED") => void;
  disabled: boolean;
  canApply: boolean;
  onApply: () => void;
  state: MutationState;
}

export interface UserRolesViewModel {
  isLoading: boolean;
  options: {
    id: string;
    name: string;
    description: string | Record<string, never> | null;
    organizationId: string | Record<string, never> | null;
    scope: string;
  }[];
  selectedRoleName: string;
  selectedRoleId: string;
  onSelect: (roleId: string) => void;
  disabled: boolean;
  canSave: boolean;
  onSave: () => void;
  state: MutationState;
  organizations: { id: string; name: string }[];
  organizationsLoading: boolean;
  selectedOrganizationId: string;
  onOrganizationSelect: (organizationId: string) => void;
  needsOrganization: boolean;
  orgRequired: boolean;
  membershipExists: boolean;
}

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
    onSubmit: (values: {
      email: string;
      password: string;
      displayName: string;
      roleId: string;
      organizationId?: string | undefined;
    }) => Promise<{ data: AdminUserDto }>;
  };
  confirmBlock: {
    state: { userIds: string[]; label: string; count: number } | null;
    isLoading: boolean;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
  };
  table: Table<AdminUserDto>;
}

export interface UserDetailViewModel {
  isLoading: boolean;
  currentUser: AdminUserDto | null;
  backHref: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  flags: {
    isSelf: boolean;
    isActorSuperAdmin: boolean;
    isTargetPrivileged: boolean;
    canEdit: boolean;
  };
  profile: {
    form: UseFormReturn<ProfileForm>;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    state: MutationState;
  };
  status: UserStatusViewModel;
  roles: UserRolesViewModel;
  danger: {
    confirmOpen: boolean;
    onOpen: () => void;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
    state: MutationState;
    onRetry: () => void;
  };
}
