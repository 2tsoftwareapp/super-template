import type { ComponentType } from "react";

import { Settings } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission?: string;
}

export const clientNavItems: NavItem[] = [
  { href: "/settings/profile", label: "Settings", icon: Settings },
];

export function getPostLoginPath() {
  return "/";
}
