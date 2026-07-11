"use client";

import { Alert } from "@repo/web-core/components/alert";
import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";
import { Spinner } from "@repo/web-core/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/web-core/components/table";
import { Textarea } from "@repo/web-core/components/textarea";
import { Tooltip } from "@repo/web-core/components/tooltip";
import { AlertCircle, CheckCircle2, Clock, RefreshCcw, Trash2 } from "lucide-react";
import { useState } from "react";

import type {
  SendNotificationInput,
} from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import {
  useCancelNotificationJobMutation,
  useSendNotificationMutation,
} from "@/features/notifications/use-notifications-mutations";
import {
  useNotificationJobsQuery,
  useRecentNotificationsQuery,
} from "@/features/notifications/use-notifications-queries";
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
        className: status === "FAILED"
          ? "text-destructive border-destructive/40"
          : undefined,
      };
    default:
      return { variant: "outline" as const, icon: Clock };
  }
}

export function NotificationsView() {
  const jobs = useNotificationJobsQuery();
  const recentNotifications = useRecentNotificationsQuery();

  const [audience, setAudience] = useState("ALL");
  const [userId, setUserId] = useState("");
  const [userIds, setUserIds] = useState("");
  const [type, setType] = useState("SYSTEM");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const send = useSendNotificationMutation({
    onSuccess: () => {
      setTitle("");
      setBody("");
      setType("SYSTEM");
      setUserId("");
      setUserIds("");
      setAudience("ALL");
    },
  });

  const cancelJob = useCancelNotificationJobMutation();

  const handleSend = () => {
    const input: SendNotificationInput = {
      audience: audience as SendNotificationInput["audience"],
      type,
      title: title || "Test notification",
      body: body || "This is a test notification sent from the admin panel.",
    };
    if (audience === "USER") input.userId = userId;
    if (audience === "USERS")
      input.userIds = userIds
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    send.mutate(input);
  };

  const invalidateAll = () => {
    void jobs.refetch();
    void recentNotifications.refetch();
  };

  return (
    <ResourcePageShell
      resource={notificationsResource}
      description="Send test notifications and manage delivery jobs."
      isRefreshing={jobs.isFetching || recentNotifications.isFetching}
      onRefresh={invalidateAll}
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        {/* ── Compose ── */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Send test notification</CardTitle>
            <CardDescription className="text-xs">
              Queue a notification immediately through the admin API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {send.isError && (
              <Alert variant="error">
                Failed to queue notification. Check the API and try again.
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notif-audience">Audience</Label>
              <select
                id="notif-audience"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-hidden transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="ALL">All users</option>
                <option value="USER">Single user</option>
                <option value="USERS">Multiple users</option>
              </select>
            </div>

            {audience === "USER" && (
              <div className="space-y-1.5">
                <Label htmlFor="notif-user-id">User ID</Label>
                <Input
                  id="notif-user-id"
                  placeholder="uuid of the target user"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            )}

            {audience === "USERS" && (
              <div className="space-y-1.5">
                <Label htmlFor="notif-user-ids">User IDs</Label>
                <Textarea
                  id="notif-user-ids"
                  placeholder="One UUID per line, or comma-separated"
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notif-type">Type</Label>
              <Input
                id="notif-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-title">Title</Label>
              <Input
                id="notif-title"
                placeholder="Test notification"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notif-body">Body</Label>
              <Textarea
                id="notif-body"
                placeholder="This is a test notification sent from the admin panel."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSend}
              disabled={send.isPending}
            >
              {send.isPending ? (
                <>
                  <Spinner className="size-4" /> Queuing…
                </>
              ) : (
                "Send test notification"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── Jobs + Recent ── */}
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
                <Button variant="ghost" size="sm" onClick={() => jobs.refetch()}>
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
                  {jobs.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center">
                        <Spinner className="mx-auto size-4" />
                      </TableCell>
                    </TableRow>
                  ) : (jobs.data?.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No notification jobs yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (jobs.data?.data ?? []).map((job) => {
                      const s = jobStatus(job.status);
                      const sb = statusBadge(s);
                      const Icon = sb.icon;
                      return (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-xs">
                            {job.type}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
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
                              <span>{timeAgo(scalarString(job.scheduledAt, ""))}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {s === "PENDING" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                disabled={cancelJob.isPending}
                                onClick={() => cancelJob.mutate(job.id)}
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
              {recentNotifications.isLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner className="size-4" />
                </div>
              ) : (recentNotifications.data?.data ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No recent notifications.
                </p>
              ) : (
                (recentNotifications.data?.data ?? []).map((item) => (
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
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{timeAgo(String(item.createdAt))}</span>
                      {item.readAt && (
                        <span>· Read {timeAgo(scalarString(item.readAt, ""))}</span>
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
