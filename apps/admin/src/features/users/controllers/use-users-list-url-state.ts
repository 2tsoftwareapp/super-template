"use client";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { UsersListParams } from "@/features/users/model/users.types";

import {
  parseUsersListSearchParams,
  serializeUsersListSearchParams,
} from "@/features/users/model/users.search-params";
import { usePathname, useRouter } from "@/i18n/navigation";

interface UseUsersListUrlStateReturn {
  /** Current URL list params (parsed from searchParams). */
  listParams: UsersListParams;
  /** Current search input value (instant, before debounce). */
  searchInput: string;
  /** Set the search input value. */
  setSearchInput: (value: string) => void;
  /** Debounced search value (synced to URL after delay). */
  debouncedSearch: string;
  /** Patch URL list params (merges with current, serializes to URL). */
  patchListParams: (patch: Partial<UsersListParams>) => void;
  /** Final query params = listParams + debounced search. */
  queryParams: UsersListParams;
}

/**
 * Manages the bidirectional sync between URL search params and local state
 * for the users list screen. Extracted from useUsersListController.
 *
 * - Parses URL params into `listParams`
 * - Manages debounced search input
 * - Syncs local state → URL on debounced change
 * - Syncs URL → local on back/forward navigation
 */
export function useUsersListUrlState(): UseUsersListUrlStateReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const listParams = useMemo(() => parseUsersListSearchParams(searchParams), [searchParams]);

  const [searchInput, setSearchInput] = useState(listParams.search);
  const debouncedSearch = useDebouncedValue(searchInput, 500);

  // Sync URL → local (e.g. back/forward, clear filters)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the search input when the URL param changes
    setSearchInput(listParams.search);
  }, [listParams.search]);

  const patchListParams = useCallback(
    (patch: Partial<UsersListParams>) => {
      const next = { ...listParams, ...patch };
      const serialized = serializeUsersListSearchParams(next).toString();

      if (serialized === searchParams.toString()) {
        return;
      }

      router.replace(serialized ? `${pathname}?${serialized}` : pathname);
    },
    [listParams, pathname, router, searchParams],
  );

  // Sync local → URL (debounced search)
  useEffect(() => {
    if (debouncedSearch !== listParams.search) {
      patchListParams({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, listParams.search, patchListParams]);

  const queryParams = useMemo(
    () => ({ ...listParams, search: debouncedSearch }),
    [listParams, debouncedSearch],
  );

  return {
    listParams,
    searchInput,
    setSearchInput,
    debouncedSearch,
    patchListParams,
    queryParams,
  };
}
