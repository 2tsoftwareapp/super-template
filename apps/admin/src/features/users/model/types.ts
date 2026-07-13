import type {
  SortCriterion,
  SortOrder,
} from "@repo/api-sort";
import { PAGE_SIZE_OPTIONS, type PageSize } from "@repo/config";

export type UserStatusFilter = "all" | "PENDING" | "ACTIVE" | "BLOCKED";

export const USERS_PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

export type UsersPageSize = PageSize;

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
