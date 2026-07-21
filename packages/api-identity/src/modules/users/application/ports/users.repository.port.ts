import type { TransactionExecutor } from '@repo/api-core';

import type { ListUsersQuery } from '../users.types';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  avatarFileId: string | null;
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  emailVerifiedAt: Date | null;
  mustChangePassword: boolean;
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
  mustChangePassword?: boolean;
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
    executor?: TransactionExecutor,
  ): Promise<UserRecord>;
  findById(
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<UserRecord | null>;
  findByEmail(
    email: string,
    executor?: TransactionExecutor,
  ): Promise<UserRecord | null>;
  update(
    userId: string,
    values: UpdateUserInput,
    executor?: TransactionExecutor,
  ): Promise<UserRecord | null>;
  softDelete(
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<UserRecord | null>;
  list(
    params: ListUsersQuery,
    executor?: TransactionExecutor,
  ): Promise<UsersListResult>;
  isUserInOrganization(
    userId: string,
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<boolean>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');