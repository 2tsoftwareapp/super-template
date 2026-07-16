export type RoleScope = 'platform' | 'organization';

export interface PermissionView {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  scope: 'platform' | 'organization';
}

export interface RoleView {
  id: string;
  organizationId: string | null;
  name: string;
  description: string | null;
  scope: RoleScope;
  isSystem: boolean;
  permissions: PermissionView[];
}

export interface AccessProfileView {
  roles: string[];
  permissions: string[];
}

export interface CreateRoleCommand {
  name: string;
  description?: string | null;
  organizationId?: string | null;
  permissionIds: string[];
}

export interface UpdateRoleCommand {
  name?: string;
  description?: string | null;
  permissionIds?: string[];
}

export interface CreatePermissionCommand {
  name: string;
  description?: string | null;
}

export interface UpdatePermissionCommand {
  name?: string;
  description?: string | null;
}
