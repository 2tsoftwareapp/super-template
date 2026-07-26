import { allSeedPermissionNames, PLATFORM_RESOURCES, ROLE_NAMES } from '@repo/api-core';

export interface RoleSeedEntry {
  name: string;
  description: string;
  isSystem: boolean;
}

export interface PermissionSeedEntry {
  name: string;
  description: string;
  isSystem: boolean;
  scope: 'platform' | 'organization';
}

export const ROLE_SEED_ENTRIES: RoleSeedEntry[] = [
  {
    name: ROLE_NAMES.SUPER_ADMIN,
    description: 'Platform owner role',
    isSystem: true,
  },
  { name: ROLE_NAMES.ADMIN, description: 'Administrative role', isSystem: true },
  { name: ROLE_NAMES.USER, description: 'Standard user role', isSystem: true },
];

const PLATFORM_SCOPE_CATALOG = new Set<string>(PLATFORM_RESOURCES as readonly string[]);

function scopeForPermission(name: string): 'platform' | 'organization' {
  const dot = name.indexOf('.');
  return dot !== -1 && PLATFORM_SCOPE_CATALOG.has(name.slice(0, dot))
    ? 'platform'
    : 'organization';
}

export const PERMISSION_SEED_ENTRIES: PermissionSeedEntry[] =
  allSeedPermissionNames().map((name) => ({
    name,
    description: name,
    isSystem: true,
    scope: scopeForPermission(name),
  }));
