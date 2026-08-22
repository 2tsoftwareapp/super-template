"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent } from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { Pagination } from "@repo/web-ui/pagination";
import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";
import { UserPlus } from "lucide-react";

import type { UsersListViewModel } from "@/features/users/model/users.types";

import { BulkActionBar } from "@/components/bulk-action-bar";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceTable } from "@/components/resource-table";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { STATUS_FILTERS } from "@/features/users/model/constants";
import { USERS_PAGE_SIZE_OPTIONS } from "@/features/users/model/users.types";
import { adminResources } from "@/lib/admin-resources";

import { CreateUserDrawer } from "./create-user-drawer";
import { UsersConfirmBlockDialog } from "./users-confirm-block-dialog";

const usersResource = adminResources.find((r) => r.id === "users")!;

/**
 * Presentational users list view. Receives a fully-resolved view model
 * (data + callbacks) from the users list controller and renders it; it owns no
 * server state, URL state, permission checks, or workflow orchestration.
 */
export function UsersListView({
  header,
  list,
  toolbar,
  bulk,
  pagination,
  createDrawer,
  confirmBlock,
  table,
}: UsersListViewModel) {
  return (
    <>
      <Show when={createDrawer.open}>
        <CreateUserDrawer
          open={createDrawer.open}
          onClose={createDrawer.onClose}
          actorRoles={createDrawer.actorRoles}
          actorOrganizationId={createDrawer.actorOrganizationId}
          assignableRoles={createDrawer.assignableRoles}
          organizations={createDrawer.organizations}
          isOrganizationsLoading={createDrawer.isOrganizationsLoading}
          isSaving={createDrawer.isSaving}
          onSubmit={createDrawer.onSubmit}
        />
      </Show>

      {confirmBlock.state ? (
        <UsersConfirmBlockDialog
          open
          label={confirmBlock.state.label}
          isLoading={confirmBlock.isLoading}
          onCancel={confirmBlock.onCancel}
          onConfirm={confirmBlock.onConfirm}
        />
      ) : null}

      <ResourcePageShell
        resource={usersResource}
        description={
          header.isLoading
            ? "Loading…"
            : header.total === 0
              ? "No users yet"
              : `${header.total} user${header.total > 1 ? "s" : ""}`
        }
        isRefreshing={header.isFetching}
        onRefresh={header.onRefresh}
        actions={
          header.canCreate ? (
            <Button size="sm" onClick={header.onCreateClick}>
              <UserPlus data-icon="inline-start" />
              New user
            </Button>
          ) : null
        }
      >
        <Card>
          <Show when={list.isError}>
            <ErrorState
              variant="inline"
              title="Could not load users."
              action={{ label: "Retry", onClick: list.onRetry }}
            />
          </Show>
          <ResourceToolbar
            search={toolbar.search}
            onSearchChange={toolbar.onSearchChange}
            searchPlaceholder="Search name or email"
            hasFilters={list.hasFilters}
            onClearFilters={toolbar.onClearFilters}
            filters={
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
                {STATUS_FILTERS.map((tab) => (
                  <Button
                    key={tab.value}
                    type="button"
                    variant={toolbar.currentStatus === tab.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => toolbar.onStatusFilter(tab.value)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            }
          />
          <BulkActionBar
            selectedCount={bulk.selectedIds.length}
            onClear={bulk.onClearSelection}
            actions={
              <Show when={bulk.canUpdate}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulk.isMutating}
                  onClick={bulk.onBulkActivate}
                >
                  <Show when={bulk.isActivating}>
                    <Spinner className="size-3.5" />
                  </Show>
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulk.isMutating}
                  onClick={bulk.onBulkBlock}
                >
                  <Show when={bulk.isBlocking}>
                    <Spinner className="size-3.5" />
                  </Show>
                  Block
                </Button>
              </Show>
            }
          />
          <CardContent className="p-0 pb-1">
            <ResourceTable
              table={table}
              binarySort
              multiSort
              isLoading={list.isLoading}
              emptyTitle={list.emptyTitle}
              emptyDescription={list.emptyDescription}
              onRowClick={(row) => list.onRowClick(row.original.id)}
            />
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSizeOptions={USERS_PAGE_SIZE_OPTIONS}
              isLoading={pagination.isFetching}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
            />
          </CardContent>
        </Card>
      </ResourcePageShell>
    </>
  );
}
