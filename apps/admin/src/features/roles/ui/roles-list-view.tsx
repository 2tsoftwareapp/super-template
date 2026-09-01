"use client";

import { Button } from "@repo/web-ui/button";
import { CommonResourcePage } from "@repo/web-ui/common-resource-page";
import { ConfirmDialog } from "@repo/web-ui/confirm-dialog";
import { Empty } from "@repo/web-ui/empty";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { ResourceFilterBar } from "@repo/web-ui/resource-filter-bar";
import { Show } from "@repo/web-ui/show";
import { Globe, LockKeyhole, Plus, RefreshCcw, ShieldCheck } from "lucide-react";

import type { RolesViewModel } from "@/features/roles/model/roles.types";

import { adminResources } from "@/features/_plugin-resources/admin-resources";
import { formatRoleName } from "@/lib/roles";

import { RoleFormDrawer } from "./role-form-drawer";
import { RoleTreeItem } from "./role-tree-item";

const rolesResource = adminResources.find((r) => r.id === "roles")!;

/**
 * Presentational roles view. Receives a fully-resolved view model (data +
 * callbacks) from the roles controller and renders it; it owns no server state,
 * session, permission-string checks, or workflow orchestration.
 */
export function RolesListView(vm: RolesViewModel) {
  const {
    canCreate,
    canUpdate,
    canDelete,
    isSuperAdmin,
    search,
    onSearchChange,
    isLoading,
    isRefreshing,
    isError,
    onRetry,
    onRefresh,
    systemRoles,
    customRoles,
    scopeFilter,
    onScopeFilterChange,
    pagination,
    anyRoles,
    noResults,
    deletingRoleId,
    isDeleting,
    onEditRole,
    onRequestDelete,
    drawer,
    confirmDelete,
    organizations,
    organizationNames,
    actorPermissions,
  } = vm;

  const hasFilters = Boolean(search) || Boolean(scopeFilter) || Boolean(vm.organizationFilter);
  const totalRolesCount = systemRoles.length + customRoles.length;

  return (
    <>
      <CommonResourcePage
        resource={rolesResource}
        description="Create and manage roles with granular permission sets."
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        statsLoading={isLoading}
        statsColumns={4}
        stats={[
          {
            label: "Total Roles",
            value: totalRolesCount,
            icon: ShieldCheck,
            description: "Platform & custom roles",
          },
          {
            label: "System Roles",
            value: systemRoles.length,
            icon: LockKeyhole,
            description: "Default platform definitions",
          },
          {
            label: "Custom Roles",
            value: customRoles.length,
            icon: ShieldCheck,
            description: "Tenant-customized roles",
          },
          {
            label: "Scopes",
            value: "Platform / Org",
            icon: Globe,
            description: "Multi-tier access coverage",
          },
        ]}
        headerActions={
          <>
            {isError ? (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCcw data-icon="inline-start" />
                Retry
              </Button>
            ) : null}
            <Show when={canCreate}>
              <Button size="sm" onClick={drawer.onCreate}>
                <Plus data-icon="inline-start" />
                New role
              </Button>
            </Show>
          </>
        }
        filterBar={
          <ResourceFilterBar
            className="border-b border-border p-4"
            search={{
              value: search,
              onChange: onSearchChange,
              placeholder: "Search roles or permissions",
            }}
            facets={[
              {
                key: "scope",
                label: "Scope",
                options: [
                  { label: "Platform", value: "platform" },
                  { label: "Organization", value: "organization" },
                ],
                selectedValues: scopeFilter ? [scopeFilter] : [],
                onChange: (values) => {
                  const next = values[values.length - 1] as "platform" | "organization" | undefined;
                  onScopeFilterChange(next);
                },
              },
              ...(isSuperAdmin && organizations.items.length > 0
                ? [
                    {
                      key: "organization",
                      label: "Organization",
                      options: organizations.items.map((org) => ({
                        label: org.name,
                        value: org.id,
                      })),
                      selectedValues: vm.organizationFilter ? [vm.organizationFilter] : [],
                      onChange: (values: string[]) => {
                        const next = values[values.length - 1];
                        vm.onOrganizationFilterChange(next);
                      },
                    },
                  ]
                : []),
            ]}
            onClearAll={
              hasFilters
                ? () => {
                    onSearchChange("");
                    onScopeFilterChange(undefined);
                    vm.onOrganizationFilterChange(undefined);
                  }
                : undefined
            }
          />
        }
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: pagination.totalPages,
          total: pagination.total,
          onPageChange: pagination.onPageChange,
        }}
      >
        <Show when={isLoading}>
          <SectionLoading />
        </Show>

        {!isLoading && isError ? (
          <ErrorState
            variant="inline"
            className="m-4"
            title="Could not load roles."
            action={{ label: "Retry", onClick: onRetry }}
          />
        ) : null}

        {!isLoading && !isError && noResults ? (
          <Empty title="No roles match your search" description="Try different keywords." />
        ) : null}

        {!isLoading && !isError && !anyRoles && !search ? (
          <Empty
            title="No roles yet"
            description="Roles are provisioned during bootstrap. Custom roles can be created below."
          />
        ) : null}

        {!isLoading && !isError && (
          <div>
            {systemRoles.length > 0 && (
              <div>
                <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
                  <LockKeyhole className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">System roles</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {systemRoles.length}
                  </span>
                </div>
                {systemRoles.map((role) => (
                  <RoleTreeItem
                    key={role.id}
                    role={role}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    isDeleting={isDeleting}
                    deletingRoleId={deletingRoleId}
                    onEdit={onEditRole}
                    onDelete={onRequestDelete}
                  />
                ))}
              </div>
            )}
            {customRoles.length > 0 && (
              <div>
                <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
                  <ShieldCheck className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Custom roles</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {customRoles.length}
                  </span>
                </div>
                {customRoles.map((role) => (
                  <RoleTreeItem
                    key={role.id}
                    role={role}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    isDeleting={isDeleting}
                    deletingRoleId={deletingRoleId}
                    {...(role.organizationId && organizationNames[role.organizationId]
                      ? { organizationName: organizationNames[role.organizationId] }
                      : {})}
                    onEdit={onEditRole}
                    onDelete={onRequestDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CommonResourcePage>

      <RoleFormDrawer
        open={drawer.open}
        onClose={drawer.onClose}
        role={drawer.editingRole}
        permissions={drawer.permissions}
        permissionsError={drawer.permissionsError}
        isSaving={drawer.isSaving}
        isSuperAdmin={isSuperAdmin}
        actorPermissions={actorPermissions}
        organizations={organizations.items}
        selectedOrganizationId={organizations.selectedId}
        onOrganizationSelect={organizations.onSelect}
        onSave={drawer.onSave}
      />

      {confirmDelete.role && (
        <ConfirmDialog
          open
          title="Delete role"
          message={
            <>
              Permanently delete{" "}
              <span className="font-medium text-foreground">
                {formatRoleName(confirmDelete.role.name)}
              </span>
              ? This cannot be undone.
            </>
          }
          confirmLabel={isDeleting ? "Deleting…" : "Confirm delete"}
          destructive
          loading={isDeleting}
          onCancel={confirmDelete.onCancel}
          onConfirm={confirmDelete.onConfirm}
        />
      )}
    </>
  );
}
