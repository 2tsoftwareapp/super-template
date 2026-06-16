import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
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
        <CardHeader>
          <CardTitle className="text-xl">Available roles</CardTitle>
          <CardDescription>These roles can be assigned to users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(roles.data?.data ?? []).map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
