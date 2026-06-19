export const ACTION = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type Action = (typeof ACTION)[keyof typeof ACTION];

export const ALL_ACTIONS = Object.values(ACTION);

export function perm(resource: string, action: Action): string {
  return `${resource}.${action}`;
}

export function hasPermission(
  userPermissions: string[],
  resource: string,
  action: Action,
): boolean {
  return userPermissions.includes(perm(resource, action));
}
