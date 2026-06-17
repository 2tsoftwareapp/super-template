import type { ComponentType } from "react";

import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  Settings,
} from "lucide-react";

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
  { href: "/settings/profile", label: "Settings", icon: Settings },
];

export function getPostLoginPath() {
  return "/";
}
