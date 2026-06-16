import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { ListResponse, NotificationJobDto, NotificationDto, SendNotificationInput } from "../lib/types";

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

  const send = useMutation({
    mutationFn: (input: SendNotificationInput) =>
      webFetch<{ data: NotificationJobDto }>("/api/v1/admin/notifications", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
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
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Compose</CardTitle>
            <CardDescription>Queue a notification job through the admin API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-audience">Audience</Label>
              <select id="notification-audience" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={audience} onChange={(event) => setAudience(event.target.value)}>
                <option value="ALL">ALL</option>
                <option value="USER">USER</option>
                <option value="USERS">USERS</option>
              </select>
            </div>
            {audience !== "ALL" ? (
              <div className="space-y-2">
                <Label htmlFor="notification-user-id">User ID</Label>
                <Input id="notification-user-id" value={userId} onChange={(event) => setUserId(event.target.value)} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="notification-type">Type</Label>
              <Input id="notification-type" value={type} onChange={(event) => setType(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-title">Title</Label>
              <Input id="notification-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-body">Body</Label>
              <Input id="notification-body" value={body} onChange={(event) => setBody(event.target.value)} />
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
              {send.isPending ? "Sending..." : "Send notification"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Jobs</CardTitle>
            <CardDescription>Recent notification jobs and current delivery state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(jobs.data?.data ?? []).map((job) => (
              <div key={job.id} className="rounded-2xl border border-border p-4">
                <p className="font-medium">{job.type}</p>
                <p className="text-sm text-muted-foreground">
                  {job.status} · {job.scheduledAt}
                </p>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-border p-4">
              <p className="mb-3 text-sm font-medium">Recent notifications</p>
              <div className="space-y-2">
                {(recentNotifications.data?.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-xl bg-muted/40 p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
