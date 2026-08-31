"use client";

import { Avatar } from "@repo/web-ui/avatar";
import { Dropdown, type DropdownItem } from "@repo/web-ui/dropdown";
import { LogOut, Search, Settings, Shield } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getResourceForPath } from "@/features/_plugin-resources/admin-resources";
import { OrganizationSwitcher } from "@/features/organizations/ui/organization-switcher";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useI18n } from "@/lib/i18n";

import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

interface TopHeaderProps {
  displayName: string;
  onSignOut: () => void;
}

function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useI18n();
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items from pathname
  const crumbs: { label: string; href?: string }[] = [];
  let accumulatedPath = "";

  for (const segment of segments) {
    accumulatedPath += `/${segment}`;
    const resource = getResourceForPath(accumulatedPath);

    if (resource?.path === accumulatedPath) {
      // This is a registered resource — use its translated label
      crumbs.push({
        label: t(`nav.${resource.id}`),
        href: accumulatedPath,
      });
    } else if (segment !== segments[0]) {
      // Skip locale segment, add sub-page as non-linked
      crumbs.push({ label: segment });
    }
  }

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage className="text-xs font-medium">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href} className="text-xs">
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function TopHeader({ displayName, onSignOut }: TopHeaderProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const matched = getResourceForPath(pathname);
  const Icon = matched.icon;

  return (
    <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-lg px-3 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground" />
        <Separator orientation="vertical" className="h-5 bg-border/40" />
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-3.5 text-primary" />
          </div>
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <OrganizationSwitcher />
        <LanguageSwitcher />
        <ThemeToggle />

        <button
          type="button"
          onClick={() => {
            // Trigger command menu via keyboard event
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
            );
          }}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          aria-label="Search"
        >
          <Search className="size-4" />
        </button>

        <Dropdown
          align="end"
          trigger={
            <button
              type="button"
              className="ml-1 flex size-8 items-center justify-center rounded-full transition-all duration-300 hover:ring-2 hover:ring-primary/40 hover:scale-105"
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
