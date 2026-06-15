"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import type { NotificationsListResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

export default function NotificationsPage() {
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      webFetch<NotificationsListResponse>(
        "/api/bff/notifications?page=1&limit=20",
      ),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">
          Inbox
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Notifications</h1>
      </div>
      <div className="space-y-4">
        {notifications.data?.data.map((notification) => (
          <Card key={notification.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{notification.title}</h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  {notification.body}
                </p>
              </div>
              <span className="text-xs uppercase tracking-[0.22em] text-neutral-400">
                {notification.type}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
