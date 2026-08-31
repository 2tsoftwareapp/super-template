"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import {
  Building,
  File,
  LayoutDashboard,
  Mail,
  Megaphone,
  Settings,
  Shield,
  Table2,
  Ticket,
  Users,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  adminResourceGroups,
  adminResources,
  canAccessResource,
} from "@/features/_plugin-resources/admin-resources";
import { useRouter } from "@/i18n/navigation";
import { useI18n } from "@/lib/i18n";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  organizations: Building,
  users: Users,
  roles: Table2,
  "audit-logs": Shield,
  notifications: Megaphone,
  jobs: Workflow,
  mail: Mail,
  files: File,
  imports: Ticket,
  settings: Settings,
};

export function CommandMenu({ permissions }: { permissions: string[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {adminResourceGroups.map((group) => {
          const resources = adminResources.filter(
            (r) => r.group === group && canAccessResource(r, permissions),
          );
          if (resources.length === 0) return null;
          return (
            <CommandGroup key={group} heading={t(`nav.groups.${group}`)}>
              {resources.map((resource) => {
                const Icon = iconMap[resource.id] ?? resource.icon;
                return (
                  <CommandItem
                    key={resource.path}
                    value={`${t(`nav.${resource.id}`)} ${resource.id}`}
                    onSelect={() => runCommand(resource.path)}
                  >
                    <Icon className="mr-2 size-4" />
                    <span>{t(`nav.${resource.id}`)}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
