"use client";

import { Avatar } from "@repo/web-ui/avatar";
import { Button } from "@repo/web-ui/button";
import { Dropdown, type DropdownItem } from "@repo/web-ui/dropdown";
import { ChevronRight, LogOut, Menu, Settings, Shield } from "lucide-react";

import { OrganizationSwitcher } from "@/features/organizations/ui/organization-switcher";
import { useRouter } from "@/i18n/navigation";
import { useI18n } from "@/lib/i18n";

import { LanguageSwitcher } from "./language-switcher";
import { PageTitle } from "./page-title";
import { useSidebar } from "./sidebar-context";
import { ThemeToggle } from "./theme-toggle";

interface TopHeaderProps {
  displayName: string;
  onSignOut: () => void;
  onOpenMobileMenu: () => void;
}

export function TopHeader({ displayName, onSignOut, onOpenMobileMenu }: TopHeaderProps) {
  const { collapsed, setCollapsed } = useSidebar();
  const { t } = useI18n();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/50 backdrop-blur-md px-3 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation"
          className="lg:hidden size-8 text-muted-foreground"
        >
          <Menu className="size-4" />
        </Button>
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="hidden lg:inline-flex size-8 text-muted-foreground"
          >
            <ChevronRight className="size-4" />
          </Button>
        ) : null}
        <PageTitle />
      </div>

      <div className="flex items-center gap-1.5">
        <OrganizationSwitcher />
        <LanguageSwitcher />
        <ThemeToggle />
        <Dropdown
          align="end"
          trigger={
            <button
              type="button"
              className="ml-1.5 flex size-8 items-center justify-center rounded-full transition-all duration-300 hover:ring-2 hover:ring-primary/40 hover:scale-105"
              aria-label={displayName}
            >
              <Avatar name={displayName} size="sm" className="ring-1 ring-border/20" />
            </button>
          }
          items={[
            {
              label: displayName,
              icon: <Avatar name={displayName} size="sm" />,
            } satisfies DropdownItem,
            { separator: true } satisfies DropdownItem,
            {
              label: t("shell.settings"),
              icon: <Settings className="size-3.5" />,
              onClick: () => router.push("/settings"),
            } satisfies DropdownItem,
            {
              label: t("shell.security"),
              icon: <Shield className="size-3.5" />,
              onClick: () => router.push("/security"),
            } satisfies DropdownItem,
            { separator: true } satisfies DropdownItem,
            {
              label: t("shell.signOut"),
              icon: <LogOut className="size-3.5" />,
              onClick: onSignOut,
              destructive: true,
            } satisfies DropdownItem,
          ]}
        />
      </div>
    </header>
  );
}
