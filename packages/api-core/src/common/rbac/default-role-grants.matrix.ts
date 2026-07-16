import { ACTION, type Action, perm } from './permission.helpers';
import { ROLE_NAMES, type RoleName } from './role.constants';

export interface ResourceGrant {
  resource: string;
  actions: readonly Action[];
}

export type RoleGrantSpec = readonly ResourceGrant[] | '*';

const CRUD = [ACTION.READ, ACTION.CREATE, ACTION.UPDATE, ACTION.DELETE] as const;
const READ_UPDATE = [ACTION.READ, ACTION.UPDATE] as const;
const READ_CREATE = [ACTION.READ, ACTION.CREATE] as const;
const READ_CREATE_UPDATE = [
  ACTION.READ,
  ACTION.CREATE,
  ACTION.UPDATE,
] as const;

export const DEFAULT_ROLE_GRANTS: Record<RoleName, RoleGrantSpec> = {
  [ROLE_NAMES.SUPER_ADMIN]: '*',
  [ROLE_NAMES.ADMIN]: [
    { resource: 'users', actions: CRUD },
    { resource: 'roles', actions: READ_UPDATE },
    { resource: 'notifications', actions: [ACTION.READ, ACTION.CREATE, ACTION.DELETE] },
    { resource: 'audit', actions: [ACTION.READ] },
    { resource: 'files', actions: CRUD },
    { resource: 'attachments', actions: CRUD },
    { resource: 'jobs', actions: [ACTION.READ, ACTION.UPDATE, ACTION.DELETE] },
    { resource: 'imports', actions: READ_CREATE_UPDATE },
    { resource: 'exports', actions: READ_CREATE },
    { resource: 'activities', actions: [ACTION.READ] },
    { resource: 'mail', actions: [ACTION.READ, ACTION.CREATE] },
  ],
  [ROLE_NAMES.USER]: [
    { resource: 'notifications', actions: [ACTION.READ] },
    { resource: 'files', actions: CRUD },
    { resource: 'attachments', actions: CRUD },
    { resource: 'imports', actions: READ_CREATE_UPDATE },
    { resource: 'exports', actions: READ_CREATE },
    { resource: 'activities', actions: [ACTION.READ] },
  ],
};

export function permissionNamesFromGrantSpec(spec: RoleGrantSpec): string[] {
  if (spec === '*') {
    return allSeedPermissionNames();
  }

  return spec.flatMap((grant) =>
    grant.actions.map((action) => perm(grant.resource, action)),
  );
}

export function allSeedPermissionNames(): string[] {
  const names = new Set<string>();

  for (const roleName of [ROLE_NAMES.ADMIN, ROLE_NAMES.USER] as const) {
    for (const name of permissionNamesFromGrantSpec(
      DEFAULT_ROLE_GRANTS[roleName],
    )) {
      names.add(name);
    }
  }

  return [...names].sort();
}

export function permissionNamesForRole(roleName: RoleName): string[] {
  return permissionNamesFromGrantSpec(DEFAULT_ROLE_GRANTS[roleName]);
}
