import type { TransactionExecutor } from "@repo/api-kernel";
import type { OrganizationMembership } from "@repo/feature-organizations/contracts";

import { Inject, Injectable } from "@nestjs/common";
import { hashPassword } from "@repo/api-kernel";
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "@repo/feature-access-control/contracts";
import { ORGANIZATION_MEMBERSHIP } from "@repo/feature-organizations/contracts";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";
import { randomBytes } from "node:crypto";

import type { ImportExportAdapter, ImportExportRowContext } from "../../public/contracts";

export interface UserRow {
  id?: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null | undefined;
  status?: string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
}

@Injectable()
export class UsersImportExportAdapter implements ImportExportAdapter<UserRow> {
  readonly type = "users";
  readonly csvHeader = ["email", "displayName", "avatarUrl"];
  readonly importPermissions = ["users.create"];
  readonly exportPermissions = ["users.read"];

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
  ) {}

  async listForExport(params: {
    organizationId: string;
    ownerId: string;
    limit?: number;
  }): Promise<UserRow[]> {
    const allRows: UserRow[] = [];
    let page = 1;
    const pageSize = 1000;

    // Resolve organization member IDs for scoped export
    const candidateUserIds = await this.membership.findUserIdsForOrganization(
      params.organizationId,
    );

    while (true) {
      const result = await this.usersRepository.list({
        page,
        limit: pageSize,
        sort: [{ field: "createdAt", order: "asc" }],
        candidateUserIds,
      });

      for (const user of result.rows) {
        allRows.push({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          status: user.status,
          emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
        });

        if (params.limit !== undefined && allRows.length >= params.limit) {
          return allRows;
        }
      }

      if (allRows.length >= result.total) break;
      page++;
    }

    return allRows;
  }

  toCsvRow(row: UserRow): string[] {
    return [row.email, row.displayName, row.avatarUrl ?? ""];
  }

  parseCsvRecord(record: Record<string, string>): UserRow {
    return {
      email: record.email?.trim() ?? "",
      displayName: record.displayName?.trim() ?? "",
      avatarUrl: record.avatarUrl?.trim() ?? undefined,
    };
  }

  validateRow(row: UserRow): string | null {
    if (!row.email) {
      return "Email is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      return "Email must be a valid email address";
    }

    if (!row.displayName) {
      return "Display name is required";
    }

    if (row.displayName.length < 2 || row.displayName.length > 100) {
      return "Display name must be between 2 and 100 characters";
    }

    return null;
  }

  async importRow(
    row: UserRow,
    context: ImportExportRowContext,
    executor?: TransactionExecutor,
  ): Promise<void> {
    const temporaryPassword = randomBytes(32).toString("hex");
    const passwordHash = await hashPassword(temporaryPassword);

    const user = await this.usersRepository.create(
      {
        email: row.email,
        passwordHash,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl ?? null,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        mustChangePassword: true,
      },
      executor,
    );

    await this.membership.addMember(
      {
        organizationId: context.organizationId,
        userId: user.id,
        role: "MEMBER",
      },
      executor,
    );

    const role = await this.accessControlRepository.findRoleByName("USER", null, executor);

    if (role) {
      // The default USER role is platform-scoped (roles.organization_id = NULL), and
      // `check_user_role_scope` rejects any assignment whose organization_id differs
      // from the role's own scope. Assign it in platform scope like self-registration
      // does; organization access is granted separately above via addMember.
      await this.accessControlRepository.assignUserRole(user.id, role.id, null, executor);
    }
  }
}
