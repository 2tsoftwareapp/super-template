import type { ComponentType } from "react";

import { Bell, Building2, File, FolderKanban, LayoutDashboard, Settings } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission?: string;
}

export const clientNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
    permission: "projects.read",
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    permission: "notifications.read",
  },
  {
    href: "/files",
    label: "Files",
    icon: File,
    permission: "files.read",
  },
  {
    href: "/organizations",
    label: "Organizations",
    icon: Building2,
  },
  { href: "/settings/profile", label: "Settings", icon: Settings },
];

export function getPostLoginPath() {
  return "/";
}
