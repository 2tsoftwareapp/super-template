import { allSeedPermissionNames, ROLE_NAMES, scopeForPermission } from "@repo/api-core";

export interface RoleSeedEntry {
  name: string;
  description: string;
  isSystem: boolean;
}

export interface PermissionSeedEntry {
  name: string;
  description: string;
  isSystem: boolean;
  scope: "platform" | "organization";
}

export const ROLE_SEED_ENTRIES: RoleSeedEntry[] = [
  {
    name: ROLE_NAMES.SUPER_ADMIN,
    description: "Platform owner role",
    isSystem: true,
  },
  { name: ROLE_NAMES.ADMIN, description: "Administrative role", isSystem: true },
  { name: ROLE_NAMES.USER, description: "Standard user role", isSystem: true },
];

export const PERMISSION_SEED_ENTRIES: PermissionSeedEntry[] = allSeedPermissionNames().map(
  (name) => ({
    name,
    description: name,
    isSystem: true,
    scope: scopeForPermission(name),
  }),
);
