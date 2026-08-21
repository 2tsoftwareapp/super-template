"use client";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { parseRolesSearchParams } from "@/features/roles/model/roles.search-params";
import { usePathname, useRouter } from "@/i18n/navigation";

interface UseRolesUrlStateReturn {
  urlPage: number;
  searchInput: string;
  debouncedSearch: string;
  urlScope: "platform" | "organization" | undefined;
  urlOrgId: string | undefined;
  setSearchInput: (value: string) => void;
  patchParams: (patch: Record<string, string | undefined>) => void;
}

/**
 * URL ↔ filter state for the roles list. Extracted from
 * useRolesController to keep the orchestrator under the size budget.
 *
 * Flow:
 *   1. Parse URL params (page/search/scope/organizationId).
 *   2. Local search input with debounce; debounce syncs back to URL.
 *   3. URL → local sync on back/forward navigation.
 */
export function useRolesUrlState(): UseRolesUrlStateReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    page: urlPage,
    search: urlSearch,
    scope: urlScope,
    organizationId: urlOrgId,
  } = parseRolesSearchParams(searchParams);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const lastUrlSearchRef = useRef(urlSearch);
  const syncingFromUrlRef = useRef(false);

  useEffect(() => {
    if (lastUrlSearchRef.current === urlSearch) {
      return;
    }

    lastUrlSearchRef.current = urlSearch;
    syncingFromUrlRef.current = true;
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (syncingFromUrlRef.current) {
      if (debouncedSearch === urlSearch) {
        syncingFromUrlRef.current = false;
      }
      return;
    }

    if (debouncedSearch !== searchInput || debouncedSearch === urlSearch) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      next.set("search", debouncedSearch);
    } else {
      next.delete("search");
    }
    next.delete("page");

    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [debouncedSearch, pathname, router, searchInput, searchParams, urlSearch]);

  const patchParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return {
    urlPage,
    searchInput,
    debouncedSearch,
    urlScope,
    urlOrgId,
    setSearchInput,
    patchParams,
  };
}
