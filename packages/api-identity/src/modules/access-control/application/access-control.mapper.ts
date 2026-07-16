import { isPlatformPermission } from '@repo/api-core';

import type { RoleRecord } from './access-control.repository.port';
import type { PermissionView, RoleView } from './access-control.types';

export class AccessControlMapper {
  toPermissionView(permission: PermissionView): PermissionView {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      isSystem: permission.isSystem,
      scope: isPlatformPermission(permission.name)
        ? 'platform'
        : 'organization',
    };
  }

  toRoleView(role: RoleRecord, permissions: PermissionView[] = []): RoleView {
    return {
      id: role.id,
      organizationId: role.organizationId,
      name: role.name,
      description: role.description,
      scope: role.organizationId ? 'organization' : 'platform',
      isSystem: role.isSystem,
      permissions,
    };
  }
}
