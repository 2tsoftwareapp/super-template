"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { ListResponse, RoleDto } from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/hooks/use-session";
import { adminResources } from "@/lib/admin-resources";
import { webFetch } from "@/lib/http";
import { formatRoleName } from "@/lib/roles";

import { type EditableRole, RoleFormDrawer } from "./role-form-drawer";

interface PermissionDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

type ManagedRoleDto = RoleDto & {
  organizationId: string | null;
  scope: "platform" | "organization";
  isSystem: boolean;
  permissions: PermissionDto[];
};

const rolesResource = adminResources.find(
  (resource) => resource.id === "roles",
)!;

function optionalText(value: string | null | undefined | object) {
  return typeof value === "string" ? value : "";
}

function permissionDomain(permissionName: string) {
  return permissionName.split(".")[0] ?? "system";
}

export function RolesView() {
  const queryClient = useQueryClient();
  const session = useSession();
  const permissions = session.data?.data.permissions ?? [];
  const canCreate = permissions.includes("roles.create");
  const canUpdate = permissions.includes("roles.update");
  const canDelete = permissions.includes("roles.delete");

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<EditableRole | null>(null);

  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () =>
      webFetch<ListResponse<ManagedRoleDto>>("/api/bff/admin/roles"),
  });

  const permissionCatalog = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: () =>
      webFetch<ListResponse<PermissionDto>>("/api/bff/admin/roles/permissions"),
  });

  const deleteRole = useMutation({
    mutationFn: (roleId: string) =>
      webFetch(`/api/bff/admin/roles/${roleId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success("Role deleted");
    },
    onError: () => {
      toast.error("Could not delete role");
    },
  });

  const allRoles = useMemo(() => roles.data?.data ?? [], [roles.data?.data]);
  const systemRoles = useMemo(
    () => allRoles.filter((role) => role.isSystem),
    [allRoles],
  );
  const customRoles = useMemo(
    () => allRoles.filter((role) => !role.isSystem),
    [allRoles],
  );

  const filteredRoles = useMemo(() => {
    if (!search) return allRoles;
    const q = search.toLowerCase();
    return allRoles.filter(
      (role) =>
        role.name.toLowerCase().includes(q) ||
        optionalText(role.description).toLowerCase().includes(q) ||
        role.permissions.some((permission) =>
          permission.name.toLowerCase().includes(q),
        ),
    );
  }, [allRoles, search]);

  const permissionGroups = useMemo(() => {
    const grouped = new Map<string, PermissionDto[]>();
    for (const permission of permissionCatalog.data?.data ?? []) {
      const domain = permissionDomain(permission.name);
      const existing = grouped.get(domain) ?? [];
      existing.push(permission);
      grouped.set(domain, existing);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissionCatalog.data?.data]);

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

  return (
    <ResourcePageShell
      resource={rolesResource}
      description="System roles are seeded from the platform matrix. Organization admins can create custom roles from the permission catalog."
      isRefreshing={roles.isFetching || permissionCatalog.isFetching}
      onRefresh={() => {
        void roles.refetch();
        void permissionCatalog.refetch();
      }}
      actions={
        canCreate ? (
          <Button size="sm" onClick={openCreateDrawer}>
            <Plus data-icon="inline-start" />
            New custom role
          </Button>
        ) : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>System roles</CardDescription>
            <CardTitle>{systemRoles.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Custom roles</CardDescription>
            <CardTitle>{customRoles.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Catalog permissions</CardDescription>
            <CardTitle>{permissionCatalog.data?.data.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <ResourceToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search roles or permissions"
          hasFilters={Boolean(search)}
          onClearFilters={() => setSearch("")}
          resultLabel={`${filteredRoles.length} of ${allRoles.length} roles`}
        />
        <CardContent className="p-0 pb-1">
          {roles.isLoading || permissionCatalog.isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner className="size-5" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <Empty
              title={
                search ? "No roles match your search" : "No roles available"
              }
              description="Roles are provisioned during bootstrap. Create a custom role to tailor organization access."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg border border-border bg-muted p-2">
                          {role.isSystem ? (
                            <LockKeyhole className="size-4 text-muted-foreground" />
                          ) : (
                            <ShieldCheck className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">
                              {formatRoleName(role.name)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {role.isSystem ? "system" : "custom"}
                            </Badge>
                          </div>
                          <p className="mt-1 max-w-xl truncate text-xs text-muted-foreground">
                            {optionalText(role.description) || "No description"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {role.scope}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-xl flex-wrap gap-1">
                        {role.permissions.map((permission) => (
                          <Badge
                            key={permission.id}
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {permission.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {!role.isSystem && (canUpdate || canDelete) ? (
                        <div className="flex justify-end gap-1">
                          {canUpdate ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              aria-label={`Edit ${role.name}`}
                              onClick={() => openEditDrawer(role)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              aria-label={`Delete ${role.name}`}
                              disabled={deleteRole.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete "${formatRoleName(role.name)}"? This cannot be undone.`,
                                  )
                                ) {
                                  deleteRole.mutate(role.id);
                                }
                              }}
                              className="hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission catalog</CardTitle>
          <CardDescription>
            Custom roles can only assign permissions from this seeded catalog.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {permissionGroups.map(([domain, items]) => (
            <div key={domain} className="space-y-2">
              <h3 className="text-sm font-medium capitalize">{domain}</h3>
              <div className="flex flex-wrap gap-1.5">
                {items.map((permission) => (
                  <Badge
                    key={permission.id}
                    variant="outline"
                    className="font-mono text-xs"
                  >
                    {permission.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <RoleFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={editingRole}
        permissions={permissionCatalog.data?.data ?? []}
      />
    </ResourcePageShell>
  );
}
