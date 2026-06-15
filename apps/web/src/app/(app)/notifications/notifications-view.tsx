"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { Card } from "@/components/ui/card";
import type { NotificationsListResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";
import {
  buildNotificationsListPath,
  notificationUnreadOptions,
  notificationsSearchParams,
} from "@/lib/search-params";

export function NotificationsView() {
  const [filters, setFilters] = useQueryStates(notificationsSearchParams);
  const notifications = useQuery({
    queryKey: ["notifications", filters],
    queryFn: () =>
      webFetch<NotificationsListResponse>(buildNotificationsListPath(filters)),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">
          Inbox
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Notifications</h1>
      </div>
      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <input
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            placeholder="Filter by type"
            value={filters.type}
            onChange={(event) =>
              void setFilters({
                type: event.target.value,
                page: 1,
              })
            }
          />
          <select
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            value={String(filters.unread)}
            onChange={(event) =>
              void setFilters({
                unread: event.target.value === "true",
                page: 1,
              })
            }
          >
            {notificationUnreadOptions.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>
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
      <div className="flex items-center justify-between text-sm text-neutral-500">
        <p>
          Page {notifications.data?.meta.page ?? filters.page} of{" "}
          {notifications.data?.meta.totalPages ?? 1}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-black/10 px-4 py-2 disabled:opacity-40 dark:border-white/10"
            disabled={filters.page <= 1}
            onClick={() => void setFilters({ page: Math.max(1, filters.page - 1) })}
          >
            Previous
          </button>
          <button
            className="rounded-full border border-black/10 px-4 py-2 disabled:opacity-40 dark:border-white/10"
            disabled={
              (notifications.data?.meta.totalPages ?? filters.page) <=
              filters.page
            }
            onClick={() => void setFilters({ page: filters.page + 1 })}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
