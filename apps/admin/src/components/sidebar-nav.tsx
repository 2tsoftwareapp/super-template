"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  adminResourceGroups,
  adminResources,
  canAccessResource,
} from "@/features/_plugin-resources/admin-resources";
import { Link, usePathname } from "@/i18n/navigation";
import { useI18n } from "@/lib/i18n";

export function SidebarNav({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <>
      {adminResourceGroups.map((group) => {
        const resources = adminResources.filter(
          (r) => r.group === group && canAccessResource(r, permissions),
        );
        if (resources.length === 0) return null;

        return (
          <SidebarGroup key={group}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {t(`nav.groups.${group}`)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {resources.map((resource) => {
                  const Icon = resource.icon;
                  const isActive =
                    resource.path === "/"
                      ? pathname === "/"
                      : pathname === resource.path || pathname.startsWith(`${resource.path}/`);

                  return (
                    <SidebarMenuItem key={resource.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={t(`nav.${resource.id}`)}
                        render={<Link href={resource.path} />}
                        className="gap-2.5"
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{t(`nav.${resource.id}`)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
