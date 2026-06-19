"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ProjectDto, UpdateProjectInput } from "@/lib/api-types";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { webFetch } from "@/lib/http";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  ownerId: z.string().optional(),
});

type ProjectForm = z.infer<typeof schema>;

export function ProjectEditView() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const queryClient = useQueryClient();
  const router = useRouter();
  const project = useQuery({
    queryKey: ["admin-project", projectId],
    queryFn: () =>
      webFetch<{ data: ProjectDto }>(`/api/bff/projects/${projectId}`),
    enabled: Boolean(projectId),
  });
  const form = useForm<ProjectForm>({
    resolver: zodResolver(schema),
    values: {
      name: project.data?.data.name ?? "",
      description:
        typeof project.data?.data.description === "string"
          ? project.data.data.description
          : "",
      status: project.data?.data.status ?? "DRAFT",
      ownerId: project.data?.data.ownerId ?? "",
    },
  });
  const updateProject = useMutation({
    mutationFn: (input: UpdateProjectInput) =>
      webFetch<{ data: ProjectDto }>(`/api/bff/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-project", projectId],
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      router.replace(`/projects/${projectId}`);
    },
  });

  if (!projectId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Project edit"
        title="Edit project"
        description="Update the project record directly from the admin workspace."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Project details</CardTitle>
          <CardDescription>Persist changes back to the API.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={form.handleSubmit((values) => {
              void updateProject.mutateAsync({
                name: values.name,
                ...(values.description
                  ? { description: values.description }
                  : {}),
                ...(values.status ? { status: values.status } : {}),
                ...(values.ownerId ? { ownerId: values.ownerId } : {}),
              });
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-owner">Owner ID</Label>
              <Input id="edit-owner" {...form.register("ownerId")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input id="edit-description" {...form.register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                {...form.register("status")}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={updateProject.isPending}>
                {updateProject.isPending ? "Saving..." : "Save project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
