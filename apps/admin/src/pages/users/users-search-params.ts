import {
  formatSortParam,
  parseSortParam,
  sortCriteriaEqual,
} from "@repo/api-contract/sort/multi-sort";

import type {
  UsersListParams,
  UsersPageSize,
  UsersSortField,
  UserStatusFilter,
} from "./types";

import { DEFAULT_USERS_LIST_PARAMS, USERS_PAGE_SIZE } from "./constants";

const SORT_FIELDS = [
  "createdAt",
  "displayName",
  "email",
  "status",
] as const satisfies readonly UsersSortField[];

const STATUS_VALUES = [
  "all",
  "PENDING",
  "ACTIVE",
  "BLOCKED",
] as const satisfies readonly UserStatusFilter[];

const PAGE_SIZES = [10, 20, 30, 50, 100] as const;

function parsePageSize(value: string | null): UsersPageSize {
  const parsed = Number(value);
  return PAGE_SIZES.includes(parsed as UsersPageSize)
    ? (parsed as UsersPageSize)
    : USERS_PAGE_SIZE;
}

function parseStatus(value: string | null): UserStatusFilter {
  return STATUS_VALUES.includes(value as UserStatusFilter)
    ? (value as UserStatusFilter)
    : "all";
}

function parseSortField(value: string | null): UsersSortField {
  return SORT_FIELDS.includes(value as UsersSortField)
    ? (value as UsersSortField)
    : "createdAt";
}

export function parseUsersListSearchParams(
  searchParams: URLSearchParams,
): UsersListParams {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = parsePageSize(searchParams.get("limit"));
  const search = searchParams.get("search") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const sortField = parseSortField(searchParams.get("sortField"));
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const sort = parseSortParam(
    searchParams.get("sort") ?? undefined,
    SORT_FIELDS,
    [{ field: sortField, order: sortOrder }],
  );

  return { page, limit, search, status, sort };
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
