import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { BulkActionBar } from "@/components/bulk-action-bar";
import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceTable } from "@/components/resource-table";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { adminResources } from "@/lib/admin-resources";
import { statusProps, timeAgo } from "@/lib/format";
import { webFetch } from "@/lib/http";
import { formatRoleName, getAssignableRoles } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

import type {
  AdminUserDto,
  CreateAdminUserInput,
  ListResponse,
  RoleDto,
  UpdateUserStatusInput,
} from "../lib/types";

const usersResource = adminResources.find((resource) => resource.id === "users")!;
const columnHelper = createColumnHelper<AdminUserDto>();

const createSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
});

type CreateForm = z.infer<typeof createSchema>;

function CreateUserDrawer({
  open,
  onClose,
  actorRoles,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  actorRoles: string[];
  roles: RoleDto[];
}) {
  const queryClient = useQueryClient();
  const assignableRoles = useMemo(
    () => getAssignableRoles(actorRoles, roles),
    [actorRoles, roles],
  );
  const defaultRoleIds = useMemo(
    () =>
      assignableRoles
        .filter((role) => role.name === "USER")
        .map((role) => role.id),
    [assignableRoles],
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(defaultRoleIds);

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { email: "", password: "", displayName: "" },
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
      setSelectedRoleIds(defaultRoleIds);
      toast.success("User created");
      onClose();
    },
  });

  const toggleRole = (id: string) =>
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((roleId) => roleId !== id) : [...prev, id],
    );

  return (
    <ResourceDrawer
      open={open}
      title="New user"
      description="Create an account and assign the roles this operator can grant."
      onClose={onClose}
      footer={
        <Button
          type="submit"
          form="create-user-form"
          className="w-full"
          disabled={createUser.isPending}
        >
          {createUser.isPending ? <Spinner data-icon="inline-start" /> : null}
          Create user
        </Button>
      }
    >
      <form
        id="create-user-form"
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => {
          void createUser.mutateAsync({
            email: values.email,
            password: values.password,
            displayName: values.displayName,
            roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : defaultRoleIds,
          });
        })}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            aria-invalid={Boolean(form.formState.errors.displayName)}
            {...form.register("displayName")}
          />
          {form.formState.errors.displayName ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.displayName.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Roles</Label>
          {assignableRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignableRoles.map((role) => {
                const selected = selectedRoleIds.includes(role.id);
                return (
                  <Button
                    key={role.id}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleRole(role.id)}
                  >
                    {formatRoleName(role.name)}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {createUser.isError ? (
          <p className="text-sm text-destructive">
            Failed to create user. Check inputs and role permissions.
          </p>
        ) : null}
      </form>
    </ResourceDrawer>
  );
}

function StatChip({
  label,
  count,
  active,
}: {
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border px-4 py-3",
        active && "border-primary/30 bg-primary/5",
      )}
    >
      <p className="text-2xl font-semibold tabular-nums">{count}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "BLOCKED", label: "Blocked" },
];

export function UsersPage() {
  const navigate = useNavigate();
  const session = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showCreate, setShowCreate] = useState(false);

  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => webFetch<ListResponse<RoleDto>>("/api/v1/admin/roles"),
  });

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => webFetch<ListResponse<AdminUserDto>>("/api/v1/admin/users?limit=100"),
  });

  const updateUserStatus = useMutation({
    mutationFn: ({
      userIds,
      status,
    }: {
      userIds: string[];
      status: UpdateUserStatusInput["status"];
    }) =>
      Promise.all(
        userIds.map((userId) =>
          webFetch<{ data: AdminUserDto }>(`/api/v1/admin/users/${userId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status } satisfies UpdateUserStatusInput),
          }),
        ),
      ),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRowSelection({});
      toast.success(`${variables.userIds.length} users updated`);
    },
  });

  const allUsers = useMemo(() => users.data?.data ?? [], [users.data?.data]);
  const actorRoles = session.data?.data.user.roles ?? [];
  const permissions = session.data?.data.permissions ?? [];
  const canCreate = permissions.includes("users.create");
  const canUpdate = permissions.includes("users.update");

  const stats = useMemo(
    () => ({
      total: allUsers.length,
      active: allUsers.filter((user) => user.status === "ACTIVE").length,
      pending: allUsers.filter((user) => user.status === "PENDING").length,
      blocked: allUsers.filter((user) => user.status === "BLOCKED").length,
    }),
    [allUsers],
  );

  const filteredData = useMemo(() => {
    let data = allUsers;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (user) =>
          user.displayName.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      data = data.filter((user) => user.status === statusFilter);
    }
    return data;
  }, [allUsers, search, statusFilter]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all users"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.displayName}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("displayName", {
        id: "user",
        header: "User",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-0.5">
            <Avatar name={row.original.displayName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.original.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        enableSorting: true,
        cell: ({ getValue }) => {
          const status = getValue();
          const { variant, className } = statusProps(status);
          return (
            <Badge variant={variant} className={cn("capitalize", className)}>
              {status.toLowerCase()}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("roles", {
        header: "Roles",
        enableSorting: false,
        cell: ({ getValue }) => {
          const roleNames = getValue();
          if (!roleNames.length) {
            return <span className="text-xs text-muted-foreground">None</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {roleNames.slice(0, 3).map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {formatRoleName(role)}
                </Badge>
              ))}
              {roleNames.length > 3 ? (
                <Badge variant="outline" className="text-xs">
                  +{roleNames.length - 3}
                </Badge>
              ) : null}
            </div>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Joined",
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">{timeAgo(getValue())}</span>
        ),
      }),
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
  });

  const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
  const hasFilters = Boolean(search || statusFilter !== "all");

  return (
    <>
      <CreateUserDrawer
        key={`create-user:${actorRoles.join(",")}:${roles.data?.data.map((role) => role.id).join(",")}`}
        open={showCreate}
        onClose={() => setShowCreate(false)}
        actorRoles={actorRoles}
        roles={roles.data?.data ?? []}
      />

      <ResourcePageShell
        resource={usersResource}
        description="Manage accounts, roles, status, and operational access from one resource view."
        isRefreshing={users.isFetching || roles.isFetching}
        onRefresh={() => {
          void users.refetch();
          void roles.refetch();
        }}
        actions={
          canCreate ? (
            <Button onClick={() => setShowCreate(true)}>
              <UserPlus data-icon="inline-start" />
              New user
            </Button>
          ) : null
        }
      >
        {!users.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatChip label="Total" count={stats.total} />
            <StatChip label="Active" count={stats.active} active />
            <StatChip label="Pending" count={stats.pending} />
            <StatChip label="Blocked" count={stats.blocked} />
          </div>
        ) : null}

        <Card>
          <ResourceToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search name or email"
            hasFilters={hasFilters}
            onClearFilters={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            filters={
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
                {STATUS_TABS.map((tab) => (
                  <Button
                    key={tab.value}
                    type="button"
                    variant={statusFilter === tab.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(tab.value)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            }
            resultLabel={
              users.isLoading
                ? "Loading users"
                : filteredData.length === allUsers.length
                  ? `${allUsers.length} users`
                  : `${filteredData.length} of ${allUsers.length} users`
            }
          />
          <BulkActionBar
            selectedCount={selectedIds.length}
            onClear={() => setRowSelection({})}
            actions={
              canUpdate ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateUserStatus.isPending}
                    onClick={() =>
                      updateUserStatus.mutate({ userIds: selectedIds, status: "ACTIVE" })
                    }
                  >
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateUserStatus.isPending}
                    onClick={() =>
                      updateUserStatus.mutate({ userIds: selectedIds, status: "BLOCKED" })
                    }
                  >
                    Block
                  </Button>
                </>
              ) : null
            }
          />
          <CardContent className="p-0 pb-1">
            <ResourceTable
              table={table}
              isLoading={users.isLoading}
              emptyTitle={hasFilters ? "No users match your filters" : "No users yet"}
              emptyDescription={
                hasFilters
                  ? "Clear filters or adjust the search terms."
                  : "Create a user to start managing access."
              }
              onRowClick={(row) => void navigate(`/users/${row.original.id}`)}
            />
          </CardContent>
        </Card>
      </ResourcePageShell>
    </>
  );
}
