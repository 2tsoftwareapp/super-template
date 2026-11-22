"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { adminFetch } from "@/lib/admin-fetch";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
}

interface ListResponse {
  data: User[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const send = (path: string, method: string, body?: unknown) =>
  adminFetch(path, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", displayName: "", password: "" });

  const load = useCallback(async () => {
    const response = await adminFetch("/api/users?page=1&limit=20");

    if (!response.ok) {
      setError("Could not load users");
      return;
    }

    const body = (await response.json()) as ListResponse;
    setUsers(body.data);
    setTotal(body.meta.total);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    const response = await send("/api/users", "POST", form);

    if (!response.ok) {
      const body = (await response.json()) as { error?: { message?: string } };
      setError(body.error?.message ?? "Could not create the user");
      return;
    }

    setForm({ email: "", displayName: "", password: "" });
    await load();
  }

  async function act(response: Response, fallback: string): Promise<void> {
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      setError(body.error?.message ?? fallback);
    }

    await load();
  }

  async function toggleStatus(user: User): Promise<void> {
    const next = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";

    if (
      next === "BLOCKED" &&
      !window.confirm(`Block ${user.email}? They are signed out at once.`)
    ) {
      return;
    }

    setError(null);
    await act(
      await send(`/api/users/${user.id}/status`, "PATCH", { status: next }),
      "Could not change the status",
    );
  }

  async function remove(user: User): Promise<void> {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) {
      return;
    }

    setError(null);
    await act(await send(`/api/users/${user.id}`, "DELETE"), "Could not delete the user");
  }

  return (
    <main style={{ maxWidth: 860, margin: "6vh auto", fontFamily: "system-ui", padding: 24 }}>
      <h1 style={{ fontSize: 26 }}>Users ({total})</h1>

      <form onSubmit={onCreate} style={{ display: "flex", gap: 8, margin: "20px 0" }}>
        <input
          placeholder="email"
          type="email"
          required
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          style={{ padding: 8 }}
        />
        <input
          placeholder="display name"
          required
          value={form.displayName}
          onChange={(event) => setForm({ ...form, displayName: event.target.value })}
          style={{ padding: 8 }}
        />
        <input
          placeholder="password (min 8)"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          style={{ padding: 8 }}
        />
        <button type="submit" style={{ padding: "8px 14px" }}>
          Create
        </button>
      </form>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{user.email}</td>
              <td>{user.displayName}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => void toggleStatus(user)}>
                  {user.status === "ACTIVE" ? "Block" : "Activate"}
                </button>
                <button type="button" onClick={() => void remove(user)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
