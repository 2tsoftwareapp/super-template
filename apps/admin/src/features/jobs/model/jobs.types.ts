import type { JobDto, JobEventDto, JobMetricsDto } from "@/lib/api-types";

import type { STATUS_OPTIONS } from "./jobs.constants";

export interface JobsColumnOptions {
  canCancel: boolean;
  confirmId: string | null;
  cancelPending: boolean;
  statusProps: (status: string) => {
    variant: "default" | "secondary" | "outline";
    className?: string;
  };
  onDetail: (jobId: string) => void;
  onCancelRequest: (jobId: string) => void;
  onCancelConfirm: () => void;
  onCancelDismiss: () => void;
}

export type JobsColumnFactory = (
  options: JobsColumnOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- column defs are opaque in model
) => any[];

export interface JobsViewModel {
  header: {
    metrics: JobMetricsDto | null;
    metricsLoading: boolean;
    metricsError: boolean;
    onRetryMetrics: () => void;
    isFetching: boolean;
    onRefresh: () => void;
  };
  filters: {
    status: string;
    type: string;
    statusOptions: typeof STATUS_OPTIONS;
    onStatusChange: (value: string) => void;
    onTypeChange: (value: string) => void;
    hasFilters: boolean;
    onClearFilters: () => void;
    onRefresh: () => void;
    isFetching: boolean;
  };
  list: {
    total: number;
    totalPages: number;
    page: number;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    onRetry: () => void;
    emptyMessage: string;
    onPageChange: (page: number) => void;
    statusProps: (status: string) => {
      variant: "default" | "secondary" | "outline";
      className?: string;
    };
  };
  detail: {
    selectedJob: JobDto | null;
    isOpen: boolean;
    detailLoading: boolean;
    detailError: boolean;
    onRetryDetail: () => void;
    onOpen: (jobId: string) => void;
    onClose: () => void;
  };
  logs: {
    events: JobEventDto[];
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
  };
  cancel: {
    confirmId: string | null;
    isPending: boolean;
    onRequest: (jobId: string) => void;
    onConfirm: () => void;
    onDismiss: () => void;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table is opaque in model
  table: any;
}
