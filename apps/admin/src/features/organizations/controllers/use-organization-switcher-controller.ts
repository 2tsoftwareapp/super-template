"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { toast } from "sonner";

import type { OrganizationSwitcherViewModel } from "@/features/organizations/model/organizations.types";

import { useAdminSession } from "@/components/admin-guard";
import { useSwitchOrganizationMutation } from "@/features/organizations/api/organizations.mutations";
import { useMyOrganizationsQuery } from "@/hooks/use-organizations-lookup";

export type { OrganizationSwitcherViewModel };

/**
 * Orchestration hook for the shell organization switcher.
 *
 * Flow:
 *   1. Read active tenant from admin session.
 *   2. Load member-only org list (staleTime 5 min).
 *   3. Switch mutation clears cache on success; toast on error.
 */
export function useOrganizationSwitcherController(): OrganizationSwitcherViewModel {
  const { organizationId } = useAdminSession();
  const organizations = useMyOrganizationsQuery();
  const switchOrganization = useSwitchOrganizationMutation();

  const items = organizations.data?.data ?? [];
  const current = items.find((org) => org.id === organizationId);

  const handleSwitch = (nextOrganizationId: string) => {
    if (nextOrganizationId === organizationId) {
      return;
    }
    switchOrganization.mutate(nextOrganizationId, {
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  return {
    organizationId,
    label: current?.name ?? "Organization",
    items,
    isLoading: organizations.isLoading,
    isSwitching: switchOrganization.isPending,
    onSwitch: handleSwitch,
  };
}
