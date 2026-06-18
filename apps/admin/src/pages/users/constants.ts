import type { UserStatusFilter, UsersListParams, UsersPageSize } from "./types";

export { USERS_PAGE_SIZE_OPTIONS, type UsersPageSize } from "./types";

export const USERS_PAGE_SIZE = 20 satisfies UsersPageSize;

export const USERS_QUERY_KEY = "admin-users" as const;
export const ROLES_QUERY_KEY = "admin-roles" as const;

export const STATUS_FILTERS: Array<{ value: UserStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "BLOCKED", label: "Blocked" },
];

export const DEFAULT_USERS_LIST_PARAMS = {
  page: 1,
  limit: USERS_PAGE_SIZE,
  search: "",
  status: "all",
  sort: [{ field: "createdAt", order: "desc" }],
} as const satisfies Omit<UsersListParams, "limit"> & { limit: UsersPageSize };
