import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { CreateProjectInput, ListResponse, ProjectDto } from "../lib/types";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  ownerId: z.string().optional(),
});

type ProjectForm = z.infer<typeof schema>;

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const projects = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => webFetch<ListResponse<ProjectDto>>("/api/v1/projects?limit=50"),
  });
  const form = useForm<ProjectForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: "DRAFT",
      ownerId: "",
    },
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
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Projects"
        title="Project management"
        description="Review the project catalog and create new records from the admin workspace."
      />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Projects</CardTitle>
            <CardDescription>Current project list from the API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(projects.data?.data ?? []).map((project) => (
              <div key={project.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {renderValue(project.description, "No description.")}
                    </p>
                  </div>
                  <Badge variant="outline">{project.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link className="text-sm text-primary hover:underline" to={`/projects/${project.id}`}>View</Link>
                  <Link className="text-sm text-primary hover:underline" to={`/projects/${project.id}/edit`}>Edit</Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create project</CardTitle>
            <CardDescription>Add a new project record.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
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
              <div className="space-y-2">
                <Label htmlFor="project-name">Name</Label>
                <Input id="project-name" {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Input id="project-description" {...form.register("description")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status">Status</Label>
                <select id="project-status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...form.register("status")}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-owner">Owner ID</Label>
                <Input id="project-owner" {...form.register("ownerId")} />
              </div>
              <Button className="w-full" type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "Creating..." : "Create project"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function renderValue(value: unknown, fallback: string) {
  if (value == null) {
    return fallback;
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}
