export type PermissionScope = 'platform' | 'organization';

/**
 * Authoritative scope catalog: every resource involved in role grants must
 * declare its scope here. A resource not listed causes scopeForResource to
 * return 'platform' (fail closed).
 */
export const RESOURCE_SCOPE = {
  settings: 'platform',
  audit: 'platform',
  mail: 'platform',
  jobs: 'platform',
  users: 'organization',
  roles: 'organization',
  notifications: 'organization',
  files: 'organization',
  attachments: 'organization',
  imports: 'organization',
  exports: 'organization',
  activities: 'organization',
} as const satisfies Record<string, PermissionScope>;

export type CatalogResource = keyof typeof RESOURCE_SCOPE;

export function scopeForResource(resource: string): PermissionScope {
  return (RESOURCE_SCOPE as Record<string, PermissionScope>)[resource] ?? 'platform';
}

export function scopeForPermission(name: string): PermissionScope {
  const dot = name.indexOf('.');
  return dot !== -1 ? scopeForResource(name.slice(0, dot)) : 'platform';
}

export function getPlatformResources(): string[] {
  return Object.entries(RESOURCE_SCOPE)
    .filter(([, s]) => s === 'platform')
    .map(([r]) => r);
}

export function getOrganizationResources(): string[] {
  return Object.entries(RESOURCE_SCOPE)
    .filter(([, s]) => s === 'organization')
    .map(([r]) => r);
}
