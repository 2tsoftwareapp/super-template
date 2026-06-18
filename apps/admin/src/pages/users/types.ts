import type { SortCriterion, SortOrder } from "@repo/api-contract/sort/multi-sort";

export type UserStatusFilter = "all" | "PENDING" | "ACTIVE" | "BLOCKED";

export const USERS_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;

export type UsersPageSize = (typeof USERS_PAGE_SIZE_OPTIONS)[number];

export type UsersSortField = "createdAt" | "displayName" | "email" | "status";

export type UsersSortOrder = SortOrder;

export type UsersSortCriterion = SortCriterion<UsersSortField>;

export interface UsersListParams {
  page: number;
  limit: UsersPageSize;
  search: string;
  status: UserStatusFilter;
  sort: UsersSortCriterion[];
}
