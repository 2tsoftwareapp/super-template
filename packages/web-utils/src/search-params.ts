import { bffPath } from "@repo/api-contract";
import type {
  inferParserType
} from "nuqs/server";

import {
  createLoader,
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

const sortOrders = ["asc", "desc"] as const;
const projectStatuses = ["ALL", "DRAFT", "ACTIVE", "ARCHIVED"] as const;
const userStatuses = ["ALL", "PENDING", "ACTIVE", "BLOCKED"] as const;
const projectSortFields = ["updatedAt", "createdAt", "name", "status"] as const;
const userSortFields = ["createdAt", "displayName", "email", "status"] as const;

interface SelectOption<T extends string | number | boolean> {
  label: string;
  value: T;
}

const normalizeQueryString = (query: string) =>
  query.startsWith("?") ? query.slice(1) : query;

const withQuery = (path: string, query: string) => {
  const normalizedQuery = normalizeQueryString(query);

  return normalizedQuery ? `${path}?${normalizedQuery}` : path;
};

export const sortOrderOptions = [
  { label: "Descending", value: "desc" },
  { label: "Ascending", value: "asc" },
] satisfies readonly SelectOption<(typeof sortOrders)[number]>[];

export const projectStatusOptions = [
  { label: "All statuses", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
] satisfies readonly SelectOption<(typeof projectStatuses)[number]>[];

export const projectSortFieldOptions = [
  { label: "Recently updated", value: "updatedAt" },
  { label: "Recently created", value: "createdAt" },
  { label: "Name", value: "name" },
  { label: "Status", value: "status" },
] satisfies readonly SelectOption<(typeof projectSortFields)[number]>[];

export const userStatusOptions = [
  { label: "All statuses", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Blocked", value: "BLOCKED" },
] satisfies readonly SelectOption<(typeof userStatuses)[number]>[];

export const userSortFieldOptions = [
  { label: "Created at", value: "createdAt" },
  { label: "Display name", value: "displayName" },
  { label: "Email", value: "email" },
  { label: "Status", value: "status" },
] satisfies readonly SelectOption<(typeof userSortFields)[number]>[];

export const notificationUnreadOptions = [
  { label: "All notifications", value: false },
  { label: "Unread only", value: true },
] satisfies readonly SelectOption<boolean>[];

export const projectsSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(""),
  status: parseAsStringLiteral(projectStatuses).withDefault("ALL"),
  sortField: parseAsStringLiteral(projectSortFields).withDefault("updatedAt"),
  sortOrder: parseAsStringLiteral(sortOrders).withDefault("desc"),
};

export const usersSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(""),
  status: parseAsStringLiteral(userStatuses).withDefault("ALL"),
  role: parseAsString.withDefault(""),
  sortField: parseAsStringLiteral(userSortFields).withDefault("createdAt"),
  sortOrder: parseAsStringLiteral(sortOrders).withDefault("desc"),
};

export const notificationsSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(20),
  unread: parseAsBoolean.withDefault(false),
  type: parseAsString.withDefault(""),
};

export const auditLogsSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(20),
  actorId: parseAsString.withDefault(""),
  action: parseAsString.withDefault(""),
  resourceType: parseAsString.withDefault(""),
  resourceId: parseAsString.withDefault(""),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  sortOrder: parseAsStringLiteral(sortOrders).withDefault("desc"),
};

export const sessionsSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(20),
};

export const projectNavigationSearchParams = {
  returnTo: parseAsString.withDefault("/projects"),
};

const loadProjectsSearchParams = createLoader(projectsSearchParams);
const loadUsersSearchParams = createLoader(usersSearchParams);
const loadNotificationsSearchParams = createLoader(notificationsSearchParams);
const loadAuditLogsSearchParams = createLoader(auditLogsSearchParams);
const loadSessionsSearchParams = createLoader(sessionsSearchParams);
const loadProjectNavigationSearchParams = createLoader(
  projectNavigationSearchParams,
);

type SyncLoaderInput =
  | URL
  | Request
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | string;

const projectsSerializer = createSerializer(projectsSearchParams);
const usersSerializer = createSerializer(usersSearchParams);
const notificationsSerializer = createSerializer(notificationsSearchParams);
const auditLogsSerializer = createSerializer(auditLogsSearchParams);
const sessionsSerializer = createSerializer(sessionsSearchParams);

export type ProjectsSearchState = inferParserType<typeof projectsSearchParams>;
export type UsersSearchState = inferParserType<typeof usersSearchParams>;
export type NotificationsSearchState = inferParserType<
  typeof notificationsSearchParams
>;
export type AuditLogsSearchState = inferParserType<
  typeof auditLogsSearchParams
>;
export type SessionsSearchState = inferParserType<typeof sessionsSearchParams>;
export type ProjectNavigationState = inferParserType<
  typeof projectNavigationSearchParams
>;

export const defaultProjectsSearch: ProjectsSearchState =
  loadProjectsSearchParams(new URLSearchParams());
export const defaultUsersSearch: UsersSearchState = loadUsersSearchParams(
  new URLSearchParams(),
);
export const defaultNotificationsSearch: NotificationsSearchState =
  loadNotificationsSearchParams(new URLSearchParams());
export const defaultAuditLogsSearch: AuditLogsSearchState =
  loadAuditLogsSearchParams(new URLSearchParams());
export const defaultSessionsSearch: SessionsSearchState =
  loadSessionsSearchParams(new URLSearchParams());
export const defaultProjectNavigation: ProjectNavigationState =
  loadProjectNavigationSearchParams(new URLSearchParams());

const mergeProjectsSearch = (
  overrides: Partial<ProjectsSearchState> = {},
): ProjectsSearchState => ({
  ...defaultProjectsSearch,
  ...overrides,
});

const mergeUsersSearch = (
  overrides: Partial<UsersSearchState> = {},
): UsersSearchState => ({
  ...defaultUsersSearch,
  ...overrides,
});

const mergeNotificationsSearch = (
  overrides: Partial<NotificationsSearchState> = {},
): NotificationsSearchState => ({
  ...defaultNotificationsSearch,
  ...overrides,
});

const mergeAuditLogsSearch = (
  overrides: Partial<AuditLogsSearchState> = {},
): AuditLogsSearchState => ({
  ...defaultAuditLogsSearch,
  ...overrides,
});

const mergeSessionsSearch = (
  overrides: Partial<SessionsSearchState> = {},
): SessionsSearchState => ({
  ...defaultSessionsSearch,
  ...overrides,
});

export const serializeProjectsSearch = (state: ProjectsSearchState) =>
  projectsSerializer({
    page: state.page,
    limit: state.limit,
    ...(state.search ? { search: state.search } : {}),
    ...(state.status !== "ALL" ? { status: state.status } : {}),
    ...(state.sortField !== "updatedAt" ? { sortField: state.sortField } : {}),
    ...(state.sortOrder !== "desc" ? { sortOrder: state.sortOrder } : {}),
  });

export const serializeUsersSearch = (state: UsersSearchState) =>
  usersSerializer({
    page: state.page,
    limit: state.limit,
    ...(state.search ? { search: state.search } : {}),
    ...(state.status !== "ALL" ? { status: state.status } : {}),
    ...(state.role ? { role: state.role } : {}),
    ...(state.sortField !== "createdAt" ? { sortField: state.sortField } : {}),
    ...(state.sortOrder !== "desc" ? { sortOrder: state.sortOrder } : {}),
  });

export const serializeNotificationsSearch = (state: NotificationsSearchState) =>
  notificationsSerializer({
    page: state.page,
    limit: state.limit,
    ...(state.unread ? { unread: true } : {}),
    ...(state.type ? { type: state.type } : {}),
  });

export const serializeAuditLogsSearch = (state: AuditLogsSearchState) =>
  auditLogsSerializer({
    page: state.page,
    limit: state.limit,
    ...(state.actorId ? { actorId: state.actorId } : {}),
    ...(state.action ? { action: state.action } : {}),
    ...(state.resourceType ? { resourceType: state.resourceType } : {}),
    ...(state.resourceId ? { resourceId: state.resourceId } : {}),
    ...(state.from ? { from: state.from } : {}),
    ...(state.to ? { to: state.to } : {}),
    ...(state.sortOrder !== "desc" ? { sortOrder: state.sortOrder } : {}),
  });

export const serializeSessionsSearch = (state: SessionsSearchState) =>
  sessionsSerializer({
    page: state.page,
    limit: state.limit,
  });

export const normalizeProjectsSearch = (input: SyncLoaderInput) =>
  loadProjectsSearchParams(input);

export const normalizeUsersSearch = (input: SyncLoaderInput) =>
  loadUsersSearchParams(input);

export const normalizeNotificationsSearch = (input: SyncLoaderInput) =>
  loadNotificationsSearchParams(input);

export const normalizeAuditLogsSearch = (input: SyncLoaderInput) =>
  loadAuditLogsSearchParams(input);

export const normalizeSessionsSearch = (input: SyncLoaderInput) =>
  loadSessionsSearchParams(input);

export const normalizeProjectNavigation = (input: SyncLoaderInput) =>
  loadProjectNavigationSearchParams(input);

export const buildProjectsListPath = (
  overrides: Partial<ProjectsSearchState> = {},
) =>
  withQuery(
    // Legacy helper — no `/projects` resource in current OpenAPI.
    "/api/bff/projects",
    serializeProjectsSearch(mergeProjectsSearch(overrides)),
  );

export const buildAdminUsersListPath = (
  overrides: Partial<UsersSearchState> = {},
) =>
  withQuery(
    bffPath("/api/v1/admin/users"),
    serializeUsersSearch(mergeUsersSearch(overrides)),
  );

export const buildNotificationsListPath = (
  overrides: Partial<NotificationsSearchState> = {},
) =>
  withQuery(
    bffPath("/api/v1/notifications"),
    serializeNotificationsSearch(mergeNotificationsSearch(overrides)),
  );

export const buildAuditLogsListPath = (
  overrides: Partial<AuditLogsSearchState> = {},
) =>
  withQuery(
    bffPath("/api/v1/admin/audit-logs"),
    serializeAuditLogsSearch(mergeAuditLogsSearch(overrides)),
  );

export const buildSessionsListPath = (
  overrides: Partial<SessionsSearchState> = {},
) =>
  withQuery(
    bffPath("/api/v1/auth/sessions"),
    serializeSessionsSearch(mergeSessionsSearch(overrides)),
  );

export const buildProjectReturnTo = (
  filters: Partial<ProjectsSearchState> = {},
) =>
  withQuery("/projects", serializeProjectsSearch(mergeProjectsSearch(filters)));

export const normalizeProjectReturnTo = (value: string | null | undefined) => {
  const candidate =
    typeof value === "string" ? value : defaultProjectNavigation.returnTo;

  if (!candidate.startsWith("/projects") || candidate.startsWith("//")) {
    return defaultProjectNavigation.returnTo;
  }

  return candidate;
};

const buildProjectNavigationQuery = (returnTo?: string) =>
  new URLSearchParams({
    returnTo: normalizeProjectReturnTo(returnTo),
  }).toString();

export const buildProjectDetailPath = (projectId: string, returnTo?: string) =>
  withQuery(`/projects/${projectId}`, buildProjectNavigationQuery(returnTo));

export const buildProjectEditPath = (projectId: string, returnTo?: string) =>
  withQuery(
    `/projects/${projectId}/edit`,
    buildProjectNavigationQuery(returnTo),
  );

export const buildProjectCreatePath = (returnTo?: string) =>
  withQuery("/projects/new", buildProjectNavigationQuery(returnTo));

export const normalizeBffListPath = (
  path: string,
  searchParams: URLSearchParams,
) => {
  if (path === "projects") {
    return withQuery(
      path,
      serializeProjectsSearch(normalizeProjectsSearch(searchParams)),
    );
  }

  if (path === "admin/users") {
    return withQuery(
      path,
      serializeUsersSearch(normalizeUsersSearch(searchParams)),
    );
  }

  if (path === "notifications") {
    return withQuery(
      path,
      serializeNotificationsSearch(normalizeNotificationsSearch(searchParams)),
    );
  }

  if (path === "admin/audit-logs") {
    return withQuery(
      path,
      serializeAuditLogsSearch(normalizeAuditLogsSearch(searchParams)),
    );
  }

  if (path === "auth/sessions") {
    return withQuery(
      path,
      serializeSessionsSearch(normalizeSessionsSearch(searchParams)),
    );
  }

  return withQuery(path, searchParams.toString());
};
