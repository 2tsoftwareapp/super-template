import { formatSortParam } from "@repo/api-contract/sort/multi-sort";

import { buildAdminUsersListPath } from "@/lib/search-params";

import type { UsersListParams } from "../model/types";

export function buildUsersListPath(params: UsersListParams) {
  const primarySort = params.sort[0] ?? { field: "createdAt", order: "desc" };
  const overrides = {
    page: params.page,
    limit: params.limit,
    search: params.search.trim(),
    status: params.status === "all" ? "ALL" : params.status,
    sortField: primarySort.field,
    sortOrder: primarySort.order,
  } as const;

  let listPath = buildAdminUsersListPath(overrides);

  if (params.sort.length > 1) {
    const url = new URL(listPath, "http://localhost");
    url.searchParams.set("sort", formatSortParam(params.sort));
    listPath = url.pathname + url.search;
  }

  return listPath;
}
