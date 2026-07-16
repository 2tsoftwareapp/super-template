"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent } from "@repo/web-ui/card";
import { ConfirmDialog } from "@repo/web-ui/confirm-dialog";
import { Empty, EmptyMedia } from "@repo/web-ui/empty";
import { Input } from "@repo/web-ui/input";
import { SectionLoading } from "@repo/web-ui/loading";
import { Show } from "@repo/web-ui/show";
import { AlertTriangle, LockKeyhole, Plus, RefreshCcw, Search, ShieldCheck, X } from "lucide-react";

import type { RolesViewModel } from "@/features/roles/controllers/use-roles-controller";

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
    hasError,
    onRefresh,
    systemRoles,
    customRoles,
    anyRoles,
    noResults,
    deletingRoleId,
    isDeleting,
    onEditRole,
    onRequestDelete,
    drawer,
    confirmDelete,
    organizations,
  } = vm;

  return (
    <ResourcePageShell
      resource={rolesResource}
      description="Create and manage roles with granular permission sets."
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      actions={
        <>
          {hasError ? (
            <Button size="sm" variant="outline" onClick={onRefresh}>
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
            {search && (
              <Button variant="ghost" size="sm" onClick={() => onSearchChange("")}>
                <X className="size-4" />
              </Button>
            )}
          </div>

          <Show when={isLoading}>
            <SectionLoading />
          </Show>

          {!isLoading && hasError ? (
            <Empty
              title="Failed to load roles"
              description="There was an error fetching roles and permissions. Try refreshing."
            >
              <EmptyMedia>
                <AlertTriangle className="size-4" />
              </EmptyMedia>
            </Empty>
          ) : null}

          {!isLoading && !hasError && noResults ? (
            <Empty
              title="No roles match your search"
              description="Try different keywords."
            />
          ) : null}

          {!isLoading && !hasError && !anyRoles && !search ? (
            <Empty
              title="No roles yet"
              description="Roles are provisioned during bootstrap. Custom roles can be created below."
            />
          ) : null}

          {!isLoading && !hasError && (
            <div>
              {systemRoles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
                    <LockKeyhole className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      System roles
                    </span>
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
                    <span className="text-xs font-medium text-muted-foreground">
                      Custom roles
                    </span>
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
                      onEdit={onEditRole}
                      onDelete={onRequestDelete}
                    />
                  ))}
                </div>
              )}
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
        isSuperAdmin={isSuperAdmin}
        organizations={organizations.items}
        selectedOrganizationId={organizations.selectedId}
        onOrganizationSelect={organizations.onSelect}
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
