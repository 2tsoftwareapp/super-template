import { Inject, Injectable } from '@nestjs/common';
import { hash } from 'argon2';

import {
  ImportExportAdapter,
  ImportExportRowContext,
  type ImportValidationError,
  type TransactionExecutor,
} from '@repo/api-core';

import { USERS_REPOSITORY, type UsersRepositoryPort } from '@repo/api-identity';

export interface UserRow {
  id?: string;
  email: string;
  displayName: string;
  password?: string | undefined;
  avatarUrl?: string | null | undefined;
  status?: string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
}

@Injectable()
export class UsersImportExportAdapter implements ImportExportAdapter<UserRow> {
  readonly type = 'users';
  readonly csvHeader = ['email', 'displayName', 'password', 'avatarUrl'];

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
  ) {}

  async listForExport(params: {
    organizationId: string;
    ownerId: string;
  }): Promise<UserRow[]> {
    const result = await this.usersRepository.list({
      page: 1,
      limit: 10000,
      organizationId: params.organizationId,
      sort: [{ field: 'createdAt', order: 'asc' }],
    });

    return result.rows.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    }));
  }

  toCsvRow(row: UserRow): string[] {
    return [
      row.email,
      row.displayName,
      '', // Password is never exported
      row.avatarUrl ?? '',
    ];
  }

  parseCsvRecord(record: Record<string, string>): UserRow {
    return {
      email: record.email?.trim() ?? '',
      displayName: record.displayName?.trim() ?? '',
      password: record.password?.trim() || undefined,
      avatarUrl: record.avatarUrl?.trim() || undefined,
    };
  }

  validateRow(row: UserRow): string | null {
    if (!row.email) {
      return 'Email is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      return 'Email must be a valid email address';
    }

    if (!row.displayName) {
      return 'Display name is required';
    }

    if (row.displayName.length < 2 || row.displayName.length > 100) {
      return 'Display name must be between 2 and 100 characters';
    }

    if (!row.password) {
      return 'Password is required';
    }

    if (row.password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    return null;
  }

  async importRow(
    row: UserRow,
    context: ImportExportRowContext,
    executor?: TransactionExecutor,
  ): Promise<void> {
    const passwordHash = await hash(row.password ?? '');

    await this.usersRepository.create(
      {
        email: row.email,
        passwordHash,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        mustChangePassword: true,
      },
      executor,
    );
  }
}
