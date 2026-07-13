"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import type { JobDto, JobEventDto, JobMetricsDto } from "@/lib/api-types";

import { useCancelJobMutation } from "@/features/jobs/api/jobs.mutations";
import {
  useJobDetailQuery,
  useJobLogsQuery,
  useJobMetricsQuery,
  useJobsQuery,
} from "@/features/jobs/api/jobs.queries";
import { type JobsFilters, parseJobsFilters } from "@/features/jobs/model/constants";
import { usePathname, useRouter } from "@/i18n/navigation";

export interface JobsViewModel {
  header: {
    metrics: JobMetricsDto | null;
    metricsLoading: boolean;
    isFetching: boolean;
    onRefresh: () => void;
  };
  filters: {
    status: string;
    type: string;
    onStatusChange: (value: string) => void;
    onTypeChange: (value: string) => void;
    onRefresh: () => void;
    isFetching: boolean;
  };
  list: {
    jobs: JobDto[];
    total: number;
    totalPages: number;
    page: number;
    isLoading: boolean;
    isFetching: boolean;
    emptyMessage: string;
    onPageChange: (page: number) => void;
  };
  detail: {
    selectedJob: JobDto | null;
    isOpen: boolean;
    detailLoading: boolean;
    onOpen: (jobId: string) => void;
    onClose: () => void;
  };
  logs: {
    events: JobEventDto[];
    isLoading: boolean;
  };
  cancel: {
    confirmId: string | null;
    isPending: boolean;
    onRequest: (jobId: string) => void;
    onConfirm: () => void;
    onDismiss: () => void;
  };
}

export function useJobsController(): JobsViewModel {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<JobsFilters>(() =>
    parseJobsFilters(new URLSearchParams(searchParams.toString())),
  );
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const updateFilter = useCallback(
    (key: keyof JobsFilters, value: string | number) => {
      const next = { ...filters, [key]: value };
      if (key !== "page") next.page = 1;
      setFilters(next);
      const sp = new URLSearchParams();
      if (next.status) sp.set("status", next.status);
      if (next.type) sp.set("type", next.type);
      if (next.page > 1) sp.set("page", String(next.page));
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const jobs = useJobsQuery({
    status: filters.status || undefined,
    type: filters.type || undefined,
    page: filters.page,
  });

  const metrics = useJobMetricsQuery();

  const jobDetail = useJobDetailQuery(selectedJobId ?? undefined);

  const jobLogs = useJobLogsQuery(selectedJobId ?? undefined);

  const cancelJob = useCancelJobMutation({
    onSuccess: () => {
      setConfirmCancel(null);
    },
  });

  const allJobs = jobs.data?.data ?? [];
  const totalPages = jobs.data?.meta?.totalPages ?? 1;
  const total = jobs.data?.meta?.total ?? 0;
  const selectedJob = jobDetail.data?.data ?? null;
  const selectedEvents = jobLogs.data?.data ?? [];

  const hasFilters = Boolean(filters.status || filters.type);
  const emptyMessage = hasFilters
    ? "No jobs match your filters."
    : "No jobs found.";

  return {
    header: {
      metrics: metrics.data?.data ?? null,
      metricsLoading: metrics.isLoading,
      isFetching: jobs.isFetching || metrics.isFetching,
      onRefresh: () => {
        void jobs.refetch();
        void metrics.refetch();
      },
    },
    filters: {
      status: filters.status,
      type: filters.type,
      onStatusChange: (value: string) => updateFilter("status", value),
      onTypeChange: (value: string) => updateFilter("type", value),
      onRefresh: () => void jobs.refetch(),
      isFetching: jobs.isFetching,
    },
    list: {
      jobs: allJobs,
      total,
      totalPages,
      page: filters.page,
      isLoading: jobs.isLoading,
      isFetching: jobs.isFetching,
      emptyMessage,
      onPageChange: (page: number) => updateFilter("page", page),
    },
    detail: {
      selectedJob,
      isOpen: !!selectedJobId,
      detailLoading: jobDetail.isLoading,
      onOpen: (jobId: string) => setSelectedJobId(jobId),
      onClose: () => setSelectedJobId(null),
    },
    logs: {
      events: selectedEvents,
      isLoading: jobLogs.isLoading,
    },
    cancel: {
      confirmId: confirmCancel,
      isPending: cancelJob.isPending,
      onRequest: (jobId: string) => setConfirmCancel(jobId),
      onConfirm: () => {
        if (confirmCancel) cancelJob.mutate(confirmCancel);
      },
      onDismiss: () => setConfirmCancel(null),
    },
  };
}
