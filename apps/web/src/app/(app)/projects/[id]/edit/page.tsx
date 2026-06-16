"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useQueryState } from "nuqs";
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
import type { ProjectResponse, UpdateProjectInput } from "@/lib/api-types";
import { webFetch } from "@/lib/http";
import {
  buildProjectDetailPath,
  normalizeProjectReturnTo,
  projectNavigationSearchParams,
} from "@/lib/search-params";

const schema = z.object({
  name: z.string().min(2).max(160).optional(),
  description: z.string().max(4000).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  ownerId: z.string().uuid().optional(),
});

type EditProjectFormInput = z.input<typeof schema>;
type EditProjectFormValues = z.output<typeof schema>;

const toUpdateProjectInput = (
  values: EditProjectFormValues,
): UpdateProjectInput => ({
  ...(values.name ? { name: values.name } : {}),
  ...(values.description ? { description: values.description } : {}),
  ...(values.status ? { status: values.status } : {}),
  ...(values.ownerId ? { ownerId: values.ownerId } : {}),
});

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [returnTo] = useQueryState(
    "returnTo",
    projectNavigationSearchParams.returnTo,
  );
  const backToProjects = normalizeProjectReturnTo(returnTo);
  const project = useQuery({
    queryKey: ["project", params.id],
    queryFn: () => webFetch<ProjectResponse>(`/api/bff/projects/${params.id}`),
  });
  const form = useForm<EditProjectFormInput, undefined, EditProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  useEffect(() => {
    const record = project.data?.data;

    if (!record) {
      return;
    }

    form.reset({
      name: record.name,
      ...(typeof record.description === "string"
        ? { description: record.description }
        : {}),
      status: record.status,
    });
  }, [form, project.data]);

  const mutation = useMutation({
    mutationFn: (values: EditProjectFormValues) =>
      webFetch<ProjectResponse>(`/api/bff/projects/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify(toUpdateProjectInput(values)),
      }),
    onSuccess: () => {
      toast.success("Project updated");
      router.replace(buildProjectDetailPath(params.id, backToProjects));
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
          Edit project
        </Badge>
        <CardTitle className="text-4xl">Edit project</CardTitle>
        <CardDescription>
          Update the record and return to the detail view.
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
          <Button type="submit">Save changes</Button>
        </form>
      </CardContent>
    </Card>
  );
}
