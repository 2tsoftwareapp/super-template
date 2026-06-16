"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const toCreateProjectInput = (values: NewProjectFormValues): CreateProjectInput => ({
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
    <Card className="max-w-3xl">
      <Link href={backToProjects} className="text-sm text-neutral-500 underline">
        Back to projects
      </Link>
      <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">
        Create project
      </p>
      <h1 className="mt-3 text-4xl font-semibold">New project</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <Input placeholder="Project name" {...form.register("name")} />
        <Input placeholder="Description" {...form.register("description")} />
        <select
          className="h-11 w-full rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
          {...form.register("status")}
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Create project"}
        </Button>
      </form>
    </Card>
  );
}
