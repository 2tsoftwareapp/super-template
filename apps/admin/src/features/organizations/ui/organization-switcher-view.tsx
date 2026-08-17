"use client";

import { Badge } from "@repo/web-ui/badge";
import { Dropdown, type DropdownItem } from "@repo/web-ui/dropdown";
import { Spinner } from "@repo/web-ui/spinner";
import { Building2, Check, ChevronDown } from "lucide-react";

import type { OrganizationSwitcherViewModel } from "@/features/organizations/model/organizations.types";

/**
 * Presentational org switcher for the shell header. Read-only badge for
 * single-org users; dropdown when the user belongs to several workspaces.
 */
export function OrganizationSwitcherView({
  organizationId,
  label,
  items,
  isSwitching,
  onSwitch,
}: OrganizationSwitcherViewModel) {
  if (!organizationId) {
    return null;
  }

  if (items.length <= 1) {
    return (
      <Badge variant="outline" className="hidden gap-1.5 text-muted-foreground sm:inline-flex">
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
          disabled={isSwitching}
        >
          {isSwitching ? <Spinner className="size-3" /> : <Building2 className="size-3" />}
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
            onClick: () => onSwitch(org.id),
          }) satisfies DropdownItem,
      )}
    />
  );
}
