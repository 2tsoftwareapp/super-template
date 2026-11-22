"use client";

import { useCallback, useEffect, useState } from "react";

import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCreateForm, type NewUser } from "@/components/users/user-create-form";
import { UsersTable, type User } from "@/components/users/users-table";
import { adminFetch } from "@/lib/admin-fetch";
import { errorMessage } from "@/lib/error-message";

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

  async function run(request: Promise<Response>, fallback: string): Promise<boolean> {
    setError(null);
    const response = await request;

    if (!response.ok) {
      setError(await errorMessage(response, fallback));
    }

    await load();
    return response.ok;
  }

  const create = (user: NewUser) =>
    run(send("/api/users", "POST", user), "Could not create the user");

  const toggleStatus = (user: User) =>
    void run(
      send(`/api/users/${user.id}/status`, "PATCH", {
        status: user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
      }),
      "Could not change the status",
    );

  const remove = (user: User) =>
    void run(send(`/api/users/${user.id}`, "DELETE"), "Could not delete the user");

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader title={`Users (${total})`} description="Accounts that can sign in to the API." />
      <Card>
        <CardHeader>
          <CardTitle>New user</CardTitle>
        </CardHeader>
        <CardContent>
          <UserCreateForm onCreate={create} />
        </CardContent>
      </Card>
      <FormError message={error} />
      <Card>
        <CardContent>
          <UsersTable users={users} onToggleStatus={toggleStatus} onDelete={remove} />
        </CardContent>
      </Card>
    </main>
  );
}
