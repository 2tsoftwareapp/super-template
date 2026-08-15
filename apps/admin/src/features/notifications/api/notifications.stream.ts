"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { notificationsKeys } from "./notifications.query-keys";

/**
 * Subscribes to the notification SSE stream while `enabled` is true. Each event
 * invalidates the recent-inbox and unread-count queries so the screen refreshes
 * in real time without polling. EventSource auto-reconnects on drops.
 */
export function useNotificationStream(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const source = new EventSource("/api/notifications/stream");

    // The backend stream emits unnamed `message` events; invalidate the recent
    // inbox so the list refreshes in real time.
    source.onmessage = () => {
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.recent(),
      });
    };

    return () => {
      source.close();
    };
  }, [enabled, queryClient]);
}
