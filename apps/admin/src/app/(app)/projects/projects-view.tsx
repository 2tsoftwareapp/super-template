"use client";

import { useDebouncedValue } from "@repo/web-core/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { AlertTriangle, ChevronRight, FolderPlus, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type {
  CreateProjectInput,
  ListResponse,
  ProjectDto,
  UpdateProjectInput,
} from "@/lib/api-types";

import { BulkActionBar } from "@/components/bulk-action-bar";
import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceTable } from "@/components/resource-table";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { useBulkMutation } from "@/hooks/use-bulk-mutation";
import { adminResources } from "@/lib/admin-resources";
import { webFetch } from "@/lib/http";

const projectsResource = adminResources.find(
  (resource) => resource.id === "projects",
)!;
const columnHelper = createColumnHelper<ProjectDto>();

function projectStatusVariant(
  status: string,
): "default" | "secondary" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "DRAFT") return "secondary";
  return "outline";
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

function parseSearchParams(sp: URLSearchParams) {
  return {
    page: Math.max(1, Number(sp.get("page")) || 1),
    limit: (PAGE_SIZE_OPTIONS.includes(Number(sp.get("limit")) as PageSize)
      ? Number(sp.get("limit"))
      : 20) as PageSize,
    search: sp.get("search") ?? "",
    status: sp.get("status") ?? "all",
  };
}

function serializeParams(p: { page: number; limit: PageSize; search: string; status: string }) {
  const sp = new URLSearchParams();
  if (p.page > 1) sp.set("page", String(p.page));
  if (p.limit !== 20) sp.set("limit", String(p.limit));
  if (p.search) sp.set("search", p.search);
  if (p.status && p.status !== "all") sp.set("status", p.status);
  return sp.toString();
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
      webFetch<{ data: ProjectDto }>("/api/bff/projects", {
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
          {createProject.isPending ? (
            <Spinner data-icon="inline-start" />
          ) : null}
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
        {createProject.isError ? (
          <p className="text-sm text-destructive">
            Failed to create project. Check inputs and try again.
          </p>
        ) : null}
      </form>
    </ResourceDrawer>
  );
}

export function ProjectsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listParams = useMemo(
    () => parseSearchParams(searchParams),
    [searchParams],
  );
  const [searchInput, setSearchInput] = useState(listParams.search);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showCreate, setShowCreate] = useState(false);

  const debouncedSearch = useDebouncedValue(searchInput, 500);

  useEffect(() => {
    setSearchInput(listParams.search);
  }, [listParams.search]);

  const patchParams = useCallback(
    (patch: Partial<{ page: number; limit: PageSize; search: string; status: string }>) => {
      const next = { ...listParams, ...patch };
      const serialized = serializeParams(next);
      const current = searchParams.toString();
      if (serialized === current) return;
      router.replace(serialized ? `${pathname}?${serialized}` : pathname);
    },
    [listParams, pathname, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch === listParams.search) return;
    patchParams({ search: debouncedSearch, page: 1 });
  }, [debouncedSearch, listParams.search, patchParams]);

  // ── Query ──
  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(listParams.page));
    sp.set("limit", String(listParams.limit));
    if (listParams.search) sp.set("search", listParams.search);
    if (listParams.status !== "all") sp.set("status", listParams.status);
    return sp.toString();
  }, [listParams]);

  const projects = useQuery({
    queryKey: ["admin-projects", queryString],
    queryFn: () =>
      webFetch<ListResponse<ProjectDto>>(`/api/bff/projects?${queryString}`),
    placeholderData: (prev: ListResponse<ProjectDto> | undefined) => prev,
  });

  const activateProjects = useBulkMutation({
    mutationFn: (id) =>
      webFetch<{ data: ProjectDto }>(`/api/bff/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE" } satisfies UpdateProjectInput),
      }),
    queryKey: ["admin-projects"],
    successMessage: "activated",
  });

  const archiveProjects = useBulkMutation({
    mutationFn: (id) =>
      webFetch<{ data: ProjectDto }>(`/api/bff/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ARCHIVED" } satisfies UpdateProjectInput),
      }),
    queryKey: ["admin-projects"],
    successMessage: "archived",
  });

  const items = projects.data?.data ?? [];
  const meta = projects.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;
  const hasFilters = Boolean(listParams.search || listParams.status !== "all");

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
            {typeof row.original.description === "string" &&
            row.original.description ? (
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
            <Badge
              variant={projectStatusVariant(status)}
              className="capitalize text-xs"
            >
              {status.toLowerCase()}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "chevron",
        header: "",
        enableSorting: false,
        cell: () => (
          <ChevronRight className="size-4 text-muted-foreground/40" />
        ),
      }),
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: items,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
  });

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);

  return (
    <>
      <CreateProjectDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <ResourcePageShell
        resource={projectsResource}
        description="Manage project records, operational state, and ownership."
        isRefreshing={projects.isFetching}
        onRefresh={() => void projects.refetch()}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <FolderPlus data-icon="inline-start" />
            New project
          </Button>
        }
      >
        <Card>
          {projects.isError ? (
            <Alert variant="error" className="m-4 mb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="size-4" />
                  Failed to load projects
                </div>
                <Button variant="outline" size="sm" onClick={() => void projects.refetch()}>
                  Retry
                </Button>
              </div>
            </Alert>
          ) : null}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or description"
                className="h-9 pl-9 text-sm"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setRowSelection({});
                }}
              />
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border p-1">
              {STATUS_FILTERS.map((tab) => (
                <Button
                  key={tab.value}
                  type="button"
                  variant={listParams.status === tab.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    patchParams({ status: tab.value, page: 1 });
                    setRowSelection({});
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  patchParams({ search: "", status: "all", page: 1 });
                  setSearchInput("");
                  setRowSelection({});
                }}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          <BulkActionBar
            selectedCount={selectedIds.length}
            onClear={() => setRowSelection({})}
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activateProjects.isPending || archiveProjects.isPending}
                  onClick={async () => {
                    await activateProjects.mutateAsync(selectedIds);
                    setRowSelection({});
                  }}
                >
                  {activateProjects.isPending ? <Spinner className="size-3.5" /> : null}
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activateProjects.isPending || archiveProjects.isPending}
                  onClick={async () => {
                    await archiveProjects.mutateAsync(selectedIds);
                    setRowSelection({});
                  }}
                >
                  {archiveProjects.isPending ? <Spinner className="size-3.5" /> : null}
                  Archive
                </Button>
              </>
            }
          />
          <CardContent className="p-0 pb-1">
            <ResourceTable
              table={table}
              isLoading={projects.isLoading}
              emptyTitle={
                hasFilters
                  ? "No projects match your filters"
                  : "No projects yet"
              }
              emptyDescription={
                hasFilters
                  ? "Clear filters or adjust the search terms."
                  : "Create a project to start tracking workspaces."
              }
              onRowClick={(row) =>
                void router.push(`/projects/${row.original.id}`)
              }
            />
            <Pagination
              page={listParams.page}
              pageSize={listParams.limit}
              totalPages={totalPages}
              total={total}
              isLoading={projects.isFetching}
              onPageChange={(p) => {
                patchParams({ page: p });
                setRowSelection({});
              }}
              onPageSizeChange={(s) => {
                patchParams({ limit: s as PageSize, page: 1 });
                setRowSelection({});
              }}
            />
          </CardContent>
        </Card>
      </ResourcePageShell>
    </>
  );
}
