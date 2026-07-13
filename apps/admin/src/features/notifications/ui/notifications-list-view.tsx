"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { Input } from "@repo/web-ui/input";
import { Label } from "@repo/web-ui/label";
import { SectionLoading } from "@repo/web-ui/loading";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { Show } from "@repo/web-ui/show";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/web-ui/table";
import { Textarea } from "@repo/web-ui/textarea";
import { Tooltip } from "@repo/web-ui/tooltip";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Trash2,
} from "lucide-react";

import type { NotificationsViewModel } from "@/features/notifications/controllers/use-notifications-controller";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/lib/admin-resources";
import { formatUnknownDateTime, scalarString, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const notificationsResource = adminResources.find(
  (r) => r.id === "notifications",
)!;

function jobStatus(s: unknown): string {
  if (typeof s === "string") return s;
  return "UNKNOWN";
}

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return { variant: "default" as const, icon: CheckCircle2 };
    case "PENDING":
      return { variant: "secondary" as const, icon: Clock };
    case "PROCESSING":
      return {
        variant: "secondary" as const,
        icon: RefreshCcw,
        className: "bg-accent text-accent-foreground border-border",
      };
    case "FAILED":
    case "CANCELLED":
      return {
        variant: "outline" as const,
        icon: status === "FAILED" ? AlertCircle : Clock,
        className:
          status === "FAILED"
            ? "text-destructive border-destructive/40"
            : undefined,
      };
    default:
      return { variant: "outline" as const, icon: Clock };
  }
}

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
}: NotificationsViewModel) {
  return (
    <ResourcePageShell
      resource={notificationsResource}
      description="Send test notifications and manage delivery jobs."
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Send test notification</CardTitle>
            <CardDescription className="text-xs">
              Queue a notification immediately through the admin API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Show when={compose.isError}>
              <ErrorState
                variant="inline"
                title="Failed to queue notification. Check the API and try again."
              />
            </Show>

            <div className="space-y-1.5">
              <Label htmlFor="notif-audience">Audience</Label>
              <select
                id="notif-audience"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-hidden transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={compose.audience}
                onChange={(e) => compose.onAudienceChange(e.target.value)}
              >
                <option value="ALL">All users</option>
                <option value="USER">Single user</option>
                <option value="USERS">Multiple users</option>
              </select>
            </div>

            {compose.audience === "USER" && (
              <div className="space-y-1.5">
                <Label htmlFor="notif-user-id">User ID</Label>
                <Input
                  id="notif-user-id"
                  placeholder="uuid of the target user"
                  value={compose.userId}
                  onChange={(e) => compose.onUserIdChange(e.target.value)}
                />
              </div>
            )}

            {compose.audience === "USERS" && (
              <div className="space-y-1.5">
                <Label htmlFor="notif-user-ids">User IDs</Label>
                <Textarea
                  id="notif-user-ids"
                  placeholder="One UUID per line, or comma-separated"
                  value={compose.userIds}
                  onChange={(e) => compose.onUserIdsChange(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notif-type">Type</Label>
              <Input
                id="notif-type"
                value={compose.type}
                onChange={(e) => compose.onTypeChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-title">Title</Label>
              <Input
                id="notif-title"
                placeholder="Test notification"
                value={compose.title}
                onChange={(e) => compose.onTitleChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-body">Body</Label>
              <Textarea
                id="notif-body"
                placeholder="This is a test notification sent from the admin panel."
                value={compose.body}
                onChange={(e) => compose.onBodyChange(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <LoadingButton
              className="w-full"
              onClick={compose.onSend}
              loading={compose.isSending}
            >
              Send test notification
            </LoadingButton>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Delivery jobs</CardTitle>
                  <CardDescription className="text-xs">
                    Recent notification jobs and their status.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={jobs.onRefresh}>
                  <RefreshCcw className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 pb-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <Show when={jobs.isLoading}>
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center">
                        <SectionLoading />
                      </TableCell>
                    </TableRow>
                  </Show>
                  {!jobs.isLoading && jobs.data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No notification jobs yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.data.map((job) => {
                      const s = jobStatus(job.status);
                      const sb = statusBadge(s);
                      const Icon = sb.icon;
                      return (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-xs">
                            {job.type}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {job.audience?.toLowerCase() ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Tooltip
                              content={
                                s === "FAILED" && job.errorMessage
                                  ? scalarString(job.errorMessage)
                                  : s
                              }
                              side="top"
                            >
                              <Badge
                                variant={sb.variant}
                                className={cn(
                                  "gap-1 text-xs capitalize",
                                  sb.className,
                                )}
                              >
                                <Icon className="size-3" />
                                {s.toLowerCase()}
                              </Badge>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {scalarString(job.recipientCount)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <Tooltip
                              content={
                                job.processedAt
                                  ? `Processed ${formatUnknownDateTime(job.processedAt)}`
                                  : formatUnknownDateTime(job.scheduledAt)
                              }
                              side="top"
                            >
                              <span>
                                {timeAgo(scalarString(job.scheduledAt, ""))}
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {s === "PENDING" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                disabled={jobs.isCancelling}
                                onClick={() => jobs.onCancel(job.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
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
              {!recent.isLoading && recent.data.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No recent notifications.
                </p>
              ) : (
                recent.data.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl p-3",
                      item.readAt
                        ? "bg-muted/30"
                        : "border border-border bg-card",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.body}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px]"
                      >
                        {item.type}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{timeAgo(String(item.createdAt))}</span>
                      {item.readAt && (
                        <span>
                          · Read {timeAgo(scalarString(item.readAt, ""))}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ResourcePageShell>
  );
}
