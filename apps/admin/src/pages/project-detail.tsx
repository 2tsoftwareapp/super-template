import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import type { ListResponse, ProjectAttachmentDto, ProjectDto } from "../lib/types";

import { PageHeader } from "../components/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { webFetch } from "../lib/http";

export function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const project = useQuery({
    queryKey: ["admin-project", projectId],
    queryFn: () => webFetch<{ data: ProjectDto }>(`/api/v1/projects/${projectId}`),
    enabled: Boolean(projectId),
  });
  const attachments = useQuery({
    queryKey: ["admin-project-attachments", projectId],
    queryFn: () => webFetch<ListResponse<ProjectAttachmentDto>>(`/api/v1/projects/${projectId}/attachments`),
    enabled: Boolean(projectId),
  });
  const deleteProject = useMutation({
    mutationFn: () => webFetch(`/api/v1/projects/${projectId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      void navigate("/projects", { replace: true });
    },
  });
  const restoreProject = useMutation({
    mutationFn: () => webFetch(`/api/v1/projects/${projectId}/restore`, { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
    },
  });

  if (!projectId) {
    return null;
  }

  const item = project.data?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        label="Project detail"
        title={item?.name ?? "Loading project"}
        description="Inspect the project record, attachments, and restore/delete actions."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Overview</CardTitle>
            <CardDescription>Current project state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Status: <Badge variant="outline">{item?.status ?? "-"}</Badge></p>
            <p>Owner: {item?.ownerId ?? "-"}</p>
            <p>Created by: {item?.createdById ?? "-"}</p>
            <p>Updated at: {item?.updatedAt ?? "-"}</p>
            <p>
              Description:{" "}
              {renderValue(item?.description, "No description.")}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" onClick={() => void restoreProject.mutateAsync()} disabled={restoreProject.isPending}>
                {restoreProject.isPending ? "Restoring..." : "Restore"}
              </Button>
              <Button variant="destructive" onClick={() => void deleteProject.mutateAsync()} disabled={deleteProject.isPending}>
                {deleteProject.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Attachments</CardTitle>
            <CardDescription>Files linked to the project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(attachments.data?.data ?? []).map((attachment) => (
              <div key={attachment.id} className="rounded-2xl border border-border p-4 text-sm">
                <p className="font-medium">{attachment.fileId}</p>
                <p className="text-muted-foreground">{attachment.entityType}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function renderValue(value: string | null | undefined | object, fallback: string) {
  if (value == null) {
    return fallback;
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}
