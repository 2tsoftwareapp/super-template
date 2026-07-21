import { bffPath } from "@repo/api-contract";

import type {
  ListResponse,
  NotificationDto,
  NotificationJobDto,
  SendNotificationInput,
} from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

export const notificationsApi = {
  jobs() {
    return webFetch<ListResponse<NotificationJobDto>>(
      buildPath(bffPath("/api/v1/admin/notifications/jobs"), { limit: 50 }),
    );
  },

  recent() {
    return webFetch<ListResponse<NotificationDto>>(
      buildPath(bffPath("/api/v1/notifications"), { limit: 10 }),
    );
  },

  send(input: SendNotificationInput) {
    return webFetch<{ data: NotificationJobDto }>(
      bffPath("/api/v1/admin/notifications"),
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },

  cancelJob(jobId: string) {
    return webFetch(
      bffPath("/api/v1/admin/notifications/jobs/{id}", { id: jobId }),
      { method: "DELETE" },
    );
  },
};

/** @deprecated Prefer `notificationsApi` */
export const fetchNotificationJobs = () => notificationsApi.jobs();
export const fetchRecentNotifications = () => notificationsApi.recent();
export const sendNotification = (input: SendNotificationInput) =>
  notificationsApi.send(input);
export const cancelNotificationJob = (jobId: string) =>
  notificationsApi.cancelJob(jobId);
