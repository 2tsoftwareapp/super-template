"use client";

import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
} from "@repo/web-core/components/card";
import { ConfirmDialog } from "@repo/web-core/components/confirm-dialog";
import { Empty } from "@repo/web-core/components/empty";
import { Input } from "@repo/web-core/components/input";
import { SectionLoading } from "@repo/web-core/components/loading";
import { Show } from "@repo/web-core/components/show";
import {
  ChevronDown,
  ChevronRight,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ResourcePageShell } from "@/components/resource-page-shell";
import {
  type EditableRole,
  type ManagedRoleDto,
} from "@/features/roles/roles-schemas";
import { useDeleteRoleMutation } from "@/features/roles/use-roles-mutations";
import {
  usePermissionCatalogQuery,
  useRolesQuery,
} from "@/features/roles/use-roles-queries";
import { useSession } from "@/hooks/use-session";
import { adminResources } from "@/lib/admin-resources";
import { formatRoleName } from "@/lib/roles";
import { cn } from "@/lib/utils";

import { RoleFormDrawer } from "./role-form-drawer";

const rolesResource = adminResources.find((r) => r.id === "roles")!;

function optionalText(value: string | null | undefined | object) {
  return typeof value === "string" ? value : "";
}

/** Merge same-named roles (e.g. ADMIN platform + ADMIN org) into one node. */
function mergeRoles(roles: ManagedRoleDto[]): (ManagedRoleDto & { scopes: string[] })[] {
  const map = new Map<string, ManagedRoleDto & { scopes: string[] }>();
  for (const r of roles) {
    const key = r.name;
    const existing = map.get(key);
    if (existing) {
      if (!existing.scopes.includes(r.scope)) existing.scopes.push(r.scope);
      if (r.permissions.length > existing.permissions.length) existing.permissions = r.permissions;
    } else {
      map.set(key, { ...r, scopes: [r.scope] });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function RoleTreeItem({
  role,
  canUpdate,
  canDelete,
  deleteRole,
  deletingRoleId,
  onEdit,
  onDelete,
}: {
  role: ManagedRoleDto & { scopes: string[] };
  canUpdate: boolean;
  canDelete: boolean;
  deleteRole: { isPending: boolean };
  deletingRoleId: string | null;
  onEdit: (role: ManagedRoleDto) => void;
  onDelete: (role: ManagedRoleDto) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isEditable = !role.isSystem && (canUpdate || canDelete);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
        )}
      >
        <div className="shrink-0 rounded-lg border border-border bg-muted p-1.5">
          {role.isSystem ? (
            <LockKeyhole className="size-3.5 text-muted-foreground" />
          ) : (
            <ShieldCheck className="size-3.5 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium">
            {formatRoleName(role.name)}
          </span>
          {role.scopes.map((s) => (
            <Badge key={s} variant="outline" className="shrink-0 text-[10px] capitalize">
              {s}
            </Badge>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isEditable && (
            <span
              className="flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {canUpdate && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${role.name}`}
                  onClick={() => onEdit(role)}
                  className="size-7"
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
              {canDelete && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${role.name}`}
                  disabled={deleteRole.isPending}
                  onClick={() => onDelete(role)}
                  className={cn(
                    "size-7 hover:text-destructive",
                    deletingRoleId === role.id && "text-destructive",
                  )}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="space-y-2 px-4 pb-3 pt-0">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {optionalText(role.description) || "No description"}
          </p>
          {role.permissions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {role.permissions.map((p) => (
                <Badge key={p.id} variant="secondary" className="font-mono text-[10px]">
                  {p.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RolesView() {
  const session = useSession();
  const permissions = session.data?.data.permissions ?? [];
  const canCreate = permissions.includes("roles.create");
  const canUpdate = permissions.includes("roles.update");
  const canDelete = permissions.includes("roles.delete");

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<EditableRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<ManagedRoleDto | null>(null);

  const roles = useRolesQuery();
  const permissionCatalog = usePermissionCatalogQuery();

  const { systemRoles, customRoles } = useMemo(() => {
    const all = roles.data?.data ?? [];
    return {
      systemRoles: mergeRoles(all.filter((r) => r.isSystem)),
      customRoles: mergeRoles(all.filter((r) => !r.isSystem)),
    };
  }, [roles.data?.data]);

  const filteredSystem = useMemo(() => {
    if (!search) return systemRoles;
    const q = search.toLowerCase();
    return systemRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        optionalText(r.description).toLowerCase().includes(q) ||
        r.permissions.some((p) => p.name.toLowerCase().includes(q)),
    );
  }, [systemRoles, search]);

  const filteredCustom = useMemo(() => {
    if (!search) return customRoles;
    const q = search.toLowerCase();
    return customRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        optionalText(r.description).toLowerCase().includes(q) ||
        r.permissions.some((p) => p.name.toLowerCase().includes(q)),
    );
  }, [customRoles, search]);

  const deleteRole = useDeleteRoleMutation();

  const handleDeleteConfirm = async () => {
    if (!deletingRole) return;
    try {
      await deleteRole.mutateAsync(deletingRole.id);
    } finally {
      setDeletingRole(null);
    }
  };

  const openCreateDrawer = () => {
    setEditingRole(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (role: ManagedRoleDto) => {
    setEditingRole({
      id: role.id,
      name: role.name,
      description: optionalText(role.description) || null,
      permissions: role.permissions,
    });
    setDrawerOpen(true);
  };

  const isLoading = roles.isLoading;
  const anyRoles = systemRoles.length > 0 || customRoles.length > 0;
  const noResults = search && filteredSystem.length === 0 && filteredCustom.length === 0;

  return (
    <ResourcePageShell
      resource={rolesResource}
      description="Create and manage roles with granular permission sets."
      isRefreshing={roles.isFetching || permissionCatalog.isFetching}
      onRefresh={() => {
        void roles.refetch();
        void permissionCatalog.refetch();
      }}
      actions={
        <Show when={canCreate}>
          <Button size="sm" onClick={openCreateDrawer}>
            <Plus data-icon="inline-start" />
            New role
          </Button>
        </Show>
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
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {search && (
              <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
                <X className="size-4" />
              </Button>
            )}
          </div>

          <Show when={isLoading}>
            <SectionLoading />
          </Show>
          {!isLoading && noResults ? (
            <Empty
              title="No roles match your search"
              description="Try different keywords."
            />
          ) : !isLoading && !anyRoles && !search ? (
            <Empty
              title="No roles yet"
              description="Roles are provisioned during bootstrap. Custom roles can be created below."
            />
          ) : (
            <div>
              {filteredSystem.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
                    <LockKeyhole className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      System roles
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {filteredSystem.length}
                    </span>
                  </div>
                  {filteredSystem.map((role) => (
                    <RoleTreeItem
                      key={role.id}
                      role={role}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      deleteRole={deleteRole}
                      deletingRoleId={deletingRole?.id ?? null}
                      onEdit={openEditDrawer}
                      onDelete={setDeletingRole}
                    />
                  ))}
                </div>
              )}
              {filteredCustom.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
                    <ShieldCheck className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Custom roles
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {filteredCustom.length}
                    </span>
                  </div>
                  {filteredCustom.map((role) => (
                    <RoleTreeItem
                      key={role.id}
                      role={role}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      deleteRole={deleteRole}
                      deletingRoleId={deletingRole?.id ?? null}
                      onEdit={openEditDrawer}
                      onDelete={setDeletingRole}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <RoleFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={editingRole}
        permissions={permissionCatalog.data?.data ?? []}
      />

      {deletingRole && (
        <ConfirmDialog
          open
          title="Delete role"
          message={
            <>
              Permanently delete <span className="font-medium text-foreground">{formatRoleName(deletingRole.name)}</span>? This cannot be undone.
            </>
          }
          confirmLabel={deleteRole.isPending ? "Deleting…" : "Confirm delete"}
          destructive
          loading={deleteRole.isPending}
          onCancel={() => setDeletingRole(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </ResourcePageShell>
  );
}
