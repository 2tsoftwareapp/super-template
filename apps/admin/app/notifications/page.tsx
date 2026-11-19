"use client";

import { useCallback, useEffect, useState } from "react";

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
    const response = await fetch("/api/notifications?page=1&limit=20");

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
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    await load();
  }

  return (
    <main style={{ maxWidth: 760, margin: "6vh auto", fontFamily: "system-ui", padding: 24 }}>
      <h1 style={{ fontSize: 26 }}>Notifications {unread > 0 ? `(${unread} unread)` : ""}</h1>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
              opacity: item.readAt ? 0.6 : 1,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <strong>{item.title}</strong>
              <span style={{ color: "#666", fontSize: 12 }}>{item.type}</span>
            </div>
            <p style={{ margin: "6px 0" }}>{item.body}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#888", fontSize: 12 }}>
                {new Date(item.createdAt).toLocaleString()}
              </span>
              {item.readAt ? (
                <span style={{ color: "#2e7d32", fontSize: 12 }}>Read</span>
              ) : (
                <button type="button" onClick={() => void markRead(item.id)}>
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
