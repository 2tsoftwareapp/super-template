"use client";

import type { SortCriterion } from "@repo/api-sort";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { JobsColumnFactory, JobsViewModel } from "@/features/jobs/model/jobs.types";
import type { JobDto } from "@/lib/api-types";

import { useResourceTableConfig } from "@/components/use-resource-table-config";
import { useCancelJobMutation } from "@/features/jobs/api/jobs.mutations";
import {
  useJobDetailQuery,
  useJobLogsQuery,
  useJobMetricsQuery,
  useJobsQuery,
} from "@/features/jobs/api/jobs.queries";
import { jobsKeys } from "@/features/jobs/api/jobs.query-keys";
import { jobStatusProps, STATUS_OPTIONS } from "@/features/jobs/model/jobs.constants";
import { selectJobPermissions } from "@/features/jobs/model/jobs.permissions";
import {
  type JobsFilters,
  parseJobsFilters,
  serializeJobsFilters,
} from "@/features/jobs/model/jobs.search-params";
import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";
import { createTableSortBridge } from "@/lib/table-sort";

export type { JobsViewModel };

type JobsSortField = "createdAt";

const jobsSortBridge = createTableSortBridge<JobsSortField>({
  fieldByColumn: {
    scheduledAt: "createdAt",
  },
  columnByField: {
    createdAt: "scheduledAt",
  },
});

interface UseJobsControllerOptions {
  createColumns: JobsColumnFactory;
}

/**
 * Orchestration hook for the jobs queue screen.
 *
 * Flow:
 *   1. Parse URL filters (status/type/page); debounce type search.
 *   2. Parallel list + metrics queries (staleTime 0 for live queue).
 *   3. Detail drawer loads job + logs when a row is opened.
 *   4. Cancel: confirm → mutation → invalidate `jobsKeys.all` + toast on error.
 * Owns: URL filters, list/metrics/detail/logs queries, cancel confirm.
 * Does not own: table/drawer presentational markup.
 */
export function useJobsController({ createColumns }: UseJobsControllerOptions): JobsViewModel {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const session = useSession();
  const permissions = selectJobPermissions(session.data?.data.permissions);

  const [filters, setFilters] = useState<JobsFilters>(() =>
    parseJobsFilters(new URLSearchParams(searchParams.toString())),
  );
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const debouncedType = useDebouncedValue(filters.type, 400);

  const onFilterChange = (key: keyof JobsFilters, value: string | number) => {
    const next = { ...filters, [key]: value };
    if (key !== "page") {
      next.page = 1;
    }
    setFilters(next);
    const qs = serializeJobsFilters(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const jobs = useJobsQuery({
    status: filters.status || undefined,
    type: debouncedType || undefined,
    page: filters.page,
    sortOrder: filters.sortOrder,
  });

  const metrics = useJobMetricsQuery();
  const jobDetail = useJobDetailQuery(selectedJobId ?? undefined);
  const jobLogs = useJobLogsQuery(selectedJobId ?? undefined);
  const cancelJob = useCancelJobMutation();

  const allJobs = jobs.data?.data ?? [];
  const totalPages = jobs.data?.meta?.totalPages ?? 1;
  const total = jobs.data?.meta?.total ?? 0;
  const selectedJob = jobDetail.data?.data ?? null;
  const selectedEvents = jobLogs.data?.data ?? [];

  const handleConfirmCancel = () => {
    if (!confirmCancel) return;
    cancelJob.mutate(confirmCancel, {
      onSuccess: () => {
        setConfirmCancel(null);
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  const handleSortChange = (nextSort: SortCriterion<JobsSortField>[]) => {
    const primary = nextSort[0] ?? { field: "createdAt" as const, order: "desc" as const };
    const next = { ...filters, sortOrder: primary.order, page: 1 };
    setFilters(next);
    const qs = serializeJobsFilters(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const jobsSort: SortCriterion<JobsSortField>[] = [
    { field: "createdAt", order: filters.sortOrder },
  ];

  const { table } = useResourceTableConfig<JobDto, JobsSortField>({
    data: allJobs,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- model now any[]
    columns: createColumns({
      canCancel: permissions.canCancel,
      confirmId: confirmCancel,
      cancelPending: cancelJob.isPending,
      statusProps: jobStatusProps,
      onDetail: (jobId) => setSelectedJobId(jobId),
      onCancelRequest: (jobId) => setConfirmCancel(jobId),
      onCancelConfirm: handleConfirmCancel,
      onCancelDismiss: () => setConfirmCancel(null),
    }),
    enableSelection: false,
    getRowId: (row) => row.id,
    listParams: { sort: jobsSort },
    sortBridge: jobsSortBridge,
    onSortChange: handleSortChange,
    onPageChange: (page) => onFilterChange("page", page),
  });

  const hasFilters = Boolean(filters.status || filters.type);
  const emptyMessage = hasFilters ? "No jobs match your filters." : "No jobs found.";

  const retryList = () => {
    void queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
  };
  const retryMetrics = () => {
    void queryClient.invalidateQueries({ queryKey: jobsKeys.metrics });
  };
  const retryDetail = () => {
    if (!selectedJobId) return;
    void queryClient.invalidateQueries({
      queryKey: jobsKeys.detail(selectedJobId),
    });
  };
  const retryLogs = () => {
    if (!selectedJobId) return;
    void queryClient.invalidateQueries({
      queryKey: jobsKeys.logs(selectedJobId),
    });
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: jobsKeys.all });
  };

  return {
    header: {
      metrics: metrics.data?.data ?? null,
      metricsLoading: metrics.isLoading,
      metricsError: metrics.isError,
      onRetryMetrics: retryMetrics,
      isFetching: jobs.isFetching || metrics.isFetching,
      onRefresh: handleRefresh,
    },
    filters: {
      status: filters.status,
      type: filters.type,
      statusOptions: STATUS_OPTIONS,
      onStatusChange: (value) => onFilterChange("status", value),
      onTypeChange: (value) => onFilterChange("type", value),
      hasFilters,
      onClearFilters: () => {
        setFilters({ status: "", type: "", page: 1, sortOrder: "desc" });
        router.replace(pathname, { scroll: false });
      },
      onRefresh: retryList,
      isFetching: jobs.isFetching,
    },
    list: {
      total,
      totalPages,
      page: filters.page,
      isLoading: jobs.isLoading,
      isFetching: jobs.isFetching,
      isError: jobs.isError,
      onRetry: retryList,
      emptyMessage,
      onPageChange: (page) => onFilterChange("page", page),
      statusProps: jobStatusProps,
    },
    detail: {
      selectedJob,
      isOpen: !!selectedJobId,
      detailLoading: jobDetail.isLoading,
      detailError: jobDetail.isError,
      onRetryDetail: retryDetail,
      onOpen: (jobId) => setSelectedJobId(jobId),
      onClose: () => setSelectedJobId(null),
    },
    logs: {
      events: selectedEvents,
      isLoading: jobLogs.isLoading,
      isError: jobLogs.isError,
      onRetry: retryLogs,
    },
    cancel: {
      confirmId: confirmCancel,
      isPending: cancelJob.isPending,
      onRequest: (jobId) => setConfirmCancel(jobId),
      onConfirm: handleConfirmCancel,
      onDismiss: () => setConfirmCancel(null),
    },
    table,
  };
}
