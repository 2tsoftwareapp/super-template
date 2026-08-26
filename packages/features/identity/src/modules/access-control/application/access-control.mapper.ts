import type { PermissionView, RoleView } from "./access-control.types";
import type { RoleRecord } from "./ports/access-control.repository.port";

export class AccessControlMapper {
  toPermissionView(permission: PermissionView): PermissionView {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      isSystem: permission.isSystem,
      scope: permission.scope,
    };
  }

  toRoleView(role: RoleRecord, permissions: PermissionView[] = []): RoleView {
    return {
      id: role.id,
      organizationId: role.organizationId,
      name: role.name,
      description: role.description,
      scope: role.organizationId ? "organization" : "platform",
      isSystem: role.isSystem,
      permissions,
    };
  }
}
