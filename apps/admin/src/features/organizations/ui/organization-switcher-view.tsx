"use client";

import { Badge } from "@repo/web-ui/badge";
import { Dropdown, type DropdownItem } from "@repo/web-ui/dropdown";
import { Spinner } from "@repo/web-ui/spinner";
import { Building2, Check, ChevronDown } from "lucide-react";

import type { OrganizationSwitcherViewModel } from "@/features/organizations/model/organizations.types";

/**
 * Presentational org switcher for the shell header. Read-only badge for
 * single-org users; responsive dropdown when the user belongs to several workspaces.
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
      <Badge
        variant="outline"
        className="hidden max-w-40 gap-1.5 text-muted-foreground sm:inline-flex"
      >
        <Building2 className="size-3 shrink-0" />
        <span className="truncate">{label}</span>
      </Badge>
    );
  }

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-md border border-border/60 px-2 sm:px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Switch organization"
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Spinner className="size-3 shrink-0" />
          ) : (
            <Building2 className="size-3 shrink-0" />
          )}
          <span className="hidden max-w-32 truncate sm:inline">{label}</span>
          <ChevronDown className="size-3 shrink-0" />
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
