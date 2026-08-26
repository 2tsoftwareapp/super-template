import { parseSortParam, type SortCriterion, type SortOrder, sortsFromQuery } from "@repo/api-runtime";

export const USER_SORT_FIELDS = ["createdAt", "displayName", "email", "status"] as const;

export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export type UserSortOrder = SortOrder;

export type UserSortCriterion = SortCriterion<UserSortField>;

const USER_SORT_FIELD_SET = new Set<UserSortField>(USER_SORT_FIELDS);

export function parseUserSortParam(
  sort: string | undefined,
  fallback: UserSortCriterion[],
): UserSortCriterion[] {
  return parseSortParam(sort, USER_SORT_FIELD_SET, fallback);
}

export function userSortsFromQuery(query: {
  sort?: string | undefined;
  sortField: UserSortField;
  sortOrder: UserSortOrder;
}): UserSortCriterion[] {
  return sortsFromQuery(query, USER_SORT_FIELD_SET);
}
