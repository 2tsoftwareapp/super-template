"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useCallback, useState } from "react";

import type { Filters } from "../model/mail-schemas";

import { parseFilters } from "../model/mail-schemas";

export function useMailFilters(
  searchParams: URLSearchParams,
  pathname: string,
  router: AppRouterInstance,
) {
  const [filters, setFilters] = useState<Filters>(() =>
    parseFilters(new URLSearchParams(searchParams.toString())),
  );

  const updateFilter = useCallback(
    (key: keyof Filters, value: string | number) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (key !== "page") next.page = 1;
        const sp = new URLSearchParams();
        if (next.status) sp.set("status", next.status);
        if (next.templateKey) sp.set("templateKey", next.templateKey);
        if (next.page > 1) sp.set("page", String(next.page));
        const qs = sp.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        return next;
      });
    },
    [pathname, router],
  );

  return { filters, updateFilter };
}
