"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const toUpdateProjectInput = (values: EditProjectFormValues): UpdateProjectInput => ({
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
    <Card className="max-w-3xl">
      <Link href={backToProjects} className="text-sm text-neutral-500 underline">
        Back to projects
      </Link>
      <h1 className="text-4xl font-semibold">Edit project</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <Input {...form.register("name")} />
        <Input {...form.register("description")} />
        <select
          className="h-11 w-full rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
          {...form.register("status")}
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <Button type="submit">Save changes</Button>
      </form>
    </Card>
  );
}
