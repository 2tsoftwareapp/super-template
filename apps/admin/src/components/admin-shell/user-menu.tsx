"use client";

import { Avatar } from "@repo/web-core/components/avatar";
import { Dropdown, type DropdownItem } from "@repo/web-core/components/dropdown";
import { Tooltip } from "@repo/web-core/components/tooltip";
import { LogOut, Shield } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  collapsed?: boolean;
  displayName: string;
  roles: string;
  onSignOut: () => void;
}

export function UserMenu({
  collapsed,
  displayName,
  roles,
  onSignOut,
}: UserMenuProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className={cn("p-2", collapsed && "flex justify-center")}>
      <Dropdown
        align="start"
        trigger={
          collapsed ? (
            <Tooltip content={displayName} side="right">
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-lg transition-all duration-200 hover:bg-muted/80 hover:scale-105"
                aria-label={displayName}
              >
                <Avatar
                  name={displayName}
                  size="sm"
                  className="ring-1 ring-border/20"
                />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2 text-left transition-all duration-200 hover:bg-muted/80"
            >
              <Avatar
                name={displayName}
                size="sm"
                className="ring-1 ring-border/20"
              />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="truncate text-[10px] text-muted-foreground/80 font-medium mt-0.5">
                  {roles}
                </p>
              </div>
            </button>
          )
        }
        items={[
          {
            label: displayName,
            icon: <Avatar name={displayName} size="sm" />,
          } satisfies DropdownItem,
          { separator: true } satisfies DropdownItem,
          {
            label: t("shell.security"),
            icon: <Shield className="size-3.5" />,
            onClick: () => router.push("/security"),
          } satisfies DropdownItem,
          { separator: true } satisfies DropdownItem,
          {
            label: t("shell.signOut"),
            icon: <LogOut className="size-3.5" />,
            onClick: () => void onSignOut(),
            destructive: true,
          } satisfies DropdownItem,
        ]}
      />
    </div>
  );
}
