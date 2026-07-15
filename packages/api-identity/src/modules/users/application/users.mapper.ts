import type { UserRecord } from './ports/users.repository.port';
import type { RoleAssignment, UserView } from './users.types';

export class UsersMapper {
  toUserView(
    user: UserRecord,
    roles: string[],
    roleIds: string[],
    roleAssignments?: RoleAssignment[],
  ): UserView {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      roles,
      roleIds,
      roleAssignments: roleAssignments ?? roles.map((name, i) => ({
        roleName: name,
        roleId: roleIds[i] ?? '',
        organizationId: null,
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
