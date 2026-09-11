import { Inject, Injectable } from "@nestjs/common";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";

import type {
  AuthUserCreateInput,
  AuthUserRecord,
  AuthUserStore,
  AuthUserUpdateInput,
} from "../public/auth-user-store.port";

/**
 * Binds the auth-owned AUTH_USER_STORE port to the users repository so
 * feature-auth never needs users module internals and feature-users never
 * imports feature-auth (package DAG stays one-way).
 */
@Injectable()
export class AuthUserStoreAdapter implements AuthUserStore {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  create(values: AuthUserCreateInput, executor?: unknown): Promise<AuthUserRecord> {
    return this.usersRepository.create(values, executor);
  }

  findById(userId: string, executor?: unknown): Promise<AuthUserRecord | null> {
    return this.usersRepository.findById(userId, executor);
  }

  findByIdStrong(userId: string): Promise<AuthUserRecord | null> {
    return this.usersRepository.findByIdStrong(userId);
  }

  findByEmail(email: string, executor?: unknown): Promise<AuthUserRecord | null> {
    return this.usersRepository.findByEmail(email, executor);
  }

  update(
    userId: string,
    values: AuthUserUpdateInput,
    executor?: unknown,
  ): Promise<AuthUserRecord | null> {
    return this.usersRepository.update(userId, values, executor);
  }
}
