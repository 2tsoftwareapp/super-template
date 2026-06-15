"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Card } from "@/components/ui/card";
import type { ProjectResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";
import {
  buildProjectEditPath,
  normalizeProjectReturnTo,
  projectNavigationSearchParams,
} from "@/lib/search-params";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [returnTo] = useQueryState(
    "returnTo",
    projectNavigationSearchParams.returnTo,
  );
  const backToProjects = normalizeProjectReturnTo(returnTo);
  const project = useQuery({
    queryKey: ["project", params.id],
    queryFn: () => webFetch<ProjectResponse>(`/api/bff/projects/${params.id}`),
  });

  return (
    <Card className="max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <Link href={backToProjects} className="text-sm text-neutral-500 underline">
            Back to projects
          </Link>
          <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">
            Project detail
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            {project.data?.data.name}
          </h1>
        </div>
        <Link
          href={buildProjectEditPath(params.id, backToProjects)}
          className="text-sm underline"
        >
          Edit
        </Link>
      </div>
      <p className="mt-6 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
        {typeof project.data?.data.description === "string"
          ? project.data.data.description
          : "No description provided."}
      </p>
    </Card>
  );
}
