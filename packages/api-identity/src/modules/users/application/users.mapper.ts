import type { UserRecord } from './users.repository.port';
import type { UserView } from './users.types';

export class UsersMapper {
  toUserView(user: UserRecord, roles: string[], roleIds: string[]): UserView {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      roles,
      roleIds,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
