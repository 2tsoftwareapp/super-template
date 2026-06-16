import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { webFetch } from "../lib/http";
import type { ListResponse, UserRow } from "../lib/types";

const columnHelper = createColumnHelper<UserRow>();
const columns = [
  columnHelper.accessor("displayName", {
    header: "Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("roles", {
    header: "Roles",
    cell: (info) => info.getValue().join(", "),
  }),
];

export function UsersPage() {
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => webFetch<ListResponse<UserRow>>("/api/bff/admin/users?limit=50"),
  });

  // TanStack Table intentionally returns functions; keep the hook local here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: users.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Users
        </Badge>
        <h1 className="text-4xl font-semibold">User management</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Separate admin tooling for accounts and role inspection.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Users</CardTitle>
          <CardDescription>Table powered by TanStack Table.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : String(header.column.columnDef.header)}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{String(cell.getValue())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
