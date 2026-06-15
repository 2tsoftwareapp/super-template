"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import type { UsersListResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

export default function UsersPage() {
  const session = useSession();
  const users = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      webFetch<UsersListResponse>("/api/bff/admin/users?page=1&limit=20"),
    enabled: session.data?.data.permissions.includes("users.read") ?? false,
  });

  if (!(session.data?.data.permissions.includes("users.read") ?? false)) {
    return (
      <Card>
        <h1 className="text-3xl font-semibold">403</h1>
        <p className="mt-3 text-sm text-neutral-500">
          Your account does not include `users.read`.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">
          Admin
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Users</h1>
      </div>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Roles</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.data.map((user) => (
              <tr
                key={user.id}
                className="border-t border-black/6 dark:border-white/6"
              >
                <td className="px-4 py-3 font-medium">
                  <Link href={`/users/${user.id}`}>{user.displayName}</Link>
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.status}</td>
                <td className="px-4 py-3">{user.roles.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
