"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import type { ProjectResponse, UsersListResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";

type UserDetailResponse = ProjectResponse & {
  data: {
    id: string;
    email: string;
    displayName: string;
    status: string;
    roles: string[];
  };
};

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const user = useQuery({
    queryKey: ["user", params.id],
    queryFn: () =>
      webFetch<UserDetailResponse>(`/api/bff/admin/users/${params.id}`),
  });
  const users = useQuery({
    queryKey: ["users-related-projects", params.id],
    queryFn: () =>
      webFetch<UsersListResponse>("/api/bff/admin/users?page=1&limit=5"),
  });

  return (
    <Card>
      <h1 className="text-4xl font-semibold">{user.data?.data.displayName}</h1>
      <p className="mt-3 text-sm text-neutral-500">{user.data?.data.email}</p>
      <p className="mt-2 text-sm text-neutral-500">
        {user.data?.data.roles.join(", ")}
      </p>
      <p className="mt-6 text-xs uppercase tracking-[0.22em] text-neutral-400">
        Related directory size: {users.data?.meta.total ?? 0}
      </p>
    </Card>
  );
}
