import type { ColumnDef, Table as ReactTable } from "@tanstack/react-table";

import type { NotificationDto, NotificationJobDto } from "@/lib/api-types";

import type { NotificationComposeFormValues } from "./notifications.schemas";

export interface NotificationsColumnOptions {
  canCancel: boolean;
  isCancelling: boolean;
  statusProps: (status: string) => {
    variant: "default" | "secondary" | "outline";
    className?: string;
  };
  onCancel: (jobId: string) => void;
}

export type NotificationsColumnFactory = (
  options: NotificationsColumnOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors TanStack's own `columns: ColumnDef<TData, any>[]` input type
) => ColumnDef<NotificationJobDto, any>[];

export interface NotificationsViewModel {
  isRefreshing: boolean;
  onRefresh: () => void;
  compose: {
    canAccess: boolean;
    isSending: boolean;
    isError: boolean;
    onSubmit: (values: NotificationComposeFormValues) => void;
  };
  jobs: {
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    onRefresh: () => void;
  };
  recent: {
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    data: NotificationDto[];
  };
  table: ReactTable<NotificationJobDto>;
}
