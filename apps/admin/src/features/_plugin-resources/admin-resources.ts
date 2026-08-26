import {
  composeAdminResources,
  type AdminResourceConfig as KernelAdminResourceConfig,
} from "@repo/web-utils/admin-resource";
import { LayoutDashboard, type LucideIcon } from "lucide-react";

import { identityAdminResources } from "@/features/_plugin-resources/identity-admin";
import { platformAdminResources } from "@/features/_plugin-resources/platform-admin";

export type AdminResourceConfig = KernelAdminResourceConfig<LucideIcon>;

/** App-shell overview entry — not owned by a feature plugin. */
const dashboardResource: AdminResourceConfig = {
  id: "dashboard",
  label: "Dashboard",
  group: "Overview",
  path: "/",
  icon: LayoutDashboard,
  features: ["list"],
  queryKey: "admin-dashboard",
};

export const adminResources: AdminResourceConfig[] = composeAdminResources([
  [dashboardResource],
  identityAdminResources,
  platformAdminResources,
]);

export const adminResourceGroups = ["Overview", "People", "Operations", "System"] as const;

export const adminAppPermissions = Array.from(
  new Set(adminResources.flatMap((resource) => resource.permissions ?? [])),
);

export function getResourceForPath(pathname: string) {
  return (
    [...adminResources]
      .sort((a, b) => b.path.length - a.path.length)
      .find((resource) => {
        if (resource.path === "/") return pathname === "/";
        return pathname === resource.path || pathname.startsWith(`${resource.path}/`);
      }) ?? adminResources[0]!
  );
}

export function canAccessResource(resource: AdminResourceConfig, permissions: string[]) {
  if (!resource.permissions?.length) return true;
  return resource.permissions.some((permission) => permissions.includes(permission));
}

export function hasAdminAppAccess(input: { roles?: string[]; permissions?: string[] }) {
  const roles = input.roles ?? [];
  const permissions = input.permissions ?? [];

  if (roles.includes("SUPER_ADMIN")) {
    return true;
  }

  return adminAppPermissions.some((permission) => permissions.includes(permission));
}

export function getFirstAccessibleResourcePath(permissions: string[]) {
  const firstProtectedResource = adminResources.find(
    (resource) => resource.permissions?.length && canAccessResource(resource, permissions),
  );

  return (
    firstProtectedResource?.path ??
    adminResources.find((resource) => canAccessResource(resource, permissions))?.path ??
    "/"
  );
}
