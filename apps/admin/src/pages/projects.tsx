import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ChevronUp, FolderPlus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import type { CreateProjectInput, ListResponse, ProjectDto } from "../lib/types";

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
import { timeAgo } from "../lib/format";
import { webFetch } from "../lib/http";
import { cn } from "../lib/utils";

// ── Status helpers ────────────────────────────────────────────────────────────

function projectStatusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "DRAFT") return "secondary";
  return "outline";
}

// ── Column definitions ────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<ProjectDto>();

const columns = [
  columnHelper.accessor("name", {
    id: "project",
    header: "Project",
    enableSorting: true,
    cell: ({ row }) => (
      <div className="min-w-0 py-0.5">
        <p className="truncate text-sm font-medium">{row.original.name}</p>
        {typeof row.original.description === "string" && row.original.description ? (
          <p className="max-w-[280px] truncate text-xs text-muted-foreground">
            {row.original.description}
          </p>
        ) : null}
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    enableSorting: true,
    cell: ({ getValue }) => {
      const s = getValue();
      return (
        <Badge variant={projectStatusVariant(s)} className="capitalize text-xs">
          {s.toLowerCase()}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("updatedAt", {
    header: "Updated",
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{timeAgo(getValue())}</span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <Link
          to={`/projects/${row.original.id}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          View
        </Link>
        <Link
          to={`/projects/${row.original.id}/edit`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Edit
        </Link>
      </div>
    ),
  }),
];

// ── Create project drawer ─────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  ownerId: z.string().optional(),
});

type ProjectForm = z.infer<typeof createSchema>;

function CreateProjectDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm<ProjectForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "", status: "DRAFT", ownerId: "" },
  });

  const createProject = useMutation({
    mutationFn: (input: CreateProjectInput) =>
      webFetch<{ data: ProjectDto }>("/api/v1/projects", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      form.reset();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">New project</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Create a new project record in the system.
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

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <form
            id="create-project-form"
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              void createProject.mutateAsync({
                name: values.name,
                ...(values.description ? { description: values.description } : {}),
                ...(values.status ? { status: values.status } : {}),
                ...(values.ownerId ? { ownerId: values.ownerId } : {}),
              });
            })}
          >
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Description{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input {...form.register("description")} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register("status")}
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>
                Owner ID{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input {...form.register("ownerId")} />
            </div>
            {createProject.isError && (
              <p className="text-xs text-destructive">
                Failed to create project. Check inputs and try again.
              </p>
            )}
          </form>
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4">
          <Button
            type="submit"
            form="create-project-form"
            className="w-full"
            disabled={createProject.isPending}
          >
            {createProject.isPending ? (
              <>
                <Spinner className="size-4" /> Creating…
              </>
            ) : (
              "Create project"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, count, active }: { label: string; count: number; active?: boolean }) {
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
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showCreate, setShowCreate] = useState(false);

  const projects = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => webFetch<ListResponse<ProjectDto>>("/api/v1/projects?limit=100"),
  });

  const allProjects = useMemo(() => projects.data?.data ?? [], [projects.data?.data]);

  const stats = useMemo(
    () => ({
      total: allProjects.length,
      active: allProjects.filter((p) => p.status === "ACTIVE").length,
      draft: allProjects.filter((p) => p.status === "DRAFT").length,
      archived: allProjects.filter((p) => p.status === "ARCHIVED").length,
    }),
    [allProjects],
  );

  const filteredData = useMemo(() => {
    let data = allProjects;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      data = data.filter((p) => p.status === statusFilter);
    }
    return data;
  }, [allProjects, search, statusFilter]);

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
      <CreateProjectDrawer open={showCreate} onClose={() => setShowCreate(false)} />

      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage project records, status, and ownership.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="shrink-0">
            <FolderPlus className="size-4" />
            New project
          </Button>
        </div>

        {/* Stats */}
        {!projects.isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatChip label="Total" count={stats.total} />
            <StatChip label="Active" count={stats.active} active />
            <StatChip label="Draft" count={stats.draft} />
            <StatChip label="Archived" count={stats.archived} />
          </div>
        )}

        {/* Table card */}
        <Card>
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name or description…"
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

            {!projects.isLoading && (
              <p className="text-xs text-muted-foreground">
                {filteredData.length === allProjects.length
                  ? `${allProjects.length} projects`
                  : `${filteredData.length} of ${allProjects.length} projects`}
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
                              {canSort &&
                                (sorted === "asc" ? (
                                  <ChevronUp className="size-3 shrink-0" />
                                ) : sorted === "desc" ? (
                                  <ChevronDown className="size-3 shrink-0" />
                                ) : (
                                  <ArrowUpDown className="size-3 shrink-0 opacity-30" />
                                ))}
                            </span>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {projects.isLoading ? (
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
                        ? "No projects match your filters."
                        : "No projects yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => void navigate(`/projects/${row.original.id}`)}
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
