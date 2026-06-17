import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { ListResponse, NotificationDto, NotificationJobDto, SendNotificationInput } from "../lib/types";

import { PageHeader } from "../components/page-header";
import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Spinner } from "../components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { timeAgo } from "../lib/format";
import { webFetch } from "../lib/http";
import { cn } from "../lib/utils";

// ── Status helper (shared with jobs page concept) ─────────────────────────────

function jobStatusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "COMPLETED") return { variant: "default" };
  if (status === "PENDING") return { variant: "secondary" };
  if (status === "PROCESSING") return { variant: "secondary", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" };
  if (status === "FAILED") return { variant: "outline", className: "text-destructive border-destructive/40" };
  return { variant: "outline" };
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const jobs = useQuery({
    queryKey: ["admin-notification-jobs"],
    queryFn: () => webFetch<ListResponse<NotificationJobDto>>("/api/v1/admin/notifications/jobs?limit=50"),
  });
  const recentNotifications = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => webFetch<ListResponse<NotificationDto>>("/api/v1/notifications?limit=10"),
  });

  const [audience, setAudience] = useState("ALL");
  const [type, setType] = useState("SYSTEM");
  const [title, setTitle] = useState("Template update");
  const [body, setBody] = useState("The template is ready for review.");
  const [userId, setUserId] = useState("");
  const [sent, setSent] = useState(false);

  const send = useMutation({
    mutationFn: (input: SendNotificationInput) =>
      webFetch<{ data: NotificationJobDto }>("/api/v1/admin/notifications", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      await queryClient.invalidateQueries({ queryKey: ["admin-notification-jobs"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Notifications"
        title="Notification center"
        description="Send admin notifications and inspect the delivery queue."
      />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Compose panel */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Compose</CardTitle>
            <CardDescription className="text-xs">Queue a notification job through the admin API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent && (
              <Alert variant="info">Notification job queued successfully.</Alert>
            )}
            {send.isError && (
              <Alert variant="error">Failed to send notification. Please try again.</Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notification-audience">Audience</Label>
              <select
                id="notification-audience"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="ALL">All users</option>
                <option value="USER">Specific user</option>
                <option value="USERS">Multiple users</option>
              </select>
            </div>

            {audience !== "ALL" && (
              <div className="space-y-1.5">
                <Label htmlFor="notification-user-id">User ID</Label>
                <Input
                  id="notification-user-id"
                  placeholder="Enter user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notification-type">Type</Label>
              <Input
                id="notification-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notification-title">Title</Label>
              <Input
                id="notification-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notification-body">Body</Label>
              <Input
                id="notification-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={() =>
                void send.mutateAsync({
                  audience: audience as SendNotificationInput["audience"],
                  type,
                  title,
                  body,
                  ...(audience === "ALL" ? {} : { userId }),
                })
              }
              disabled={send.isPending}
            >
              {send.isPending ? (
                <>
                  <Spinner className="size-4" /> Sending…
                </>
              ) : (
                "Send notification"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Jobs + recent notifications */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Jobs</CardTitle>
              <CardDescription className="text-xs">Recent notification jobs and delivery state.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center">
                        <Spinner className="mx-auto size-4" />
                      </TableCell>
                    </TableRow>
                  ) : (jobs.data?.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No notification jobs yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (jobs.data?.data ?? []).map((job) => {
                      const { variant, className } = jobStatusProps(job.status);
                      return (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-xs">{job.type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {job.audience?.toLowerCase() ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={variant} className={cn("text-xs capitalize", className)}>
                              {job.status.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {timeAgo(job.scheduledAt)}
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
              <CardDescription className="text-xs">Last delivered to users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              {recentNotifications.isLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner className="size-4" />
                </div>
              ) : (recentNotifications.data?.data ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No recent notifications.</p>
              ) : (
                (recentNotifications.data?.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-xl bg-muted/40 p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.body}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
