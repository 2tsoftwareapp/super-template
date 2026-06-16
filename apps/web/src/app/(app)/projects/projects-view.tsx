"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { ApiEnvelope, ProjectsListResponse } from "@/lib/api-types";
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
    queryFn: () =>
      webFetch<ProjectsListResponse>(buildProjectsListPath(filters)),
  });

  const exportProjects = useMutation({
    mutationFn: () =>
      webFetch<ApiEnvelope<{ id: string }>>("/api/bff/exports", {
        method: "POST",
        body: JSON.stringify({ type: "projects", filters }),
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit">
            Reference CRUD
          </Badge>
          <h1 className="text-4xl font-semibold">Projects</h1>
        </div>
        <div className="flex gap-2">
          <Button
            render={
              <Link
                href={buildProjectCreatePath(buildProjectReturnTo(filters))}
              />
            }
          >
            <Plus className="mr-2 size-4" />
            New project
          </Button>
          <Button variant="outline" onClick={() => exportProjects.mutate()}>
            Export CSV
          </Button>
        </div>
      </div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
          <CardDescription>
            Search and sort the project directory.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name or description"
              value={filters.search}
              onChange={(event) =>
                void setFilters({
                  search: event.target.value,
                  page: 1,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                void setFilters({
                  status: value!,
                  page: 1,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {projectStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort field</Label>
            <Select
              value={filters.sortField}
              onValueChange={(value) =>
                void setFilters({
                  sortField: value!,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort field" />
              </SelectTrigger>
              <SelectContent>
                {projectSortFieldOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort order</Label>
            <Select
              value={filters.sortOrder}
              onValueChange={(value) =>
                void setFilters({
                  sortOrder: value!,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                {sortOrderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        {projects.isLoading ? (
          <Card className="border-border">
            <CardContent className="flex min-h-40 items-center justify-center">
              <Spinner className="size-5 text-primary" />
            </CardContent>
          </Card>
        ) : projects.data?.data.length ? (
          projects.data.data.map((project) => (
            <Link
              key={project.id}
              href={buildProjectDetailPath(
                project.id,
                buildProjectReturnTo(filters),
              )}
            >
              <Card className="border-border transition hover:-translate-y-0.5 hover:">
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <CardDescription>
                      {typeof project.description === "string"
                        ? project.description
                        : "No description yet."}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{project.status}</Badge>
                </CardHeader>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="border-border">
            <CardContent className="py-10">
              <Empty className="border-border bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Plus className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No projects found</EmptyTitle>
                  <EmptyDescription>
                    Try a different filter or create the first record.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          Page {projects.data?.meta.page ?? filters.page} of{" "}
          {projects.data?.meta.totalPages ?? 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() =>
              void setFilters({ page: Math.max(1, filters.page - 1) })
            }
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              (projects.data?.meta.totalPages ?? filters.page) <= filters.page
            }
            onClick={() => void setFilters({ page: filters.page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
