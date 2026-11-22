"use client";

import { useCallback, useEffect, useState } from "react";

import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { sessionFetch } from "@lean/next-bff/client";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface ListResponse {
  data: Notification[];
  meta: { total: number; unread: number };
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await sessionFetch("/api/notifications?page=1&limit=20");

    if (!response.ok) {
      setError("Could not load notifications");
      return;
    }

    const body = (await response.json()) as ListResponse;
    setItems(body.data);
    setUnread(body.meta.unread);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string): Promise<void> {
    await sessionFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    await load();
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader title="Notifications" description={`${unread} unread`} />
      <FormError message={error} />
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className={cn(item.readAt && "opacity-60")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {item.title}
                <Badge variant="secondary">{item.type}</Badge>
              </CardTitle>
              <CardDescription>
                {item.body}
                <span className="mt-2 block text-xs">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </CardDescription>
              <CardAction>
                {item.readAt ? (
                  <Badge variant="outline">Read</Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => void markRead(item.id)}>
                    Mark read
                  </Button>
                )}
              </CardAction>
            </CardHeader>
          </Card>
        ))}
      </div>
    </main>
  );
}
