"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { Card } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import type { UsersListResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";
import {
  buildAdminUsersListPath,
  sortOrderOptions,
  userSortFieldOptions,
  userStatusOptions,
  usersSearchParams,
} from "@/lib/search-params";

export function UsersView() {
  const session = useSession();
  const [filters, setFilters] = useQueryStates(usersSearchParams);
  const users = useQuery({
    queryKey: ["users", filters],
    queryFn: () => webFetch<UsersListResponse>(buildAdminUsersListPath(filters)),
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
      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))]">
          <input
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(event) =>
              void setFilters({
                search: event.target.value,
                page: 1,
              })
            }
          />
          <select
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            value={filters.status}
            onChange={(event) =>
              void setFilters({
                status: event.target.value as typeof filters.status,
                page: 1,
              })
            }
          >
            {userStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            placeholder="Role name"
            value={filters.role}
            onChange={(event) =>
              void setFilters({
                role: event.target.value,
                page: 1,
              })
            }
          />
          <select
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            value={filters.sortField}
            onChange={(event) =>
              void setFilters({
                sortField: event.target.value as typeof filters.sortField,
              })
            }
          >
            {userSortFieldOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm dark:border-white/10 dark:bg-white/5"
            value={filters.sortOrder}
            onChange={(event) =>
              void setFilters({
                sortOrder: event.target.value as typeof filters.sortOrder,
              })
            }
          >
            {sortOrderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>
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
      <div className="flex items-center justify-between text-sm text-neutral-500">
        <p>
          Page {users.data?.meta.page ?? filters.page} of{" "}
          {users.data?.meta.totalPages ?? 1}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-black/10 px-4 py-2 disabled:opacity-40 dark:border-white/10"
            disabled={filters.page <= 1}
            onClick={() => void setFilters({ page: Math.max(1, filters.page - 1) })}
          >
            Previous
          </button>
          <button
            className="rounded-full border border-black/10 px-4 py-2 disabled:opacity-40 dark:border-white/10"
            disabled={(users.data?.meta.totalPages ?? filters.page) <= filters.page}
            onClick={() => void setFilters({ page: filters.page + 1 })}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
