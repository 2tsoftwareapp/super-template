import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { CreateAdminUserInput, ListResponse, AdminUserDto } from "../lib/types";

const columnHelper = createColumnHelper<AdminUserDto>();
const columns = [
  columnHelper.accessor("displayName", {
    header: "Name",
    cell: (info) => (
      <Link className="font-medium text-foreground hover:underline" to={`/users/${info.row.original.id}`}>
        {info.getValue()}
      </Link>
    ),
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

const createSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  roleIds: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createSchema>;

export function UsersPage() {
  const queryClient = useQueryClient();
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => webFetch<ListResponse<AdminUserDto>>("/api/v1/admin/users?limit=50"),
  });
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      roleIds: "",
    },
  });
  const createUser = useMutation({
    mutationFn: (input: CreateAdminUserInput) =>
      webFetch<{ data: AdminUserDto }>("/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      form.reset();
    },
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
      <PageHeader
        label="Users"
        title="User management"
        description="Create accounts, inspect roles, and move between detail and status controls."
      />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create user</CardTitle>
            <CardDescription>Add an account and optionally assign roles by id.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => {
                const roleIds = values.roleIds?.trim()
                  ? values.roleIds.split(",").map((value) => value.trim()).filter(Boolean)
                  : undefined;
                void createUser.mutateAsync({
                  email: values.email,
                  password: values.password,
                  displayName: values.displayName,
                  ...(roleIds ? { roleIds } : {}),
                });
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <Input id="user-password" type="password" {...form.register("password")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-display-name">Display name</Label>
                <Input id="user-display-name" {...form.register("displayName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role-ids">Role IDs</Label>
                <Input id="user-role-ids" placeholder="role-1, role-2" {...form.register("roleIds")} />
              </div>
              <Button className="w-full" type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating..." : "Create user"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
