"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Card } from "@/components/ui/card";
import type { ProjectsListResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";
import {
  buildProjectCreatePath,
  buildProjectDetailPath,
  buildProjectReturnTo,
  buildProjectsListPath,
  projectSortFieldOptions,
  projectStatusOptions,
  projectsSearchParams,
  sortOrderOptions,
} from "@/lib/search-params";

export function ProjectsView() {
  const [filters, setFilters] = useQueryStates(projectsSearchParams);
  const projects = useQuery({
    queryKey: ["projects", filters],
    queryFn: () => webFetch<ProjectsListResponse>(buildProjectsListPath(filters)),
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
          href={buildProjectCreatePath(buildProjectReturnTo(filters))}
          className="inline-flex items-center rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white dark:bg-amber-300 dark:text-neutral-950"
        >
          <Plus className="mr-2 h-4 w-4" />
          New project
        </Link>
      </div>
      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <input
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            placeholder="Search by name or description"
            value={filters.search}
            onChange={(event) =>
              void setFilters({
                search: event.target.value,
                page: 1,
              })
            }
          />
          <select
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            value={filters.status}
            onChange={(event) =>
              void setFilters({
                status: event.target.value as typeof filters.status,
                page: 1,
              })
            }
          >
            {projectStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            value={filters.sortField}
            onChange={(event) =>
              void setFilters({
                sortField: event.target.value as typeof filters.sortField,
              })
            }
          >
            {projectSortFieldOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            value={filters.sortOrder}
            onChange={(event) =>
              void setFilters({
                sortOrder: event.target.value as typeof filters.sortOrder,
              })
            }
          >
            {sortOrderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>
      <div className="grid gap-4">
        {projects.data?.data.map((project) => (
          <Link
            key={project.id}
            href={buildProjectDetailPath(
              project.id,
              buildProjectReturnTo(filters),
            )}
          >
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
      <div className="flex items-center justify-between text-sm text-neutral-500">
        <p>
          Page {projects.data?.meta.page ?? filters.page} of{" "}
          {projects.data?.meta.totalPages ?? 1}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-black/10 px-4 py-2 disabled:opacity-40 dark:border-white/10"
            disabled={filters.page <= 1}
            onClick={() => void setFilters({ page: Math.max(1, filters.page - 1) })}
          >
            Previous
          </button>
          <button
            className="rounded-full border border-black/10 px-4 py-2 disabled:opacity-40 dark:border-white/10"
            disabled={
              (projects.data?.meta.totalPages ?? filters.page) <= filters.page
            }
            onClick={() => void setFilters({ page: filters.page + 1 })}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
