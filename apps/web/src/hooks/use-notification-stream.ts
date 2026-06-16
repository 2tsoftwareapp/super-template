"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import type { NotificationDto } from "@/lib/api-types";

const parseNotificationEvent = (payload: string): NotificationDto | null => {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "title" in parsed &&
      "body" in parsed
    ) {
      return parsed as NotificationDto;
    }

    return null;
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
