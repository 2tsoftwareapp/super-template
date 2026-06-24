"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { ProjectDto, UpdateProjectInput } from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { adminResources } from "@/lib/admin-resources";
import { timeAgo, truncateId } from "@/lib/format";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

const projectsResource = adminResources.find((r) => r.id === "projects")!;
const STATUS_OPTIONS = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;
type ProjectStatus = (typeof STATUS_OPTIONS)[number];

const overviewSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  ownerId: z.string().optional(),
});
type OverviewForm = z.infer<typeof overviewSchema>;

export function ProjectDetailView() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const queryClient = useQueryClient();
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>("DRAFT");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const project = useQuery({
    queryKey: ["admin-project", projectId],
    queryFn: () =>
      webFetch<{ data: ProjectDto }>(`/api/bff/projects/${projectId}`),
    enabled: Boolean(projectId),
  });

  const item = project.data?.data;

  // ── Mutations ──
  const updateProject = useMutation({
    mutationFn: (input: UpdateProjectInput) =>
      webFetch<{ data: ProjectDto }>(`/api/bff/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast.success("Project updated");
    },
  });

  const updateStatus = useMutation({
    mutationFn: (status: ProjectStatus) =>
      webFetch<{ data: ProjectDto }>(`/api/bff/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast.success("Status updated");
    },
  });

  const deleteProject = useMutation({
    mutationFn: () =>
      webFetch(`/api/bff/projects/${projectId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      router.replace("/projects");
    },
  });

  const overviewForm = useForm<OverviewForm>({
    resolver: zodResolver(overviewSchema),
    values: {
      name: item?.name ?? "",
      description: typeof item?.description === "string" ? item.description : "",
      ownerId: item?.ownerId ?? "",
    },
  });

  // ── Guards ──
  if (!projectId) return null;

  if (project.isLoading) {
    return (
      <ResourcePageShell resource={projectsResource} description="Loading project details.">
        <Skeleton className="h-72 rounded-xl" />
      </ResourcePageShell>
    );
  }

  if (!item) {
    return (
      <ResourcePageShell resource={projectsResource} description="Project not found.">
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">Project not found.</p>
          <Link href="/projects" className="text-sm underline">Back to projects</Link>
        </div>
      </ResourcePageShell>
    );
  }

  const currentStatus: ProjectStatus = item.status;

  return (
    <ResourcePageShell
      resource={projectsResource}
      title={item.name}
      description={`${item.status.toLowerCase()} · Updated ${timeAgo(item.updatedAt)} · ID: ${truncateId(item.id)}`}
      backHref="/projects"
      onRefresh={() => void project.refetch()}
      isRefreshing={project.isFetching}
    >
      <Card>
        <CardHeader>
          <CardTitle>Edit project</CardTitle>
          <CardDescription>Manage project details, status, and state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ── Overview ── */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Overview</h4>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={overviewForm.handleSubmit((values) => {
                void updateProject.mutateAsync({
                  name: values.name,
                  ...(values.description ? { description: values.description } : {}),
                  ...(values.ownerId ? { ownerId: values.ownerId } : {}),
                });
              })}
            >
              <div className="space-y-1.5">
                <Label htmlFor="o-name">Name</Label>
                <Input id="o-name" {...overviewForm.register("name")} />
                {overviewForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{overviewForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-owner">Owner ID</Label>
                <Input id="o-owner" disabled {...overviewForm.register("ownerId")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="o-description">Description</Label>
                <Input id="o-description" {...overviewForm.register("description")} />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" disabled={updateProject.isPending || (!overviewForm.formState.isDirty && !updateProject.isError)}>
                  {updateProject.isPending ? <><Spinner className="size-4" /> Saving…</> : "Save overview"}
                </Button>
                {updateProject.isSuccess && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="size-3" /> Saved</span>
                )}
                {updateProject.isError && (
                  <span className="text-xs text-destructive">Save failed.</span>
                )}
              </div>
            </form>
          </div>

          <Separator />

          {/* ── Status ── */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Status</h4>
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updateStatus.isPending}
                  onClick={() => setSelectedStatus(s)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    selectedStatus === s
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.toLowerCase()}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={updateStatus.isPending || selectedStatus === currentStatus}
                onClick={() => void updateStatus.mutateAsync(selectedStatus)}
              >
                {updateStatus.isPending ? <><Spinner className="size-3.5" /> Updating…</> : "Apply status"}
              </Button>
              {updateStatus.isSuccess && (
                <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="size-3" /> Updated</span>
              )}
              {updateStatus.isError && (
                <span className="text-xs text-destructive">
                  Failed. <button type="button" className="underline" onClick={() => void updateStatus.mutateAsync(selectedStatus)}>Retry</button>
                </span>
              )}
            </div>
          </div>

          {/* ── Actions ── */}
          <>
            <Separator />
            <div className="flex flex-wrap items-center gap-2">
              {confirmDelete && (
                <ConfirmDialog
                  open
                  title="Delete project"
                  message={
                    <>
                      Permanently delete <span className="font-medium text-foreground">{item.name}</span>? This cannot be undone.
                    </>
                  }
                  confirmLabel={deleteProject.isPending ? "Deleting…" : "Confirm delete"}
                  destructive
                  loading={deleteProject.isPending}
                  onCancel={() => setConfirmDelete(false)}
                  onConfirm={async () => {
                    await deleteProject.mutateAsync();
                    setConfirmDelete(false);
                  }}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                Delete project
              </Button>
              {deleteProject.isError && (
                <p className="text-xs text-destructive">
                  Failed. <button type="button" className="underline" onClick={() => void deleteProject.mutateAsync()}>Retry</button>
                </p>
              )}
            </div>
          </>
        </CardContent>
      </Card>
    </ResourcePageShell>
  );
}
