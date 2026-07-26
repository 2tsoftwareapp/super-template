import {
  formatSortParam,
  sortCriteriaEqual,
} from "@repo/api-sort";

import { createTableSortBridge } from "@/lib/table-sort";

import type { UsersListParams, UsersSortCriterion } from "./users.types";

const usersTableSort = createTableSortBridge<UsersSortCriterion["field"]>({
  fieldByColumn: {
    user: "displayName",
    email: "email",
    status: "status",
    createdAt: "createdAt",
  },
  columnByField: {
    displayName: "user",
    email: "email",
    status: "status",
    createdAt: "createdAt",
  },
});

export function sortingStateFromParams(params: Pick<UsersListParams, "sort">) {
  return usersTableSort.sortingStateFromParams(params.sort);
}

export function paramsFromSortingState(
  sorting: Parameters<typeof usersTableSort.paramsFromSortingState>[0],
  current: Pick<UsersListParams, "sort">,
): Pick<UsersListParams, "sort"> {
  const sort = usersTableSort.paramsFromSortingState(sorting, current.sort);
  return { sort };
}

export function usersSortKey(sort: UsersSortCriterion[]) {
  return formatSortParam(sort);
}

export function usersSortChanged(
  current: UsersSortCriterion[],
  next: UsersSortCriterion[],
) {
  return !sortCriteriaEqual(current, next);
}
