import {
  File,
  LayoutDashboard,
  type LucideIcon,
  Mail,
  Megaphone,
  Settings,
  Shield,
  Table2,
  Ticket,
  Users,
  Workflow,
} from "lucide-react";

export interface AdminResourceConfig {
  id: string;
  label: string;
  group: "Overview" | "People" | "Operations" | "System";
  path: string;
  icon: LucideIcon;
  features: ("list" | "create" | "show" | "edit")[];
  permissions?: string[];
  queryKey: string;
}

export const adminResources: AdminResourceConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    group: "Overview",
    path: "/",
    icon: LayoutDashboard,
    features: ["list"],
    queryKey: "admin-dashboard",
  },
  {
    id: "users",
    label: "Users",
    group: "People",
    path: "/users",
    icon: Users,
    features: ["list", "create", "show", "edit"],
    permissions: ["users.read"],
    queryKey: "admin-users",
  },
  {
    id: "roles",
    label: "Roles",
    group: "People",
    path: "/roles",
    icon: Table2,
    features: ["list"],
    permissions: ["roles.read"],
    queryKey: "admin-roles",
  },
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
    permissions: ["notifications.read"],
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
  {
    id: "settings",
    label: "Settings",
    group: "System",
    path: "/settings",
    icon: Settings,
    features: ["list", "edit"],
    permissions: ["settings.read"],
    queryKey: "admin-settings",
  },
];

export const adminResourceGroups = [
  "Overview",
  "People",
  "Operations",
  "System",
] as const;

export const adminAppPermissions = Array.from(
  new Set(adminResources.flatMap((resource) => resource.permissions ?? [])),
);

export function getResourceForPath(pathname: string) {
  return (
    [...adminResources]
      .sort((a, b) => b.path.length - a.path.length)
      .find((resource) => {
        if (resource.path === "/") return pathname === "/";
        return (
          pathname === resource.path || pathname.startsWith(`${resource.path}/`)
        );
      }) ?? adminResources[0]!
  );
}

export function canAccessResource(
  resource: AdminResourceConfig,
  permissions: string[],
) {
  if (!resource.permissions?.length) return true;
  return resource.permissions.some((permission) =>
    permissions.includes(permission),
  );
}

export function hasAdminAppAccess(input: {
  roles?: string[];
  permissions?: string[];
}) {
  const roles = input.roles ?? [];
  const permissions = input.permissions ?? [];

  if (roles.includes("SUPER_ADMIN")) {
    return true;
  }

  return adminAppPermissions.some((permission) =>
    permissions.includes(permission),
  );
}

export function getFirstAccessibleResourcePath(permissions: string[]) {
  const firstProtectedResource = adminResources.find(
    (resource) =>
      resource.permissions?.length && canAccessResource(resource, permissions),
  );

  return (
    firstProtectedResource?.path ??
    adminResources.find((resource) => canAccessResource(resource, permissions))
      ?.path ??
    "/"
  );
}
