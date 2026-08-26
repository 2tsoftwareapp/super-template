import type { AdminResourceConfig } from "@repo/web-utils/admin-resource";
import type { LucideIcon } from "lucide-react";
import { Building, Table2, Users } from "lucide-react";

/**
 * Admin-console nav entries owned by the identity feature. The admin app
 * concatenates this slice with other feature slices in `admin-resources.ts`.
 * Removing `@repo/feature-identity` from the admin app drops these routes.
 */
export const identityAdminResources: readonly AdminResourceConfig<LucideIcon>[] = [
  {
    id: "organizations",
    label: "Organizations",
    group: "People",
    path: "/organizations",
    icon: Building,
    features: ["list", "create", "show", "edit"],
    queryKey: "admin-organizations",
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
];
