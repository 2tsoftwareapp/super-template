"use client";

import { Avatar } from "@repo/web-ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/web-ui/breadcrumb";
import { Dropdown, type DropdownItem } from "@repo/web-ui/dropdown";
import { Separator } from "@repo/web-ui/separator";
import { SidebarTrigger } from "@repo/web-ui/sidebar";
import { LogOut, Search, Settings, Shield } from "lucide-react";
import { Fragment } from "react";

import { getResourceForPath } from "@/features/_plugin-resources/admin-resources";
import { OrganizationSwitcher } from "@/features/organizations/ui/organization-switcher";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useI18n } from "@/lib/i18n";

import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

interface TopHeaderProps {
  displayName: string;
  onSignOut: () => void;
}

function getSegmentLabel(
  segment: string,
  accumulatedPath: string,
  t: (key: string) => string,
): string {
  // Dynamic identifier patterns (UUIDs, prefixed IDs, numeric IDs) — skip translation
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return `#${segment.slice(0, 8)}`;
  }
  if (/^[a-z]{2,5}_[a-zA-Z0-9]+$/.test(segment) || /^\d+$/.test(segment)) {
    return `#${segment}`;
  }

  const resource = getResourceForPath(accumulatedPath);
  if (resource?.path === accumulatedPath) {
    try {
      const translated = t(`nav.${resource.id}`);
      if (translated && !translated.startsWith("nav.")) {
        return translated;
      }
    } catch {
      // Fall through to resource label
    }
    return resource.label;
  }

  // Check direct translation under nav.*
  try {
    const translatedNav = t(`nav.${segment}`);
    if (translatedNav && !translatedNav.startsWith("nav.")) {
      return translatedNav;
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback: title-case kebab / snake string
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useI18n();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href?: string }[] = [];

  if (segments.length === 0) {
    let dashboardLabel = "Dashboard";
    try {
      const translated = t("nav.dashboard");
      if (translated && !translated.startsWith("nav.")) {
        dashboardLabel = translated;
      }
    } catch {
      // ignore
    }
    crumbs.push({ label: dashboardLabel, href: "/" });
  } else {
    let accumulatedPath = "";
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!;
      accumulatedPath += `/${segment}`;
      const label = getSegmentLabel(segment, accumulatedPath, t);
      if (i < segments.length - 1) {
        crumbs.push({ label, href: accumulatedPath });
      } else {
        crumbs.push({ label });
      }
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href ?? `${index}-${crumb.label}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage className="text-xs font-medium">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={crumb.href} />} className="text-xs">
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
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
    <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-3 backdrop-blur-lg md:px-6">
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
              className="ml-1 flex size-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-primary/40"
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
