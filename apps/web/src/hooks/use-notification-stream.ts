"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { NotificationDto } from "@/lib/api-types";

const notificationStreamEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.unknown()).nullable().optional(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

const parseNotificationEvent = (payload: string): NotificationDto | null => {
  try {
    const parsed: unknown = JSON.parse(payload);
    const result = notificationStreamEventSchema.safeParse(parsed);

    if (!result.success) {
      return null;
    }

    return {
      id: result.data.id,
      userId: result.data.userId,
      type: result.data.type,
      title: result.data.title,
      body: result.data.body,
      data: result.data.data ?? undefined,
      readAt: result.data.readAt ?? undefined,
      createdAt: result.data.createdAt ?? new Date().toISOString(),
    } as unknown as NotificationDto;
  } catch {
    return null;
  }
};

export function useNotificationStream(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") {
      return;
    }

    const source = new EventSource("/api/notifications/stream");

    source.onmessage = (event) => {
      const payload = typeof event.data === "string" ? event.data : "";
      const notification = parseNotificationEvent(payload);

      if (!notification) {
        return;
      }

      toast(notification.title, { description: notification.body });

      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard-notifications-unread"],
      });
    };

    return () => {
      source.close();
    };
  }, [enabled, queryClient]);
}
