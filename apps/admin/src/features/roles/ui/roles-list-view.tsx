"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent } from "@repo/web-ui/card";
import { ConfirmDialog } from "@repo/web-ui/confirm-dialog";
import { Empty } from "@repo/web-ui/empty";
import { ErrorState } from "@repo/web-ui/error-state";
import { Input } from "@repo/web-ui/input";
import { SectionLoading } from "@repo/web-ui/loading";
import { Pagination } from "@repo/web-ui/pagination";
import { Show } from "@repo/web-ui/show";
import { LockKeyhole, Plus, RefreshCcw, Search, ShieldCheck, X } from "lucide-react";

import type { RolesViewModel } from "@/features/roles/model/roles.types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/lib/admin-resources";
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

  return (
    <ResourcePageShell
      resource={rolesResource}
      description="Create and manage roles with granular permission sets."
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      actions={
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
    >
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search roles or permissions"
                className="h-9 pl-9 text-sm"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={scopeFilter ?? ""}
              onChange={(e) =>
                onScopeFilterChange((e.target.value as "platform" | "organization") || undefined)
              }
            >
              <option value="">All scopes</option>
              <option value="platform">Platform</option>
              <option value="organization">Organization</option>
            </select>
            {isSuperAdmin && (
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm max-w-[200px]"
                value={vm.organizationFilter ?? ""}
                onChange={(e) => vm.onOrganizationFilterChange(e.target.value || undefined)}
              >
                <option value="">All organizations</option>
                {organizations.items.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            )}
            {search && (
              <Button variant="ghost" size="sm" onClick={() => onSearchChange("")}>
                <X className="size-4" />
              </Button>
            )}
          </div>

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
              <Pagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={pagination.onPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

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
    </ResourcePageShell>
  );
}
