"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { useCallback, useState } from "react";

import type { MailFilters } from "@/features/mail/model/mail.search-params";

import {
  parseMailFilters,
  serializeMailFilters,
} from "@/features/mail/model/mail.search-params";

export function useMailFilters(
  searchParams: URLSearchParams,
  pathname: string,
  router: AppRouterInstance,
) {
  const [filters, setFilters] = useState<MailFilters>(() =>
    parseMailFilters(new URLSearchParams(searchParams.toString())),
  );

  const updateFilter = useCallback(
    (key: keyof MailFilters, value: string | number) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (key !== "page") next.page = 1;
        const qs = serializeMailFilters(next);
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        return next;
      });
    },
    [pathname, router],
  );

  return { filters, updateFilter };
}
