import {
  allSeedPermissionNames,
  RESOURCE_SCOPE,
  ROLE_NAMES,
} from '@repo/api-core';

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

function scopeForPermission(name: string): 'platform' | 'organization' {
  const dot = name.indexOf('.');
  if (dot === -1) return 'platform';
  const resource = name.slice(0, dot);
  return (RESOURCE_SCOPE as Record<string, 'platform' | 'organization'>)[resource] ?? 'platform';
}

export const PERMISSION_SEED_ENTRIES: PermissionSeedEntry[] =
  allSeedPermissionNames().map((name) => ({
    name,
    description: name,
    isSystem: true,
    scope: scopeForPermission(name),
  }));
