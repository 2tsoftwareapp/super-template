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
import { FolderPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { BulkActionBar } from "@/components/bulk-action-bar";
import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceTable } from "@/components/resource-table";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { adminResources } from "@/lib/admin-resources";
import { timeAgo } from "@/lib/format";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

import type {
  CreateProjectInput,
  ListResponse,
  ProjectDto,
  UpdateProjectInput,
} from "../lib/types";

const projectsResource = adminResources.find((resource) => resource.id === "projects")!;
const columnHelper = createColumnHelper<ProjectDto>();

function projectStatusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "DRAFT") return "secondary";
  return "outline";
}

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  ownerId: z.string().optional(),
});

type ProjectForm = z.infer<typeof createSchema>;

function CreateProjectDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
      toast.success("Project created");
      onClose();
    },
  });

  return (
    <ResourceDrawer
      open={open}
      title="New project"
      description="Create a project record and choose its starting status."
      onClose={onClose}
      footer={
        <Button
          type="submit"
          form="create-project-form"
          className="w-full"
          disabled={createProject.isPending}
        >
          {createProject.isPending ? <Spinner data-icon="inline-start" /> : null}
          Create project
        </Button>
      }
    >
      <form
        id="create-project-form"
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => {
          void createProject.mutateAsync({
            name: values.name,
            ...(values.description ? { description: values.description } : {}),
            ...(values.status ? { status: values.status } : {}),
            ...(values.ownerId ? { ownerId: values.ownerId } : {}),
          });
        })}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project-name">Name</Label>
          <Input
            id="project-name"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register("name")}
          />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project-description">Description</Label>
          <Input id="project-description" {...form.register("description")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project-status">Status</Label>
          <select
            id="project-status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...form.register("status")}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project-owner">Owner ID</Label>
          <Input id="project-owner" {...form.register("ownerId")} />
        </div>
        {createProject.isError ? (
          <p className="text-sm text-destructive">
            Failed to create project. Check inputs and try again.
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
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showCreate, setShowCreate] = useState(false);

  const projects = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => webFetch<ListResponse<ProjectDto>>("/api/v1/projects?limit=100"),
  });

  const updateProjectStatus = useMutation({
    mutationFn: ({
      projectIds,
      status,
    }: {
      projectIds: string[];
      status: NonNullable<UpdateProjectInput["status"]>;
    }) =>
      Promise.all(
        projectIds.map((projectId) =>
          webFetch<{ data: ProjectDto }>(`/api/v1/projects/${projectId}`, {
            method: "PATCH",
            body: JSON.stringify({ status } satisfies UpdateProjectInput),
          }),
        ),
      ),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      setRowSelection({});
      toast.success(`${variables.projectIds.length} projects updated`);
    },
  });

  const allProjects = useMemo(() => projects.data?.data ?? [], [projects.data?.data]);

  const stats = useMemo(
    () => ({
      total: allProjects.length,
      active: allProjects.filter((project) => project.status === "ACTIVE").length,
      draft: allProjects.filter((project) => project.status === "DRAFT").length,
      archived: allProjects.filter((project) => project.status === "ARCHIVED").length,
    }),
    [allProjects],
  );

  const filteredData = useMemo(() => {
    let data = allProjects;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (project) =>
          project.name.toLowerCase().includes(q) ||
          (project.description ?? "").toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      data = data.filter((project) => project.status === statusFilter);
    }
    return data;
  }, [allProjects, search, statusFilter]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all projects"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        enableSorting: false,
      }),
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
          const status = getValue();
          return (
            <Badge variant={projectStatusVariant(status)} className="capitalize text-xs">
              {status.toLowerCase()}
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
          <div
            className="flex items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
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
      <CreateProjectDrawer open={showCreate} onClose={() => setShowCreate(false)} />

      <ResourcePageShell
        resource={projectsResource}
        description="Manage project records, operational state, and ownership from a resource list."
        isRefreshing={projects.isFetching}
        onRefresh={() => void projects.refetch()}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <FolderPlus data-icon="inline-start" />
            New project
          </Button>
        }
      >
        {!projects.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatChip label="Total" count={stats.total} />
            <StatChip label="Active" count={stats.active} active />
            <StatChip label="Draft" count={stats.draft} />
            <StatChip label="Archived" count={stats.archived} />
          </div>
        ) : null}

        <Card>
          <ResourceToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search name or description"
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
              projects.isLoading
                ? "Loading projects"
                : filteredData.length === allProjects.length
                  ? `${allProjects.length} projects`
                  : `${filteredData.length} of ${allProjects.length} projects`
            }
          />
          <BulkActionBar
            selectedCount={selectedIds.length}
            onClear={() => setRowSelection({})}
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updateProjectStatus.isPending}
                  onClick={() =>
                    updateProjectStatus.mutate({
                      projectIds: selectedIds,
                      status: "ACTIVE",
                    })
                  }
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updateProjectStatus.isPending}
                  onClick={() =>
                    updateProjectStatus.mutate({
                      projectIds: selectedIds,
                      status: "ARCHIVED",
                    })
                  }
                >
                  Archive
                </Button>
              </>
            }
          />
          <CardContent className="p-0 pb-1">
            <ResourceTable
              table={table}
              isLoading={projects.isLoading}
              emptyTitle={hasFilters ? "No projects match your filters" : "No projects yet"}
              emptyDescription={
                hasFilters
                  ? "Clear filters or adjust the search terms."
                  : "Create a project to start tracking workspaces."
              }
              onRowClick={(row) => void navigate(`/projects/${row.original.id}`)}
            />
          </CardContent>
        </Card>
      </ResourcePageShell>
    </>
  );
}
