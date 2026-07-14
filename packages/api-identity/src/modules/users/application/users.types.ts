import type { UserSortCriterion } from './user-sort';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED';

export type UserSortField = 'createdAt' | 'displayName' | 'email' | 'status';

export interface UserView {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  roles: string[];
  roleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileCommand {
  displayName?: string;
  avatarUrl?: string | null;
  avatarFileId?: string | null;
}

export interface ListUsersQuery {
  page: number;
  limit: number;
  search?: string;
  status?: UserStatus;
  role?: string;
  organizationId?: string;
  sort: UserSortCriterion[];
}

export type AssignableRoleName = 'ADMIN' | 'USER';

export interface CreateAdminUserCommand {
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string | null;
  status?: UserStatus;
  role?: AssignableRoleName;
  organizationId?: string;
}

export interface UpdateAdminUserCommand {
  email?: string;
  displayName?: string;
  avatarUrl?: string | null;
}
