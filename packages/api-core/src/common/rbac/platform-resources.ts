export const PLATFORM_RESOURCES = [
  'settings',
  'audit',
  'mail',
  'jobs',
] as const;

export type PlatformResource = (typeof PLATFORM_RESOURCES)[number];

export function isPlatformResource(resource: string): boolean {
  return (PLATFORM_RESOURCES as readonly string[]).includes(resource);
}

export function isPlatformPermission(permissionName: string): boolean {
  const resource = permissionName.split('.')[0];
  return resource !== undefined && isPlatformResource(resource);
}
