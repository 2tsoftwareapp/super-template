import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, LockKeyhole, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminResources } from "@/lib/admin-resources";
import { webFetch } from "@/lib/http";
import { formatRoleName } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

import type { ListResponse, RoleDto } from "../lib/types";

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

interface RoleFormState {
  name: string;
  description: string;
  permissionIds: string[];
}

const rolesResource = adminResources.find((resource) => resource.id === "roles")!;

function permissionDomain(permissionName: string) {
  return permissionName.split(".")[0] ?? "system";
}

function optionalText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function createEmptyForm(): RoleFormState {
  return {
    name: "",
    description: "",
    permissionIds: [],
  };
}

function RoleEditorDrawer({
  open,
  mode,
  role,
  permissions,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  role: ManagedRoleDto | null;
  permissions: PermissionDto[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RoleFormState>(() =>
    role
      ? {
          name: role.name,
          description: optionalText(role.description),
          permissionIds: role.permissions.map((permission) => permission.id),
        }
      : createEmptyForm(),
  );

  const groupedPermissions = useMemo(() => {
    const grouped = new Map<string, PermissionDto[]>();
    for (const permission of permissions) {
      const domain = permissionDomain(permission.name);
      grouped.set(domain, [...(grouped.get(domain) ?? []), permission]);
    }
    return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [permissions]);

  const saveRole = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        description: form.description || null,
        permissionIds: form.permissionIds,
      };

      if (mode === "create") {
        return webFetch<{ data: ManagedRoleDto }>("/api/v1/admin/roles", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      return webFetch<{ data: ManagedRoleDto }>(`/api/v1/admin/roles/${role?.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success(mode === "create" ? "Role created" : "Role updated");
      onClose();
    },
  });

  const togglePermission = (permissionId: string) => {
    setForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((id) => id !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  };

  const disabled = mode === "edit" && Boolean(role?.isSystem);

  return (
    <ResourceDrawer
      open={open}
      title={mode === "create" ? "New role" : `Edit ${formatRoleName(role?.name ?? "role")}`}
      description={
        disabled
          ? "System roles are seeded during initialization and cannot be changed in the UI."
          : "Define a custom role and choose the permissions it grants in this organization."
      }
      onClose={onClose}
      footer={
        <Button
          type="submit"
          form="role-editor-form"
          className="w-full"
          disabled={disabled || saveRole.isPending || !form.name || form.permissionIds.length === 0}
        >
          {saveRole.isPending ? <Spinner data-icon="inline-start" /> : null}
          {mode === "create" ? "Create role" : "Save role"}
        </Button>
      }
    >
      <form
        id="role-editor-form"
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void saveRole.mutateAsync();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-name">Role name</Label>
          <Input
            id="role-name"
            value={form.name}
            disabled={disabled}
            placeholder="OPERATIONS_MANAGER"
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-description">Description</Label>
          <Input
            id="role-description"
            value={form.description}
            disabled={disabled}
            placeholder="Can manage operational resources"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-medium">Permissions</h3>
            <p className="text-xs text-muted-foreground">
              {form.permissionIds.length} selected from {permissions.length} available permissions.
            </p>
          </div>

          {groupedPermissions.map(([domain, items]) => (
            <div key={domain} className="rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-sm font-medium capitalize">{domain}</span>
                <Badge variant="secondary" className="text-xs">
                  {items.length}
                </Badge>
              </div>
              <div className="grid gap-1 p-2">
                {items.map((permission) => (
                  <label
                    key={permission.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/60",
                      disabled && "cursor-not-allowed opacity-70",
                    )}
                  >
                    <Checkbox
                      checked={form.permissionIds.includes(permission.id)}
                      disabled={disabled}
                      onChange={() => togglePermission(permission.id)}
                    />
                    <span className="min-w-0">
                      <span className="block font-mono text-xs">{permission.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {permission.description ?? "No description"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {saveRole.isError ? (
          <p className="text-sm text-destructive">
            Role could not be saved. Check permissions and uniqueness.
          </p>
        ) : null}
      </form>
    </ResourceDrawer>
  );
}

function PermissionEditorDrawer({
  open,
  permission,
  onClose,
}: {
  open: boolean;
  permission: PermissionDto | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(permission?.name ?? "");
  const [description, setDescription] = useState(optionalText(permission?.description));
  const mode = permission ? "edit" : "create";
  const disabled = Boolean(permission?.isSystem);

  const savePermission = useMutation({
    mutationFn: () => {
      const body = { name, description: description || null };
      if (mode === "create") {
        return webFetch<{ data: PermissionDto }>("/api/v1/admin/roles/permissions", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      return webFetch<{ data: PermissionDto }>(
        `/api/v1/admin/roles/permissions/${permission?.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-roles"] }),
      ]);
      toast.success(mode === "create" ? "Permission created" : "Permission updated");
      onClose();
    },
  });

  return (
    <ResourceDrawer
      open={open}
      title={mode === "create" ? "New permission" : "Edit permission"}
      description={
        disabled
          ? "System permissions are code-backed and cannot be edited."
          : "Create custom permission labels that can be attached to dynamic roles."
      }
      onClose={onClose}
      footer={
        <Button
          type="submit"
          form="permission-editor-form"
          className="w-full"
          disabled={disabled || savePermission.isPending || !name}
        >
          {savePermission.isPending ? <Spinner data-icon="inline-start" /> : null}
          {mode === "create" ? "Create permission" : "Save permission"}
        </Button>
      }
    >
      <form
        id="permission-editor-form"
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void savePermission.mutateAsync();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="permission-name">Permission name</Label>
          <Input
            id="permission-name"
            value={name}
            disabled={disabled}
            placeholder="billing.invoices.approve"
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="permission-description">Description</Label>
          <Input
            id="permission-description"
            value={description}
            disabled={disabled}
            placeholder="Approve billing invoices"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        {savePermission.isError ? (
          <p className="text-sm text-destructive">
            Permission could not be saved. Check uniqueness and access.
          </p>
        ) : null}
      </form>
    </ResourceDrawer>
  );
}

export function RolesPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const [search, setSearch] = useState("");
  const [editingRole, setEditingRole] = useState<ManagedRoleDto | null>(null);
  const [editingPermission, setEditingPermission] = useState<PermissionDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [creatingPermission, setCreatingPermission] = useState(false);
  const canManage = session.data?.data.permissions.includes("roles.manage") ?? false;

  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => webFetch<ListResponse<ManagedRoleDto>>("/api/v1/admin/roles"),
  });

  const permissions = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: () =>
      webFetch<ListResponse<PermissionDto>>("/api/v1/admin/roles/permissions"),
  });

  const deleteRole = useMutation({
    mutationFn: (roleId: string) =>
      webFetch<{ data: { success: boolean } }>(`/api/v1/admin/roles/${roleId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success("Role deleted");
    },
  });
  const deletePermission = useMutation({
    mutationFn: (permissionId: string) =>
      webFetch<{ data: { success: boolean } }>(
        `/api/v1/admin/roles/permissions/${permissionId}`,
        { method: "DELETE" },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-permissions"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-roles"] }),
      ]);
      toast.success("Permission deleted");
    },
  });

  const allRoles = useMemo(() => roles.data?.data ?? [], [roles.data?.data]);
  const filteredRoles = useMemo(() => {
    if (!search) return allRoles;
    const q = search.toLowerCase();
    return allRoles.filter(
      (role) =>
        role.name.toLowerCase().includes(q) ||
        optionalText(role.description).toLowerCase().includes(q) ||
        role.permissions.some((permission) => permission.name.toLowerCase().includes(q)),
    );
  }, [allRoles, search]);

  const stats = useMemo(
    () => ({
      total: allRoles.length,
      system: allRoles.filter((role) => role.isSystem).length,
      custom: allRoles.filter((role) => !role.isSystem).length,
      permissions: permissions.data?.data.length ?? 0,
    }),
    [allRoles, permissions.data?.data.length],
  );

  return (
    <>
      {creating ? (
        <RoleEditorDrawer
          key="create-role"
          open
          mode="create"
          role={null}
          permissions={permissions.data?.data ?? []}
          onClose={() => setCreating(false)}
        />
      ) : null}
      {editingRole ? (
        <RoleEditorDrawer
          key={editingRole.id}
          open
          mode="edit"
          role={editingRole}
          permissions={permissions.data?.data ?? []}
          onClose={() => setEditingRole(null)}
        />
      ) : null}
      {creatingPermission ? (
        <PermissionEditorDrawer
          key="create-permission"
          open
          permission={null}
          onClose={() => setCreatingPermission(false)}
        />
      ) : null}
      {editingPermission ? (
        <PermissionEditorDrawer
          key={editingPermission.id}
          open
          permission={editingPermission}
          onClose={() => setEditingPermission(null)}
        />
      ) : null}

      <ResourcePageShell
        resource={rolesResource}
        description="Manage dynamic roles and permission bundles. Platform roles are initialized by the system and locked."
        isRefreshing={roles.isFetching || permissions.isFetching}
        onRefresh={() => {
          void roles.refetch();
          void permissions.refetch();
        }}
        actions={
          canManage ? (
            <Button onClick={() => setCreating(true)}>
              <Plus data-icon="inline-start" />
              New role
            </Button>
          ) : null
        }
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total roles</CardDescription>
              <CardTitle>{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>System locked</CardDescription>
              <CardTitle>{stats.system}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Custom roles</CardDescription>
              <CardTitle>{stats.custom}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Permissions</CardDescription>
              <CardTitle>{stats.permissions}</CardTitle>
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
            {roles.isLoading || permissions.isLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <Spinner className="size-5" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <Empty
                title={search ? "No roles match your search" : "No roles defined"}
                description={
                  search
                    ? "Clear search to return to the role catalog."
                    : "Create a custom role to start managing permissions."
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="w-[160px] text-right">Actions</TableHead>
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
                              <span className="font-medium">{formatRoleName(role.name)}</span>
                              {role.isSystem ? (
                                <Badge variant="secondary" className="text-xs">
                                  system
                                </Badge>
                              ) : null}
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
                          {role.permissions.slice(0, 6).map((permission) => (
                            <Badge key={permission.id} variant="secondary" className="font-mono text-xs">
                              {permission.name}
                            </Badge>
                          ))}
                          {role.permissions.length > 6 ? (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 6}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRole(role)}
                          >
                            <Edit3 data-icon="inline-start" />
                            Edit
                          </Button>
                          {canManage && !role.isSystem ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={deleteRole.isPending}
                              onClick={() => {
                                void deleteRole.mutateAsync(role.id);
                              }}
                            >
                              <Trash2 data-icon="inline-start" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Permission catalog</CardTitle>
              <CardDescription>
                System permissions are code-backed. Custom permissions can be attached to dynamic roles.
              </CardDescription>
            </div>
            {canManage ? (
              <Button variant="outline" onClick={() => setCreatingPermission(true)}>
                <Plus data-icon="inline-start" />
                New permission
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(permissions.data?.data ?? []).map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-mono text-xs">{permission.name}</TableCell>
                    <TableCell>
                      <Badge variant={permission.isSystem ? "secondary" : "outline"}>
                        {permission.isSystem ? "system" : "custom"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                      {optionalText(permission.description) || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPermission(permission)}
                        >
                          <Edit3 data-icon="inline-start" />
                          Edit
                        </Button>
                        {canManage && !permission.isSystem ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={deletePermission.isPending}
                            onClick={() => {
                              void deletePermission.mutateAsync(permission.id);
                            }}
                          >
                            <Trash2 data-icon="inline-start" />
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </ResourcePageShell>
    </>
  );
}
