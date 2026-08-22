"use client";

import type { SortCriterion } from "@repo/api-sort";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { NotificationComposeFormValues } from "@/features/notifications/model/notifications.schemas";
import type {
  NotificationsColumnFactory,
  NotificationsViewModel,
} from "@/features/notifications/model/notifications.types";
import type { NotificationJobDto, SendNotificationInput } from "@/lib/api-types";

import { useResourceTableConfig } from "@/components/use-resource-table-config";
import {
  useCancelNotificationJobMutation,
  useSendNotificationMutation,
} from "@/features/notifications/api/notifications.mutations";
import {
  useNotificationJobsQuery,
  useRecentNotificationsQuery,
} from "@/features/notifications/api/notifications.queries";
import { notificationsKeys } from "@/features/notifications/api/notifications.query-keys";
import { useNotificationStream } from "@/features/notifications/api/notifications.stream";
import { notificationJobStatusProps } from "@/features/notifications/model/notifications.constants";
import { selectNotificationPermissions } from "@/features/notifications/model/notifications.permissions";
import {
  parseNotificationsSearchParams,
  serializeNotificationsSearchParams,
} from "@/features/notifications/model/notifications.search-params";
import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";
import { createTableSortBridge } from "@/lib/table-sort";

export type { NotificationsViewModel };

type NotificationsSortField = "createdAt";

const notificationsSortBridge = createTableSortBridge<NotificationsSortField>({
  fieldByColumn: {
    scheduledAt: "createdAt",
  },
  columnByField: {
    createdAt: "scheduledAt",
  },
});

interface UseNotificationsControllerOptions {
  createColumns: NotificationsColumnFactory;
}

/**
 * Orchestration hook for the notifications screen.
 *
 * Flow:
 *   1. Load delivery jobs + recent inbox in parallel (staleTime 0).
 *   2. Gate compose/cancel on `notifications.create`.
 *   3. Send/cancel mutations toast errors and invalidate related keys.
 * Owns: compose form, jobs/recent queries, send/cancel mutations.
 * Does not own: notification job table presentation.
 */
export function useNotificationsController({
  createColumns,
}: UseNotificationsControllerOptions): NotificationsViewModel {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const permissions = selectNotificationPermissions(session.data?.data.permissions);

  const { sortOrder } = parseNotificationsSearchParams(
    new URLSearchParams(searchParams.toString()),
  );

  const handleSortChange = (nextSort: SortCriterion<NotificationsSortField>[]) => {
    const primary = nextSort[0] ?? { field: "createdAt" as const, order: "desc" as const };
    const qs = serializeNotificationsSearchParams({ sortOrder: primary.order });
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const jobs = useNotificationJobsQuery(permissions.canRead, sortOrder);
  const recentNotifications = useRecentNotificationsQuery();

  // Subscribe to SSE so new notifications invalidate the inbox in real time.
  useNotificationStream(Boolean(session.data));

  const buildInput = (values: NotificationComposeFormValues): SendNotificationInput => {
    const input: SendNotificationInput = {
      audience: values.audience,
      type: values.type,
      title: values.title,
      body: values.body,
    };
    if (values.audience === "USER") input.userId = values.userId;
    if (values.audience === "USERS")
      input.userIds = (values.userIds ?? "")
        .split(/[\n,]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    return input;
  };

  const send = useSendNotificationMutation({
    onSuccess: () => {
      toast.success("Notification queued.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const cancelJob = useCancelNotificationJobMutation({
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSend = (values: NotificationComposeFormValues) => {
    if (!permissions.canSend) return;
    send.mutate(buildInput(values));
  };

  const retryJobs = () => {
    void queryClient.invalidateQueries({
      queryKey: notificationsKeys.jobs(),
    });
  };
  const retryRecent = () => {
    void queryClient.invalidateQueries({
      queryKey: notificationsKeys.recent(),
    });
  };
  const handleRefresh = () => {
    void queryClient.invalidateQueries({
      queryKey: notificationsKeys.all,
    });
  };

  const jobsSort: SortCriterion<NotificationsSortField>[] = [
    { field: "createdAt", order: sortOrder },
  ];

  const { table } = useResourceTableConfig<NotificationJobDto, NotificationsSortField>({
    data: jobs.data?.data ?? [],

    columns: createColumns({
      canCancel: permissions.canCancel,
      isCancelling: cancelJob.isPending,
      statusProps: notificationJobStatusProps,
      onCancel: (jobId) => cancelJob.mutate(jobId),
    }),
    enableSelection: false,
    getRowId: (row) => row.id,
    listParams: { sort: jobsSort },
    sortBridge: notificationsSortBridge,
    onSortChange: handleSortChange,
  });

  return {
    isRefreshing: jobs.isFetching || recentNotifications.isFetching,
    onRefresh: handleRefresh,
    compose: {
      canAccess: permissions.canSend,
      isSending: send.isPending,
      isError: send.isError,
      onSubmit: handleSend,
    },
    jobs: {
      isLoading: jobs.isLoading,
      isError: jobs.isError,
      onRetry: retryJobs,
      onRefresh: retryJobs,
    },
    recent: {
      isLoading: recentNotifications.isLoading,
      isError: recentNotifications.isError,
      onRetry: retryRecent,
      data: recentNotifications.data?.data ?? [],
    },
    table,
  };
}
