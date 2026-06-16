import { useQuery } from "@tanstack/react-query";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Spinner } from "../components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { ListResponse, RoleDto } from "../lib/types";

export function RolesPage() {
  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => webFetch<ListResponse<RoleDto>>("/api/v1/admin/roles"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Roles"
        title="Role catalog"
        description="Reference the current permission groups exposed by the API."
      />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Available roles</CardTitle>
          <CardDescription className="text-xs">
            {roles.data
              ? `${roles.data.data.length} roles defined`
              : "These roles can be assigned to users."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pb-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-16 text-center">
                    <Spinner className="mx-auto size-5" />
                  </TableCell>
                </TableRow>
              ) : (roles.data?.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-16 text-center text-sm text-muted-foreground">
                    No roles defined.
                  </TableCell>
                </TableRow>
              ) : (
                (roles.data?.data ?? []).map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs capitalize">
                        {role.name}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="max-w-[400px] truncate text-sm text-muted-foreground"
                      title={role.description ?? ""}
                    >
                      {role.description ?? <span className="italic">No description</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
