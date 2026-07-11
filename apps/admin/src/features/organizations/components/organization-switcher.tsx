"use client";

import { Badge } from "@repo/web-core/components/badge";
import { Dropdown, type DropdownItem } from "@repo/web-core/components/dropdown";
import { Spinner } from "@repo/web-core/components/spinner";
import { Building2, Check, ChevronDown } from "lucide-react";

import { useAdminSession } from "@/components/admin-guard";

import { useSwitchOrganizationMutation } from "../use-organizations-mutations";
import { useMyOrganizationsQuery } from "../use-organizations-queries";

// Shows the active tenant in the shell header. Read-only badge for
// single-org users; a switcher dropdown when the user belongs to several.
export function OrganizationSwitcher() {
  const { organizationId } = useAdminSession();
  const organizations = useMyOrganizationsQuery();
  const switchOrganization = useSwitchOrganizationMutation();

  if (!organizationId) return null;

  const items = organizations.data?.data ?? [];
  const current = items.find((org) => org.id === organizationId);
  const label = current?.name ?? "Organization";

  if (items.length <= 1) {
    return (
      <Badge
        variant="outline"
        className="hidden gap-1.5 text-muted-foreground sm:inline-flex"
      >
        <Building2 className="size-3" />
        {label}
      </Badge>
    );
  }

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          className="hidden h-8 items-center gap-1.5 rounded-md border border-border/60 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          aria-label="Switch organization"
          disabled={switchOrganization.isPending}
        >
          {switchOrganization.isPending ? (
            <Spinner className="size-3" />
          ) : (
            <Building2 className="size-3" />
          )}
          <span className="max-w-32 truncate">{label}</span>
          <ChevronDown className="size-3" />
        </button>
      }
      items={items.map(
        (org) =>
          ({
            label: org.name,
            icon:
              org.id === organizationId ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <span className="size-3.5" />
              ),
            onClick: () => {
              if (org.id !== organizationId) {
                switchOrganization.mutate(org.id);
              }
            },
          }) satisfies DropdownItem,
      )}
    />
  );
}
