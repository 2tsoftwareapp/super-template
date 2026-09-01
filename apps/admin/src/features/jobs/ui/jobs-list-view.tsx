"use client";

import type { ResourceStatCardItem } from "@repo/web-ui/resource-stat-cards";

import { CommonResourcePage } from "@repo/web-ui/common-resource-page";
import { ErrorState } from "@repo/web-ui/error-state";
import { ResourceDataTable } from "@repo/web-ui/resource-data-table";
import { ResourceFilterBar } from "@repo/web-ui/resource-filter-bar";
import { AlertCircle, CheckCircle2, Clock, Workflow } from "lucide-react";

import type { JobsViewModel } from "@/features/jobs/model/jobs.types";

import { adminResources } from "@/features/_plugin-resources/admin-resources";
import {
  getActiveJobsCount,
  getCompletedJobsCount,
  getFailedJobsCount,
  getTotalJobsCount,
} from "@/features/jobs/model/jobs.metrics";

import { JobsDetailPane } from "./jobs-detail-drawer";

const jobsResource = adminResources.find((r) => r.id === "jobs")!;

export function JobsListView({ header, filters, list, detail, logs, table }: JobsViewModel) {
  const stats: ResourceStatCardItem[] | undefined = header.metrics
    ? [
        {
          label: "Total",
          value: getTotalJobsCount(header.metrics),
          description: "All recorded jobs",
          icon: Workflow,
        },
        {
          label: "Active",
          value: getActiveJobsCount(header.metrics),
          description: "Queued and processing",
          icon: Clock,
        },
        {
          label: "Failed",
          value: getFailedJobsCount(header.metrics),
          description:
            (header.metrics.totalFailed ?? 0) > 0 ? "Requires attention" : "No failed jobs",
          icon: AlertCircle,
        },
        {
          label: "Completed",
          value: getCompletedJobsCount(header.metrics),
          description: "Successfully finished",
          icon: CheckCircle2,
        },
      ]
    : undefined;

  return (
    <CommonResourcePage
      resource={jobsResource}
      description="Inspect queued background jobs and cancel stalled work."
      isRefreshing={header.isFetching}
      onRefresh={header.onRefresh}
      stats={stats}
      statsColumns={4}
      statsLoading={header.metricsLoading}
      error={
        header.metricsError ? (
          <ErrorState
            variant="inline"
            title="Could not load job metrics."
            action={{ label: "Retry", onClick: header.onRetryMetrics }}
          />
        ) : undefined
      }
      filterBar={
        <ResourceFilterBar
          search={{
            value: filters.type,
            onChange: filters.onTypeChange,
            placeholder: "Job type (e.g. SEND_NOTIFICATION)",
          }}
          facets={[
            {
              key: "status",
              label: "Status",
              options: filters.statusOptions
                .filter((opt) => opt.value !== "")
                .map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                })),
              selectedValues: filters.status ? [filters.status] : [],
              onChange: (values) => {
                filters.onStatusChange(values[values.length - 1] ?? "");
              },
            },
          ]}
          onClearAll={filters.onClearFilters}
        />
      }
      pagination={{
        page: list.page,
        pageSize: 50,
        total: list.total,
        totalPages: list.totalPages,
        isLoading: list.isFetching,
        onPageChange: list.onPageChange,
      }}
      detailPane={
        <JobsDetailPane
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
      }
    >
      <ResourceDataTable
        table={table}
        isLoading={list.isLoading}
        error={list.isError ? { title: "Could not load jobs.", onRetry: list.onRetry } : undefined}
        onRowClick={(job) => detail.onOpen(job.id)}
        empty={{
          title: list.emptyMessage,
        }}
      />
    </CommonResourcePage>
  );
}
