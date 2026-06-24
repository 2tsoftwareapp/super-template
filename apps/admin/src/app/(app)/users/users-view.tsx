"use client";

import { useDebouncedValue } from "@repo/web-core/hooks";
import {
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { AlertTriangle, RefreshCw, UserPlus, Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BulkActionBar } from "@/components/bulk-action-bar";
import { ResourceTable } from "@/components/resource-table";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { webFetch } from "@/lib/http";

import { STATUS_FILTERS } from "./constants";
import { CreateUserDrawer } from "./create-user-drawer";
import {
  paramsFromSortingState,
  sortingStateFromParams,
  usersSortChanged,
} from "./sorting";
import { useBulkMutation } from "@/hooks/use-bulk-mutation";

import { useUsersListQuery } from "./use-users-queries";
import { USERS_PAGE_SIZE_OPTIONS, type UsersListParams, type UsersPageSize, type UserStatusFilter } from "./types";
import {
  parseUsersListSearchParams,
  serializeUsersListSearchParams,
} from "./users-search-params";
import { createUsersTableColumns } from "./users-table-columns";

export function UsersView() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const searchParams = useSearchParams();

  const listParams = useMemo(
    () => parseUsersListSearchParams(searchParams),
    [searchParams],
  );
  const [searchInput, setSearchInput] = useState(listParams.search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showCreate, setShowCreate] = useState(false);
  const [pendingAction, setPendingAction] = useState<"activate" | "block" | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<{
    userIds: string[];
    label: string;
    count: number;
  } | null>(null);

  const debouncedSearch = useDebouncedValue(searchInput, 500);

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

      router.replace(serialized ? `${pathname}?${serialized}` : pathname);
    },
    [listParams, pathname, router, searchParams],
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

  const users = useUsersListQuery(queryParams);
  const activateUsers = useBulkMutation({
    mutationFn: (userId) =>
      webFetch(`/api/bff/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE" }),
      }),
    queryKey: ["admin-users"],
    successMessage: "activated",
  });
  const blockUsers = useBulkMutation({
    mutationFn: (userId) =>
      webFetch(`/api/bff/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "BLOCKED" }),
      }),
    queryKey: ["admin-users"],
    successMessage: "blocked",
  });

  const actorRoles = session.data?.data.user.roles ?? [];
  const permissions = session.data?.data.permissions ?? [];
  const canCreate = permissions.includes("users.create");
  const canUpdate = permissions.includes("users.update");

  const pageUsers = users.data?.data ?? [];
  const total = users.data?.meta?.total ?? 0;
  const totalPages = users.data?.meta?.totalPages ?? 1;
  const currentPage = users.data?.meta?.page ?? queryParams.page;

  const handleActivate = useCallback(
    async (userId: string) => {
      setPendingAction("activate");
      try {
        await activateUsers.mutateAsync([userId]);
      } finally {
        setPendingAction(null);
      }
    },
    [activateUsers],
  );

  const handleBlock = useCallback(
    (userId: string) => {
      setConfirmBlock({ userIds: [userId], label: "this user", count: 1 });
    },
    [],
  );

  const columns = useMemo(
    () =>
      createUsersTableColumns({
        canUpdate,
        onActivate: handleActivate,
        onBlock: handleBlock,
        isDisabled: activateUsers.isPending || blockUsers.isPending,
      }),
    [canUpdate, handleActivate, handleBlock, activateUsers.isPending, blockUsers.isPending],
  );

  const sorting = useMemo(
    () => sortingStateFromParams(queryParams),
    [queryParams],
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
    const { sort: nextSort } = paramsFromSortingState(
      resolvedSorting,
      listParams,
    );

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

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);
  const hasFilters = Boolean(searchInput || queryParams.status !== "all");

  if (session.isLoading) {
    return <div className="flex min-h-64 items-center justify-center"><Spinner className="size-5" /></div>;
  }

  if (session.isError) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Alert variant="error" className="max-w-md">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" />
            Session error
          </div>
          <p className="text-sm">Could not load your session. Try refreshing the page.</p>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {showCreate ? (
        <CreateUserDrawer
          open={showCreate}
          onClose={() => setShowCreate(false)}
          actorRoles={actorRoles}
        />
      ) : null}

      {confirmBlock ? (
        <ConfirmDialog
          open
          title="Block user"
          message={`Block ${confirmBlock.label}? Their active sessions will be revoked.`}
          confirmLabel="Block"
          destructive
          loading={pendingAction === "block"}
          onCancel={() => setConfirmBlock(null)}
          onConfirm={async () => {
            setPendingAction("block");
            try {
              await blockUsers.mutateAsync(confirmBlock.userIds);
            } finally {
              setPendingAction(null);
              setConfirmBlock(null);
              if (confirmBlock.count > 1) setRowSelection({});
            }
          }}
        />
      ) : null}

      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
              <Users className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">Users</h1>
              <p className="truncate text-sm text-muted-foreground">
                {users.isLoading
                  ? "Loading…"
                  : total === 0
                    ? "No users yet"
                    : `${total} user${total > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void users.refetch()}
              disabled={users.isFetching}
            >
              <RefreshCw className={cn("size-3", users.isFetching && "animate-spin")} />
              Refresh
            </Button>
            {canCreate ? (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <UserPlus data-icon="inline-start" />
                New user
              </Button>
            ) : null}
          </div>
        </div>

        <Card>
          {users.isError ? (
            <Alert variant="error" className="m-4 mb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="size-4" />
                  Failed to load users
                </div>
                <Button variant="outline" size="sm" onClick={() => void users.refetch()}>
                  Retry
                </Button>
              </div>
            </Alert>
          ) : null}
          <ResourceToolbar
            search={searchInput}
            onSearchChange={(value) => {
              setSearchInput(value);
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
                    variant={
                      queryParams.status === tab.value ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => setStatusFilter(tab.value)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            }
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
                    disabled={activateUsers.isPending || blockUsers.isPending}
                    onClick={async () => {
                      await activateUsers.mutateAsync(selectedIds);
                      setRowSelection({});
                    }}
                  >
                    {activateUsers.isPending ? <Spinner className="size-3.5" /> : null}
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activateUsers.isPending || blockUsers.isPending}
                    onClick={() => {
                      setConfirmBlock({
                        userIds: selectedIds,
                        label: `${selectedIds.length} user${selectedIds.length > 1 ? "s" : ""}`,
                        count: selectedIds.length,
                      });
                    }}
                  >
                    {pendingAction === "block" ? <Spinner className="size-3.5" /> : null}
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
              emptyTitle={
                hasFilters ? "No users match your filters" : "No users yet"
              }
              emptyDescription={
                hasFilters
                  ? "Clear filters or adjust the search terms."
                  : "Create a user to start managing access."
              }
              onRowClick={(row) => {
                const returnTo =
                  serializeUsersListSearchParams(queryParams).toString();
                const suffix = returnTo
                  ? `?returnTo=${encodeURIComponent(`/users?${returnTo}`)}`
                  : "";
                void router.push(`/users/${row.original.id}${suffix}`);
              }}
            />
            <Pagination
              page={currentPage}
              pageSize={queryParams.limit}
              totalPages={totalPages}
              total={total}
              pageSizeOptions={USERS_PAGE_SIZE_OPTIONS}
              isLoading={users.isFetching}
              onPageChange={(page) => {
                patchListParams({ page });
                setRowSelection({});
              }}
              onPageSizeChange={(limit) => {
                patchListParams({ limit: limit as UsersPageSize, page: 1 });
                setRowSelection({});
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
