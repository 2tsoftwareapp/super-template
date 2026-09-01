"use client";

import { Button } from "@repo/web-ui/button";
import { CommonResourcePage } from "@repo/web-ui/common-resource-page";
import { ResourceDataTable } from "@repo/web-ui/resource-data-table";
import { ResourceFilterBar } from "@repo/web-ui/resource-filter-bar";
import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";
import { ShieldAlert, ShieldCheck, UserCheck, UserPlus, Users } from "lucide-react";

import type { UsersListViewModel, UserStatusFilter } from "@/features/users/model/users.types";

import { adminResources } from "@/features/_plugin-resources/admin-resources";
import { STATUS_FILTERS } from "@/features/users/model/constants";
import { USERS_PAGE_SIZE_OPTIONS } from "@/features/users/model/users.types";

import { CreateUserDrawer } from "./create-user-drawer";
import { UsersConfirmBlockDialog } from "./users-confirm-block-dialog";

const usersResource = adminResources.find((r) => r.id === "users")!;

const statusFacetOptions = STATUS_FILTERS.filter((tab) => tab.value !== "all").map((tab) => ({
  label: tab.label,
  value: tab.value,
}));

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
  const rows = table.getRowModel().rows;
  const activeCount = rows.filter((r) => r.original.status === "ACTIVE").length;
  const blockedCount = rows.filter((r) => r.original.status === "BLOCKED").length;
  const privilegedCount = rows.filter((r) =>
    r.original.roles?.some((role) => role === "SUPER_ADMIN" || role === "ADMIN"),
  ).length;

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

      <CommonResourcePage
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
        statsLoading={header.isLoading}
        statsColumns={4}
        stats={[
          {
            label: "Total Users",
            value: header.total,
            icon: Users,
            description: "Registered identity accounts",
          },
          {
            label: "Active Accounts",
            value: activeCount,
            icon: UserCheck,
            description: "Currently active on page",
          },
          {
            label: "Blocked / Suspended",
            value: blockedCount,
            icon: ShieldAlert,
            description: "Access disabled on page",
          },
          {
            label: "Privileged Users",
            value: privilegedCount,
            icon: ShieldCheck,
            description: "Admin & Super Admin accounts",
          },
        ]}
        headerActions={
          header.canCreate ? (
            <Button size="sm" onClick={header.onCreateClick}>
              <UserPlus data-icon="inline-start" />
              New user
            </Button>
          ) : null
        }
        filterBar={
          <ResourceFilterBar
            className="border-b border-border p-4"
            search={{
              value: toolbar.search,
              onChange: toolbar.onSearchChange,
              placeholder: "Search name or email",
            }}
            facets={[
              {
                key: "status",
                label: "Status",
                options: statusFacetOptions,
                selectedValues: toolbar.currentStatus !== "all" ? [toolbar.currentStatus] : [],
                onChange: (values) => {
                  const next = values[values.length - 1] as UserStatusFilter | undefined;
                  toolbar.onStatusFilter(next ?? "all");
                },
              },
            ]}
            onClearAll={list.hasFilters ? toolbar.onClearFilters : undefined}
          />
        }
        bulkActions={
          bulk.selectedIds.length > 0
            ? {
                selectedCount: bulk.selectedIds.length,
                onClear: bulk.onClearSelection,
                actions: (
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
                ),
              }
            : undefined
        }
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: pagination.totalPages,
          total: pagination.total,
          pageSizeOptions: USERS_PAGE_SIZE_OPTIONS,
          isLoading: pagination.isFetching,
          onPageChange: pagination.onPageChange,
          onPageSizeChange: pagination.onPageSizeChange,
        }}
      >
        <ResourceDataTable
          table={table}
          isLoading={list.isLoading}
          error={
            list.isError
              ? {
                  title: "Could not load users.",
                  onRetry: list.onRetry,
                }
              : undefined
          }
          empty={{
            title: list.emptyTitle,
            description: list.emptyDescription,
          }}
          onRowClick={(row) => list.onRowClick(row.id)}
          enableDensityToggle
          enableColumnVisibility
        />
      </CommonResourcePage>
    </>
  );
}
