import type { ListResponse, NotificationDto, NotificationJobDto, SendNotificationInput } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

export async function fetchNotificationJobs() {
  return webFetch<ListResponse<NotificationJobDto>>("/api/bff/admin/notifications/jobs?limit=50");
}

export async function fetchRecentNotifications() {
  return webFetch<ListResponse<NotificationDto>>("/api/bff/notifications?limit=10");
}

export async function sendNotification(input: SendNotificationInput) {
  return webFetch<{ data: NotificationJobDto }>("/api/bff/admin/notifications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function cancelNotificationJob(jobId: string) {
  return webFetch(`/api/bff/admin/notifications/jobs/${jobId}`, {
    method: "DELETE",
  });
}
