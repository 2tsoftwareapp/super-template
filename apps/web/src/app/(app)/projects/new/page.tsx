"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CreateProjectInput, ProjectResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

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
      router.replace(`/projects/${result.data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="max-w-3xl">
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
