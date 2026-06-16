import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowUpDown, ChevronDown, ChevronUp, Search, UserPlus, X } from "lucide-react";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Spinner } from "../components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { webFetch } from "../lib/http";
import { timeAgo, statusProps } from "../lib/format";
import { formatRoleName, getAssignableRoles } from "../lib/roles";
import { useSession } from "../lib/session";
import type {
  AdminUserDto,
  CreateAdminUserInput,
  ListResponse,
  RoleDto,
} from "../lib/types";
import { cn } from "../lib/utils";

// ── Column definitions ────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<AdminUserDto>();

const columns = [
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
      const s = getValue();
      const { variant, className } = statusProps(s);
      return (
        <Badge variant={variant} className={cn("capitalize", className)}>
          {s.toLowerCase()}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("roles", {
    header: "Roles",
    enableSorting: false,
    cell: ({ getValue }) => {
      const roles = getValue();
      if (!roles.length)
        return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {roles.slice(0, 3).map((role) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {formatRoleName(role)}
            </Badge>
          ))}
          {roles.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{roles.length - 3}
            </Badge>
          )}
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
];

// ── Create user drawer ────────────────────────────────────────────────────────

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
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    defaultRoleIds,
  );

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
      onClose();
    },
  });

  const toggleRole = (id: string) =>
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">New user</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Create an account and optionally assign roles.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <form
            id="create-user-form"
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              void createUser.mutateAsync({
                email: values.email,
                password: values.password,
                displayName: values.displayName,
                roleIds:
                  selectedRoleIds.length > 0 ? selectedRoleIds : defaultRoleIds,
              });
            })}
          >
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input {...form.register("displayName")} />
              {form.formState.errors.displayName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.displayName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Roles{" "}
                <span className="font-normal text-muted-foreground">(required)</span>
              </Label>
              {assignableRoles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No roles available.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {assignableRoles.map((role) => {
                    const selected = selectedRoleIds.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                          selected
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
                        )}
                      >
                        {formatRoleName(role.name)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {createUser.isError && (
              <p className="text-xs text-destructive">
                Failed to create user. Check inputs and role permissions.
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-5 py-4">
          <Button
            type="submit"
            form="create-user-form"
            className="w-full"
            disabled={createUser.isPending}
          >
            {createUser.isPending ? (
              <>
                <Spinner className="size-4" /> Creating…
              </>
            ) : (
              "Create user"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

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
        "rounded-xl border border-border px-4 py-3",
        active && "border-primary/30 bg-primary/5",
      )}
    >
      <p className="text-2xl font-bold tabular-nums">{count}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Status filter tabs ────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "BLOCKED", label: "Blocked" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function UsersPage() {
  const navigate = useNavigate();
  const session = useSession();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showCreate, setShowCreate] = useState(false);

  const roles = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => webFetch<ListResponse<RoleDto>>("/api/v1/admin/roles"),
  });

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => webFetch<ListResponse<AdminUserDto>>("/api/v1/admin/users?limit=100"),
  });

  const allUsers = useMemo(() => users.data?.data ?? [], [users.data?.data]);
  const actorRoles = session.data?.data.user.roles ?? [];

  const stats = useMemo(
    () => ({
      total: allUsers.length,
      active: allUsers.filter((u) => u.status === "ACTIVE").length,
      pending: allUsers.filter((u) => u.status === "PENDING").length,
      blocked: allUsers.filter((u) => u.status === "BLOCKED").length,
    }),
    [allUsers],
  );

  const filteredData = useMemo(() => {
    let data = allUsers;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      data = data.filter((u) => u.status === statusFilter);
    }
    return data;
  }, [allUsers, search, statusFilter]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <>
      {showCreate && (
        <CreateUserDrawer
          key={`create-user:${actorRoles.join(",")}:${roles.data?.data.map((role) => role.id).join(",")}`}
          open
          onClose={() => setShowCreate(false)}
          actorRoles={actorRoles}
          roles={roles.data?.data ?? []}
        />
      )}

      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage accounts, roles, and access.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="shrink-0">
            <UserPlus className="size-4" />
            New user
          </Button>
        </div>

        {/* Stats */}
        {!users.isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatChip label="Total" count={stats.total} />
            <StatChip label="Active" count={stats.active} active />
            <StatChip label="Pending" count={stats.pending} />
            <StatChip label="Blocked" count={stats.blocked} />
          </div>
        )}

        {/* Table card */}
        <Card>
          <CardHeader className="space-y-3 pb-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name or email…"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      statusFilter === tab.value
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {!users.isLoading && (
              <p className="text-xs text-muted-foreground">
                {filteredData.length === allUsers.length
                  ? `${allUsers.length} users`
                  : `${filteredData.length} of ${allUsers.length} users`}
              </p>
            )}
          </CardHeader>

          <CardContent className="p-0 pb-1">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id}>
                    {group.headers.map((header) => {
                      const sorted = header.column.getIsSorted();
                      const canSort = header.column.getCanSort();
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(canSort && "cursor-pointer select-none")}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder ? null : (
                            <span className="inline-flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {canSort && (
                                sorted === "asc" ? (
                                  <ChevronUp className="size-3 shrink-0" />
                                ) : sorted === "desc" ? (
                                  <ChevronDown className="size-3 shrink-0" />
                                ) : (
                                  <ArrowUpDown className="size-3 shrink-0 opacity-30" />
                                )
                              )}
                            </span>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {users.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-16 text-center">
                      <Spinner className="mx-auto size-5" />
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="py-16 text-center text-sm text-muted-foreground"
                    >
                      {search || statusFilter !== "all"
                        ? "No users match your filters."
                        : "No users yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => void navigate(`/users/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
