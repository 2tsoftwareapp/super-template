import type { DatabaseExecutor } from '@repo/api-database';

import type { UsersRepository } from '../infrastructure/users.repository';
import type { ListUsersQuery } from './users.types';

export type UserRecord = NonNullable<
  Awaited<ReturnType<UsersRepository['findById']>>
>;

export interface UsersListResult {
  rows: UserRecord[];
  total: number;
}

export interface UsersRepositoryPort {
  create(
    values: Parameters<UsersRepository['create']>[0],
    executor?: DatabaseExecutor,
  ): ReturnType<UsersRepository['create']>;
  findById(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<UserRecord | null>;
  update(
    userId: string,
    values: Parameters<UsersRepository['update']>[1],
    executor?: DatabaseExecutor,
  ): ReturnType<UsersRepository['update']>;
  softDelete(
    userId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<UsersRepository['softDelete']>;
  list(
    params: ListUsersQuery,
    executor?: DatabaseExecutor,
  ): Promise<UsersListResult>;
  assertEmailAvailable(
    email: string,
    executor?: DatabaseExecutor,
    currentUserId?: string,
  ): Promise<void>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
