import {
  formatSortParam,
  parseSortParam,
  sortCriteriaEqual,
} from "@repo/api-sort";
import {
  enumParam,
  pageParam,
  pageSizeParam,
  parseSearchParams,
  searchTextParam,
  sortOrderParam,
} from "@repo/web-utils/params";
import { z } from "zod";

import type { UsersListParams, UsersSortField } from "./users.types";

import { DEFAULT_USERS_LIST_PARAMS, USERS_PAGE_SIZE } from "./constants";

const SORT_FIELDS = [
  "createdAt",
  "displayName",
  "email",
  "status",
] as const satisfies readonly UsersSortField[];

const PAGE_SIZES = [10, 20, 30, 50, 100] as const;

const usersListParamsSchema = z.object({
  page: pageParam,
  limit: pageSizeParam([...PAGE_SIZES], USERS_PAGE_SIZE),
  search: searchTextParam(200),
  status: enumParam(["all", "PENDING", "ACTIVE", "BLOCKED"], "all"),
  sortField: enumParam([...SORT_FIELDS], "createdAt"),
  sortOrder: sortOrderParam("desc"),
  /** Multi-column sort (`field:order,...`); empty means fall back to sortField/sortOrder. */
  sort: z.string().optional().catch(""),
});

const USERS_LIST_PARAMS_FALLBACK = {
  page: 1,
  limit: USERS_PAGE_SIZE,
  search: "",
  status: "all",
  sortField: "createdAt",
  sortOrder: "desc",
  sort: "",
} as const;

export function parseUsersListSearchParams(
  searchParams: URLSearchParams,
): UsersListParams {
  const parsed = parseSearchParams(
    usersListParamsSchema,
    searchParams,
    USERS_LIST_PARAMS_FALLBACK,
  );

  const defaultSort = DEFAULT_USERS_LIST_PARAMS.sort;
  // Prefer compact multi-sort (`sort=field:order,...`) when present; otherwise
  // fall back to the single-column sortField/sortOrder pair.
  const rawMultiSort = searchParams.get("sort");
  const sort =
    rawMultiSort && rawMultiSort.trim()
      ? parseSortParam(rawMultiSort, SORT_FIELDS, defaultSort)
      : [
          {
            field: parsed.data.sortField,
            order: parsed.data.sortOrder,
          },
        ];

  return {
    page: parsed.data.page,
    limit: parsed.data.limit,
    search: parsed.data.search,
    status: parsed.data.status,
    sort,
  };
}

export function serializeUsersListSearchParams(
  params: UsersListParams,
): URLSearchParams {
  const searchParams = new URLSearchParams();
  const defaults = DEFAULT_USERS_LIST_PARAMS;
  const primarySort = params.sort[0] ?? defaults.sort[0];

  if (params.page !== defaults.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit !== USERS_PAGE_SIZE) {
    searchParams.set("limit", String(params.limit));
  }

  const trimmedSearch = params.search.trim();
  if (trimmedSearch) {
    searchParams.set("search", trimmedSearch);
  }

  if (params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (
    primarySort.field !== defaults.sort[0].field ||
    primarySort.order !== defaults.sort[0].order
  ) {
    searchParams.set("sortField", primarySort.field);
    searchParams.set("sortOrder", primarySort.order);
  }

  if (params.sort.length > 1) {
    searchParams.set("sort", formatSortParam(params.sort));
  }

  return searchParams;
}

export function usersListParamsEqual(
  left: UsersListParams,
  right: UsersListParams,
): boolean {
  return (
    left.page === right.page &&
    left.limit === right.limit &&
    left.search === right.search &&
    left.status === right.status &&
    sortCriteriaEqual(left.sort, right.sort)
  );
}
