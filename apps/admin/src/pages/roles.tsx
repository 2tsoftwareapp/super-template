import { useQuery } from "@tanstack/react-query";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminResources } from "@/lib/admin-resources";
import { webFetch } from "@/lib/http";
import { formatRoleName } from "@/lib/roles";

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

const rolesResource = adminResources.find((resource) => resource.id === "roles")!;

function optionalText(value: string | null | undefined | object) {
  return typeof value === "string" ? value : "";
}

function permissionDomain(permissionName: string) {
  return permissionName.split(".")[0] ?? "system";
}

export function RolesPage() {
  const [search, setSearch] = useState("");

  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => webFetch<ListResponse<ManagedRoleDto>>("/api/v1/admin/roles"),
  });

  const permissions = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: () =>
      webFetch<ListResponse<PermissionDto>>("/api/v1/admin/roles/permissions"),
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

  const permissionGroups = useMemo(() => {
    const grouped = new Map<string, PermissionDto[]>();
    for (const permission of permissions.data?.data ?? []) {
      const domain = permissionDomain(permission.name);
      const existing = grouped.get(domain) ?? [];
      existing.push(permission);
      grouped.set(domain, existing);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions.data?.data]);

  return (
    <ResourcePageShell
      resource={rolesResource}
      description="Read-only catalog of the three fixed platform roles and their CRUD permissions."
      isRefreshing={roles.isFetching || permissions.isFetching}
      onRefresh={() => {
        void roles.refetch();
        void permissions.refetch();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fixed roles</CardDescription>
            <CardTitle>{allRoles.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>System permissions</CardDescription>
            <CardTitle>{permissions.data?.data.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Permission domains</CardDescription>
            <CardTitle>{permissionGroups.length}</CardTitle>
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
              title={search ? "No roles match your search" : "No roles available"}
              description="Roles are provisioned automatically during platform bootstrap."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Permissions</TableHead>
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
                            <Badge variant="secondary" className="text-xs">
                              fixed
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
                          <Badge key={permission.id} variant="secondary" className="font-mono text-xs">
                            {permission.name}
                          </Badge>
                        ))}
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
        <CardHeader>
          <CardTitle className="text-base">Permission catalog</CardTitle>
          <CardDescription>
            CRUD permissions are code-backed and cannot be edited at runtime.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {permissionGroups.map(([domain, items]) => (
            <div key={domain} className="space-y-2">
              <h3 className="text-sm font-medium capitalize">{domain}</h3>
              <div className="flex flex-wrap gap-1.5">
                {items.map((permission) => (
                  <Badge key={permission.id} variant="outline" className="font-mono text-xs">
                    {permission.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </ResourcePageShell>
  );
}
