"use client";

import { useState } from "react";
import { errorMessage, sendJson } from "@lean/next-bff/client";

import { FormError } from "@/components/form-error";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserCreateForm, type NewUser } from "@/components/users/user-create-form";
import { useUserList } from "@/components/users/use-user-list";
import { UsersTable, type User } from "@/components/users/users-table";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { users, total, load } = useUserList(search, setError);

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
    run(sendJson("/api/users", "POST", user), "Could not create the user");

  const toggleStatus = (user: User) =>
    void run(
      sendJson(`/api/users/${user.id}/status`, "PATCH", {
        status: user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
      }),
      "Could not change the status",
    );

  const remove = (user: User) =>
    void run(sendJson(`/api/users/${user.id}`, "DELETE"), "Could not delete the user");

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
        <CardContent className="space-y-4">
          <Input
            type="search"
            aria-label="Search users"
            placeholder="Search by email or name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <UsersTable users={users} onToggleStatus={toggleStatus} onDelete={remove} />
        </CardContent>
      </Card>
    </main>
  );
}
