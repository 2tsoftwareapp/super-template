import { formatSortParam } from "@repo/api-contract/sort/multi-sort";

import type { UsersListParams } from "./types";

export function buildUsersListPath(params: UsersListParams) {
  const primarySort = params.sort[0] ?? { field: "createdAt", order: "desc" };
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    sortField: primarySort.field,
    sortOrder: primarySort.order,
  });

  if (params.sort.length > 1) {
    searchParams.set("sort", formatSortParam(params.sort));
  }

  const trimmedSearch = params.search.trim();
  if (trimmedSearch) {
    searchParams.set("search", trimmedSearch);
  }

  if (params.status !== "all") {
    searchParams.set("status", params.status);
  }

  return `/api/v1/admin/users?${searchParams.toString()}`;
}
