import type { TransactionExecutor } from "@repo/api-runtime";

import type { ListUsersQuery } from "../users.types";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  avatarFileId: string | null;
  status: "PENDING" | "ACTIVE" | "BLOCKED";
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
  status?: "PENDING" | "ACTIVE" | "BLOCKED";
  emailVerifiedAt?: Date | null;
  mustChangePassword?: boolean;
  deletedAt?: Date | null;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface UsersListResult {
  rows: UserRecord[];
  total: number;
}

export interface UsersCoreListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: "PENDING" | "ACTIVE" | "BLOCKED";
  sort: readonly { field: string; order: "asc" | "desc" }[];
  /** Restrict results to this set of user ids. Empty/undefined = no filter. */
  candidateUserIds?: readonly string[];
}

export interface UsersRepositoryPort {
  create(values: CreateUserInput, executor?: TransactionExecutor): Promise<UserRecord>;
  findById(userId: string, executor?: TransactionExecutor): Promise<UserRecord | null>;
  findByEmail(email: string, executor?: TransactionExecutor): Promise<UserRecord | null>;
  update(
    userId: string,
    values: UpdateUserInput,
    executor?: TransactionExecutor,
  ): Promise<UserRecord | null>;
  softDelete(userId: string, executor?: TransactionExecutor): Promise<UserRecord | null>;
  list(params: UsersCoreListQuery, executor?: TransactionExecutor): Promise<UsersListResult>;
}

export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");
