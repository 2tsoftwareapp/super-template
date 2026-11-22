"use client";

import { useCallback, useEffect, useState } from "react";
import { sessionFetch } from "@lean/next-bff/client";

import type { User } from "./users-table";

interface ListResponse {
  data: User[];
  meta: { total: number };
}

const SEARCH_DELAY_MS = 250;

/** First page of users matching `search`; reloads 250 ms after the last keystroke. */
export function useUserList(search: string, onError: (message: string) => void) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const query = new URLSearchParams({ page: "1", limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    const response = await sessionFetch(`/api/users?${query}`);

    if (!response.ok) {
      onError("Could not load users");
      return;
    }

    const body = (await response.json()) as ListResponse;
    setUsers(body.data);
    setTotal(body.meta.total);
  }, [search, onError]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [load]);

  return { users, total, load };
}
