"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateProjectInput, ProjectResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";
import {
  buildProjectDetailPath,
  normalizeProjectReturnTo,
  projectNavigationSearchParams,
} from "@/lib/search-params";

const schema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().max(4000).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  ownerId: z.string().uuid().optional(),
});

type NewProjectFormInput = z.input<typeof schema>;
type NewProjectFormValues = z.output<typeof schema>;

const toCreateProjectInput = (
  values: NewProjectFormValues,
): CreateProjectInput => ({
  name: values.name,
  ...(values.description ? { description: values.description } : {}),
  ...(values.status ? { status: values.status } : {}),
  ...(values.ownerId ? { ownerId: values.ownerId } : {}),
});

export default function NewProjectPage() {
  const router = useRouter();
  const [returnTo] = useQueryState(
    "returnTo",
    projectNavigationSearchParams.returnTo,
  );
  const backToProjects = normalizeProjectReturnTo(returnTo);
  const form = useForm<NewProjectFormInput, undefined, NewProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: "DRAFT",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: NewProjectFormValues) =>
      webFetch<ProjectResponse>("/api/bff/projects", {
        method: "POST",
        body: JSON.stringify(toCreateProjectInput(values)),
      }),
    onSuccess: (result) => {
      toast.success("Project created");
      router.replace(buildProjectDetailPath(result.data.id, backToProjects));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="max-w-3xl border-border">
      <CardHeader className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={backToProjects} />}
        >
          Back to projects
        </Button>
        <Badge variant="outline" className="w-fit">
          Create project
        </Badge>
        <CardTitle className="text-4xl">New project</CardTitle>
        <CardDescription>
          Create a project record with structured defaults.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Create project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
