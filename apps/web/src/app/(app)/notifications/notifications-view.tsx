"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useQueryStates } from "nuqs";

import type { NotificationsListResponse } from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { webFetch } from "@/lib/http";
import {
  buildNotificationsListPath,
  notificationsSearchParams,
  notificationUnreadOptions,
} from "@/lib/search-params";

export function NotificationsView() {
  const [filters, setFilters] = useQueryStates(notificationsSearchParams);
  useNotificationStream();
  const notifications = useQuery({
    queryKey: ["notifications", filters],
    queryFn: () =>
      webFetch<NotificationsListResponse>(buildNotificationsListPath(filters)),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Inbox
        </Badge>
        <h1 className="text-4xl font-semibold">Notifications</h1>
      </div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
          <CardDescription>
            Scope the inbox by type and unread state.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              placeholder="Filter by type"
              value={filters.type}
              onChange={(event) =>
                void setFilters({
                  type: event.target.value,
                  page: 1,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Unread</Label>
            <Select
              value={String(filters.unread)}
              onValueChange={(value) =>
                void setFilters({
                  unread: value === "true",
                  page: 1,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unread" />
              </SelectTrigger>
              <SelectContent>
                {notificationUnreadOptions.map((option) => (
                  <SelectItem
                    key={String(option.value)}
                    value={String(option.value)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {notifications.isLoading ? (
          <Card className="border-border">
            <CardContent className="flex min-h-40 items-center justify-center">
              <Spinner className="size-5 text-primary" />
            </CardContent>
          </Card>
        ) : notifications.data?.data.length ? (
          notifications.data.data.map((notification) => (
            <Card key={notification.id} className="border-border">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-2">
                  <CardTitle className="text-lg">
                    {notification.title}
                  </CardTitle>
                  <CardDescription>{notification.body}</CardDescription>
                </div>
                <Badge variant="outline">{notification.type}</Badge>
              </CardHeader>
            </Card>
          ))
        ) : (
          <Card className="border-border">
            <CardContent className="py-10">
              <Empty className="border-border bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Bell className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No notifications</EmptyTitle>
                  <EmptyDescription>
                    Try another filter or create activity in the API.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          Page {notifications.data?.meta.page ?? filters.page} of{" "}
          {notifications.data?.meta.totalPages ?? 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() =>
              void setFilters({ page: Math.max(1, filters.page - 1) })
            }
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              (notifications.data?.meta.totalPages ?? filters.page) <=
              filters.page
            }
            onClick={() => void setFilters({ page: filters.page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
