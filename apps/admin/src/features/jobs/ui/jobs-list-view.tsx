"use client";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { Pagination } from "@repo/web-ui/pagination";
import { Show } from "@repo/web-ui/show";

import type { JobsViewModel } from "@/features/jobs/model/jobs.types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in row.original cast
import type { JobDto } from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceTable } from "@/components/resource-table";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { adminResources } from "@/lib/admin-resources";

import { JobsDetailDrawer } from "./jobs-detail-drawer";
import { JobsMetricsRow, JobsStatusRow } from "./jobs-stats";

const jobsResource = adminResources.find((r) => r.id === "jobs")!;

export function JobsListView({ header, filters, list, detail, logs, table }: JobsViewModel) {
  return (
    <>
      <ResourcePageShell
        resource={jobsResource}
        description="Inspect queued background jobs and cancel stalled work."
        isRefreshing={header.isFetching}
        onRefresh={header.onRefresh}
      >
        <Show when={header.metricsError}>
          <ErrorState
            variant="inline"
            title="Could not load job metrics."
            action={{ label: "Retry", onClick: header.onRetryMetrics }}
          />
        </Show>

        <Show when={!!header.metrics}>
          <JobsMetricsRow metrics={header.metrics!} />
        </Show>

        <Show when={!!header.metrics}>
          <JobsStatusRow metrics={header.metrics!} />
        </Show>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Queue</CardTitle>
            <CardDescription className="text-xs">
              {list.total > 0
                ? `${list.total} job${list.total !== 1 ? "s" : ""}`
                : "Manage scheduled and running jobs."}
            </CardDescription>
          </CardHeader>
          <ResourceToolbar
            search={filters.type}
            onSearchChange={filters.onTypeChange}
            searchPlaceholder="Job type (e.g. SEND_NOTIFICATION)"
            hasFilters={filters.hasFilters}
            onClearFilters={filters.onClearFilters}
            filters={
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filters.status}
                onChange={(e) => filters.onStatusChange(e.target.value)}
              >
                {filters.statusOptions.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            }
          />
          <CardContent className="p-0 pb-1">
            <ResourceTable
               
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- model table is any
            table={table}
              isLoading={list.isLoading}
              {...(list.isError ? { error: { title: "Could not load jobs." } } : {})}
              onRetry={list.onRetry}
              emptyTitle={list.emptyMessage}
            />
            <Pagination
              page={list.page}
              pageSize={50}
              totalPages={list.totalPages}
              total={list.total}
              isLoading={list.isFetching}
              onPageChange={list.onPageChange}
            />
          </CardContent>
        </Card>
      </ResourcePageShell>

      <JobsDetailDrawer
        isOpen={detail.isOpen}
        selectedJob={detail.selectedJob}
        detailLoading={detail.detailLoading}
        detailError={detail.detailError}
        onRetryDetail={detail.onRetryDetail}
        events={logs.events}
        eventsLoading={logs.isLoading}
        eventsError={logs.isError}
        onRetryEvents={logs.onRetry}
        onClose={detail.onClose}
        statusProps={list.statusProps}
      />
    </>
  );
}
