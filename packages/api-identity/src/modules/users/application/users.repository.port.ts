import type { DatabaseExecutor } from '@repo/api-database';

import type { ListUsersQuery } from './users.types';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  avatarFileId: string | null;
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  emailVerifiedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string | null;
  avatarFileId?: string | null;
  status?: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  emailVerifiedAt?: Date | null;
  deletedAt?: Date | null;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface UsersListResult {
  rows: UserRecord[];
  total: number;
}

export interface UsersRepositoryPort {
  create(
    values: CreateUserInput,
    executor?: DatabaseExecutor,
  ): Promise<UserRecord>;
  findById(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<UserRecord | null>;
  findByEmail(
    email: string,
    executor?: DatabaseExecutor,
  ): Promise<UserRecord | null>;
  update(
    userId: string,
    values: UpdateUserInput,
    executor?: DatabaseExecutor,
  ): Promise<UserRecord | null>;
  softDelete(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<UserRecord | null>;
  list(
    params: ListUsersQuery,
    executor?: DatabaseExecutor,
  ): Promise<UsersListResult>;
  isUserInOrganization(
    userId: string,
    organizationId: string,
    executor?: DatabaseExecutor,
  ): Promise<boolean>;
  assertEmailAvailable(
    email: string,
    executor?: DatabaseExecutor,
    currentUserId?: string,
  ): Promise<void>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
