"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { CreateOrganizationForm } from "@/features/organizations/model/organizations.schemas";
import type { OrganizationsListViewModel } from "@/features/organizations/model/organizations.types";

import {
  useCreateOrganizationMutation,
} from "@/features/organizations/api/organizations.mutations";
import { organizationsKeys } from "@/features/organizations/api/organizations.query-keys";
import { useOrganizationsQuery } from "@/hooks/use-organizations-lookup";
import { useRouter } from "@/i18n/navigation";

export type { OrganizationsListViewModel };

/**
 * Orchestration hook for the organizations list screen.
 *
 * Flow:
 *   1. Load admin organization directory (staleTime 5 min).
 *   2. Client-side search filter over name/slug.
 *   3. Create drawer → mutation → invalidate `organizationsKeys.all` + toast on error.
 */
export function useOrganizationsController(): OrganizationsListViewModel {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const organizations = useOrganizationsQuery();
  const createOrg = useCreateOrganizationMutation();

  const filteredOrgs = useMemo(() => {
    const orgs = organizations.data?.data ?? [];
    return orgs.filter(
      (org) =>
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.slug.toLowerCase().includes(search.toLowerCase()),
    );
  }, [organizations.data?.data, search]);

  const noResults = Boolean(search) && filteredOrgs.length === 0;
  const noOrgs = !search && filteredOrgs.length === 0;

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
    search,
    onSearchChange: setSearch,
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
