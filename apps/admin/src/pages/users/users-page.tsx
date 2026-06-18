import {
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { BulkActionBar } from "@/components/bulk-action-bar";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceTable } from "@/components/resource-table";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminResources } from "@/lib/admin-resources";
import { useSession } from "@/lib/session";

import { CreateUserDrawer } from "./create-user-drawer";
import { STATUS_FILTERS } from "./constants";
import { paramsFromSortingState, sortingStateFromParams, usersSortChanged } from "./sorting";
import { useDebouncedValue } from "./use-debounced-value";
import {
  useAdminRolesQuery,
  useUpdateUsersStatusMutation,
  useUsersListQuery,
} from "./use-users-queries";
import {
  parseUsersListSearchParams,
  serializeUsersListSearchParams,
} from "./users-search-params";
import { createUsersTableColumns } from "./users-table-columns";
import { UsersPagination } from "./users-pagination";
import type { UserStatusFilter, UsersListParams } from "./types";

const usersResource = adminResources.find((resource) => resource.id === "users")!;

export function UsersPage() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const listParams = useMemo(
    () => parseUsersListSearchParams(searchParams),
    [searchParams],
  );
  const [searchInput, setSearchInput] = useState(listParams.search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showCreate, setShowCreate] = useState(false);

  const debouncedSearch = useDebouncedValue(searchInput);

  useEffect(() => {
    setSearchInput(listParams.search);
  }, [listParams.search]);

  const patchListParams = useCallback(
    (patch: Partial<UsersListParams>) => {
      const next = { ...listParams, ...patch };
      const serialized = serializeUsersListSearchParams(next).toString();

      if (serialized === searchParams.toString()) {
        return;
      }

      setSearchParams(serialized ? `?${serialized}` : "", { replace: true });
    },
    [listParams, searchParams, setSearchParams],
  );

  useEffect(() => {
    if (debouncedSearch === listParams.search) {
      return;
    }

    patchListParams({ search: debouncedSearch, page: 1 });
  }, [debouncedSearch, listParams.search, patchListParams]);

  const queryParams = useMemo(
    () => ({
      ...listParams,
      search: debouncedSearch,
    }),
    [listParams, debouncedSearch],
  );

  const roles = useAdminRolesQuery({ enabled: showCreate });
  const users = useUsersListQuery(queryParams);
  const updateUserStatus = useUpdateUsersStatusMutation();

  const actorRoles = session.data?.data.user.roles ?? [];
  const permissions = session.data?.data.permissions ?? [];
  const canCreate = permissions.includes("users.create");
  const canUpdate = permissions.includes("users.update");

  const pageUsers = users.data?.data ?? [];
  const total = users.data?.meta?.total ?? 0;
  const totalPages = users.data?.meta?.totalPages ?? 1;
  const currentPage = users.data?.meta?.page ?? queryParams.page;

  const columns = useMemo(() => createUsersTableColumns(), []);
  const sorting = useMemo(
    () => sortingStateFromParams(queryParams),
    [queryParams.sort],
  );

  const setStatusFilter = (status: UserStatusFilter) => {
    patchListParams({ status, page: 1 });
    setRowSelection({});
  };

  const handleSortingChange = (updater: Updater<SortingState>) => {
    const currentSorting = sortingStateFromParams(listParams);
    const nextSorting =
      typeof updater === "function" ? updater(currentSorting) : updater;
    const resolvedSorting =
      nextSorting.length > 0 ? nextSorting : currentSorting;
    const { sort: nextSort } = paramsFromSortingState(resolvedSorting, listParams);

    if (!usersSortChanged(listParams.sort, nextSort)) {
      return;
    }

    patchListParams({ sort: nextSort, page: 1 });
    setRowSelection({});
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: pageUsers,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableMultiSort: true,
    maxMultiSortColCount: 4,
    enableSortingRemoval: false,
    onSortingChange: handleSortingChange,
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
  });

  const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
  const hasFilters = Boolean(searchInput || queryParams.status !== "all");

  const resultLabel = users.isLoading
    ? "Loading users"
    : total === 0
      ? "No users found"
      : `${total} users total · page ${currentPage} of ${Math.max(totalPages, 1)} · ${queryParams.limit} per page · shift+click headers to sort by multiple columns`;

  return (
    <>
      {showCreate ? (
        <CreateUserDrawer
          open={showCreate}
          onClose={() => setShowCreate(false)}
          actorRoles={actorRoles}
          roles={roles.data?.data ?? []}
        />
      ) : null}

      <ResourcePageShell
        resource={usersResource}
        description="Manage accounts, roles, status, and operational access from one resource view."
        isRefreshing={users.isFetching || (showCreate && roles.isFetching)}
        onRefresh={() => {
          void users.refetch();
          if (showCreate) {
            void roles.refetch();
          }
        }}
        actions={
          canCreate ? (
            <Button onClick={() => setShowCreate(true)}>
              <UserPlus data-icon="inline-start" />
              New user
            </Button>
          ) : null
        }
      >
        <Card>
          <ResourceToolbar
            search={searchInput}
            onSearchChange={(value) => {
              setSearchInput(value);
              if (value === "") {
                patchListParams({ search: "", page: 1 });
              }
              setRowSelection({});
            }}
            searchPlaceholder="Search name or email"
            hasFilters={hasFilters}
            onClearFilters={() => {
              setSearchInput("");
              patchListParams({ status: "all", search: "", page: 1 });
              setRowSelection({});
            }}
            filters={
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
                {STATUS_FILTERS.map((tab) => (
                  <Button
                    key={tab.value}
                    type="button"
                    variant={queryParams.status === tab.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(tab.value)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            }
            resultLabel={resultLabel}
          />
          <BulkActionBar
            selectedCount={selectedIds.length}
            onClear={() => setRowSelection({})}
            actions={
              canUpdate ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateUserStatus.isPending}
                    onClick={() =>
                      updateUserStatus.mutate(
                        { userIds: selectedIds, status: "ACTIVE" },
                        { onSuccess: () => setRowSelection({}) },
                      )
                    }
                  >
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateUserStatus.isPending}
                    onClick={() =>
                      updateUserStatus.mutate(
                        { userIds: selectedIds, status: "BLOCKED" },
                        { onSuccess: () => setRowSelection({}) },
                      )
                    }
                  >
                    Block
                  </Button>
                </>
              ) : null
            }
          />
          <CardContent className="p-0 pb-1">
            <ResourceTable
              table={table}
              binarySort
              multiSort
              isLoading={users.isLoading}
              emptyTitle={hasFilters ? "No users match your filters" : "No users yet"}
              emptyDescription={
                hasFilters
                  ? "Clear filters or adjust the search terms."
                  : "Create a user to start managing access."
              }
              onRowClick={(row) => {
                const returnTo = serializeUsersListSearchParams(queryParams).toString();
                const suffix = returnTo ? `?returnTo=${encodeURIComponent(`/users?${returnTo}`)}` : "";
                void navigate(`/users/${row.original.id}${suffix}`);
              }}
            />
            <UsersPagination
              page={currentPage}
              limit={queryParams.limit}
              totalPages={totalPages}
              total={total}
              isLoading={users.isFetching}
              onPageChange={(page) => {
                patchListParams({ page });
                setRowSelection({});
              }}
              onLimitChange={(limit) => {
                patchListParams({ limit, page: 1 });
                setRowSelection({});
              }}
            />
          </CardContent>
        </Card>
      </ResourcePageShell>
    </>
  );
}
