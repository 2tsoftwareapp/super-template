"use client";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { CreateOrganizationForm } from "@/features/organizations/model/organizations.schemas";
import type { OrganizationsListViewModel } from "@/features/organizations/model/organizations.types";

import { useCreateOrganizationMutation } from "@/features/organizations/api/organizations.mutations";
import { organizationsKeys } from "@/features/organizations/api/organizations.query-keys";
import { parseOrganizationsSearchParams } from "@/features/organizations/model/organizations.search-params";
import { useOrganizationsQuery } from "@/hooks/use-organizations-lookup";
import { usePathname, useRouter } from "@/i18n/navigation";

export type { OrganizationsListViewModel };

/**
 * Orchestration hook for the organizations list screen.
 *
 * Flow:
 *   1. Load admin organization directory (staleTime 5 min).
 *   2. Client-side search filter over name/slug, synced to URL `q`.
 *   3. Create drawer → mutation → invalidate `organizationsKeys.all` + toast on error.
 */
export function useOrganizationsController(): OrganizationsListViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { q: urlSearch } = parseOrganizationsSearchParams(
    new URLSearchParams(searchParams.toString()),
  );
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const lastUrlSearchRef = useRef(urlSearch);
  const syncingFromUrlRef = useRef(false);

  useEffect(() => {
    if (lastUrlSearchRef.current === urlSearch) return;
    lastUrlSearchRef.current = urlSearch;
    syncingFromUrlRef.current = true;
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (syncingFromUrlRef.current) {
      if (debouncedSearch === urlSearch) syncingFromUrlRef.current = false;
      return;
    }
    if (debouncedSearch !== searchInput || debouncedSearch === urlSearch) return;

    const next = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");

    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [debouncedSearch, pathname, router, searchInput, searchParams, urlSearch]);

  const organizations = useOrganizationsQuery();
  const createOrg = useCreateOrganizationMutation();

  const filteredOrgs = useMemo(() => {
    const orgs = organizations.data?.data ?? [];
    const q = debouncedSearch.toLowerCase();
    return q
      ? orgs.filter(
          (org) => org.name.toLowerCase().includes(q) || org.slug.toLowerCase().includes(q),
        )
      : orgs;
  }, [organizations.data?.data, debouncedSearch]);

  const noResults = Boolean(debouncedSearch) && filteredOrgs.length === 0;
  const noOrgs = !debouncedSearch && filteredOrgs.length === 0;

  const handleRetry = () => {
    void queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
  };

  const handleCreate = (values: CreateOrganizationForm) => {
    createOrg.mutate(
      { name: values.name },
      {
        onSuccess: () => {
          setDrawerOpen(false);
        },
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      },
    );
  };

  return {
    search: debouncedSearch,
    onSearchChange: setSearchInput,
    organizations: filteredOrgs,
    isLoading: organizations.isLoading,
    isRefreshing: organizations.isFetching,
    isError: organizations.isError,
    onRetry: handleRetry,
    onRefresh: handleRetry,
    noResults,
    noOrgs,
    onNavigate: (orgId) => router.push(`/organizations/${orgId}`),
    drawer: {
      open: drawerOpen,
      onOpen: () => setDrawerOpen(true),
      onClose: () => setDrawerOpen(false),
      onCreate: handleCreate,
      isCreating: createOrg.isPending,
    },
  };
}
