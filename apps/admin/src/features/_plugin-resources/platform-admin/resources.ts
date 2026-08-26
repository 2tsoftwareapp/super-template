import type { AdminResourceConfig } from "@repo/web-utils/admin-resource";
import type { LucideIcon } from "lucide-react";

import { File, Mail, Megaphone, Settings, Shield, Ticket, Workflow } from "lucide-react";

/**
 * Admin-console nav entries owned by the platform feature. Concatenated by the
 * admin app; dropping `@repo/feature-upload` removes these operations/system
 * routes from the shell.
 */
export const settingsAdminResource: AdminResourceConfig<LucideIcon> = {
  id: "settings",
  label: "Settings",
  group: "System",
  path: "/settings",
  icon: Settings,
  features: ["list", "edit"],
  permissions: ["settings.read"],
  queryKey: "admin-settings",
};

export const platformAdminResources: readonly AdminResourceConfig<LucideIcon>[] = [
  {
    id: "audit-logs",
    label: "Audit logs",
    group: "Operations",
    path: "/audit-logs",
    icon: Shield,
    features: ["list"],
    permissions: ["audit.read"],
    queryKey: "admin-audit-logs",
  },
  {
    id: "notifications",
    label: "Notifications",
    group: "Operations",
    path: "/notifications",
    icon: Megaphone,
    features: ["list", "create"],
    permissions: ["notifications.create"],
    queryKey: "admin-notifications",
  },
  {
    id: "jobs",
    label: "Jobs",
    group: "Operations",
    path: "/jobs",
    icon: Workflow,
    features: ["list", "show"],
    permissions: ["jobs.read"],
    queryKey: "admin-jobs",
  },
  {
    id: "mail",
    label: "Mail",
    group: "Operations",
    path: "/mail",
    icon: Mail,
    features: ["list", "show"],
    permissions: ["mail.read"],
    queryKey: "admin-mail",
  },
  {
    id: "files",
    label: "Files",
    group: "Operations",
    path: "/files",
    icon: File,
    features: ["list", "show", "create"],
    permissions: ["files.read"],
    queryKey: "admin-files",
  },
  {
    id: "imports",
    label: "Imports",
    group: "Operations",
    path: "/imports",
    icon: Ticket,
    features: ["list", "create"],
    permissions: ["imports.read"],
    queryKey: "admin-imports",
  },
  settingsAdminResource,
];
