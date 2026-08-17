"use client";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { JobsViewModel } from "@/features/jobs/model/jobs.types";

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

export type { JobsViewModel };

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
export function useJobsController(): JobsViewModel {
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
      onRefresh: retryList,
      isFetching: jobs.isFetching,
    },
    list: {
      jobs: allJobs,
      total,
      totalPages,
      page: filters.page,
      isLoading: jobs.isLoading,
      isFetching: jobs.isFetching,
      isError: jobs.isError,
      onRetry: retryList,
      emptyMessage,
      onPageChange: (page) => onFilterChange("page", page),
      canCancel: permissions.canCancel,
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
  };
}
