"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ProjectsListResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

export default function ProjectsPage() {
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () =>
      webFetch<ProjectsListResponse>("/api/bff/projects?page=1&limit=20"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">
            Reference CRUD
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Projects</h1>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white dark:bg-amber-300 dark:text-neutral-950"
        >
          <Plus className="mr-2 h-4 w-4" />
          New project
        </Link>
      </div>
      <div className="grid gap-4">
        {projects.data?.data.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="transition hover:-translate-y-0.5 hover:bg-white dark:hover:bg-neutral-950">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{project.name}</h2>
                  <p className="mt-2 text-sm text-neutral-500">
                    {typeof project.description === "string"
                      ? project.description
                      : "No description yet."}
                  </p>
                </div>
                <div className="text-sm text-neutral-500">{project.status}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
