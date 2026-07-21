"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { Show } from "@repo/web-ui/show";

import type { JobsViewModel } from "@/features/jobs/model/jobs.types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { JobsDetailDrawer } from "@/features/jobs/ui/jobs-detail-drawer";
import { JobsFilterBar } from "@/features/jobs/ui/jobs-filter-bar";
import { JobsMetricsRow, JobsStatusRow } from "@/features/jobs/ui/jobs-stats";
import { JobsTable, JobsTablePagination } from "@/features/jobs/ui/jobs-table";
import { adminResources } from "@/lib/admin-resources";

const jobsResource = adminResources.find((r) => r.id === "jobs")!;

export function JobsListView({
  header,
  filters,
  list,
  detail,
  logs,
  cancel,
}: JobsViewModel) {
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

        <JobsFilterBar
          status={filters.status}
          type={filters.type}
          statusOptions={filters.statusOptions}
          onStatusChange={filters.onStatusChange}
          onTypeChange={filters.onTypeChange}
          onRefresh={filters.onRefresh}
          isFetching={filters.isFetching}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Queue</CardTitle>
            <CardDescription className="text-xs">
              {list.total > 0
                ? `${list.total} job${list.total !== 1 ? "s" : ""}`
                : "Manage scheduled and running jobs."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <JobsTable
              jobs={list.jobs}
              isLoading={list.isLoading}
              isError={list.isError}
              onRetry={list.onRetry}
              emptyMessage={list.emptyMessage}
              confirmId={cancel.confirmId}
              cancelPending={cancel.isPending}
              canCancel={list.canCancel}
              statusProps={list.statusProps}
              onDetail={detail.onOpen}
              onCancelRequest={cancel.onRequest}
              onCancelConfirm={cancel.onConfirm}
              onCancelDismiss={cancel.onDismiss}
            />

            <JobsTablePagination
              page={list.page}
              totalPages={list.totalPages}
              total={list.total}
              isFetching={list.isFetching}
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
