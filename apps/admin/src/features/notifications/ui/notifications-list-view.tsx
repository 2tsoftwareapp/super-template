"use client";

import { Badge } from "@repo/web-ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@repo/web-ui/empty";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { Show } from "@repo/web-ui/show";

import type { NotificationsViewModel } from "@/features/notifications/model/notifications.types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in row.original cast
import type { NotificationJobDto } from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceTable } from "@/components/resource-table";
import { adminResources } from "@/features/_plugin-resources/admin-resources";
import { scalarString, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

import { NotificationComposeForm } from "./notification-compose-form";

const notificationsResource = adminResources.find((r) => r.id === "notifications")!;

/**
 * Presentational notifications view. Receives a fully-resolved view model from
 * the notifications controller and renders it; it owns no server state or
 * orchestration.
 */
export function NotificationsListView({
  isRefreshing,
  onRefresh,
  compose,
  jobs,
  recent,
  table,
}: NotificationsViewModel) {
  return (
    <ResourcePageShell
      resource={notificationsResource}
      description="Send test notifications and manage delivery jobs."
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Show when={compose.canAccess}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Send test notification</CardTitle>
              <CardDescription className="text-xs">
                Queue a notification immediately through the admin API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <NotificationComposeForm
                isSending={compose.isSending}
                isError={compose.isError}
                onSubmit={compose.onSubmit}
              />
            </CardContent>
          </Card>
        </Show>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery jobs</CardTitle>
              <CardDescription className="text-xs">
                Recent notification jobs and their status.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-1">
              <ResourceTable
                table={table}
                isLoading={jobs.isLoading}
                {...(jobs.isError ? { error: { title: "Could not load delivery jobs." } } : {})}
                onRetry={jobs.onRetry}
                emptyTitle="No notification jobs yet."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent notifications</CardTitle>
              <CardDescription className="text-xs">
                Last 10 notifications delivered to users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              <Show when={recent.isLoading}>
                <SectionLoading />
              </Show>
              <Show when={!recent.isLoading && recent.isError}>
                <ErrorState
                  variant="inline"
                  title="Could not load recent notifications."
                  action={{ label: "Retry", onClick: recent.onRetry }}
                />
              </Show>
              {!recent.isLoading && !recent.isError && recent.data.length === 0 ? (
                <Empty className="py-6">
                  <EmptyContent>
                    <EmptyHeader>
                      <EmptyTitle>No recent notifications</EmptyTitle>
                    </EmptyHeader>
                  </EmptyContent>
                </Empty>
              ) : null}
              {!recent.isLoading && !recent.isError
                ? recent.data.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl p-3",
                        item.readAt ? "bg-muted/30" : "border border-border bg-card",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {item.type}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{timeAgo(String(item.createdAt))}</span>
                        {item.readAt ? (
                          <span>· Read {timeAgo(scalarString(item.readAt, ""))}</span>
                        ) : null}
                      </div>
                    </div>
                  ))
                : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </ResourcePageShell>
  );
}
