import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { FIXED_ROLE_NAMES, ROLE_NAMES } from "@repo/api-runtime";
import { DATABASE } from "@repo/database-runtime";
import { and, count, eq, ilike, inArray, isNotNull, isNull, or, type SQL } from "drizzle-orm";

import type { RoleRecord } from "../application/ports/access-control.repository.port";

import { roles } from "./persistence";

@Injectable()
export class AccessControlRolePersistence {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async findRolesPaginated(
    params: {
      page: number;
      limit: number;
      organizationId?: string | undefined;
      search?: string | undefined;
      scope?: "platform" | "organization" | undefined;
      manageableByOrg?: string | null | undefined;
    },
    executor: DatabaseExecutor = this.database,
  ): Promise<{ rows: RoleRecord[]; total: number }> {
    const filters: SQL[] = [];
    if (params.manageableByOrg !== undefined) {
      const filtersOr: SQL[] = [
        and(eq(roles.name, ROLE_NAMES.USER), isNull(roles.organizationId))!,
      ];
      if (params.manageableByOrg !== null) {
        filtersOr.push(
          and(eq(roles.name, ROLE_NAMES.ADMIN), eq(roles.organizationId, params.manageableByOrg))!,
        );
        filtersOr.push(
          and(eq(roles.isSystem, false), eq(roles.organizationId, params.manageableByOrg))!,
        );
      }
      filters.push(or(...filtersOr)!);
    }
    if (params.organizationId) filters.push(eq(roles.organizationId, params.organizationId));
    if (params.scope === "platform") filters.push(isNull(roles.organizationId));
    else if (params.scope === "organization") filters.push(isNotNull(roles.organizationId));
    if (params.search) {
      filters.push(
        or(
          ilike(roles.name, `%${params.search}%`),
          ilike(roles.description ?? "", `%${params.search}%`),
        )!,
      );
    }
    const where = filters.length > 0 ? and(...filters) : undefined;
    const offset = (params.page - 1) * params.limit;
    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(roles)
        .where(where)
        .orderBy(roles.name, roles.id)
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(roles).where(where),
    ]);
    return { rows, total: Number(totals[0]?.total ?? 0) };
  }

  async findAllRoles(executor: DatabaseExecutor = this.database) {
    return executor.select().from(roles).orderBy(roles.name);
  }

  async findManageableRolesForActor(
    organizationId: string | null,
    includePlatformRoles: boolean,
    executor: DatabaseExecutor = this.database,
  ) {
    if (includePlatformRoles) {
      return executor
        .select()
        .from(roles)
        .where(and(inArray(roles.name, [...FIXED_ROLE_NAMES]), isNull(roles.organizationId)))
        .orderBy(roles.name);
    }
    return executor
      .select()
      .from(roles)
      .where(
        or(
          and(eq(roles.name, ROLE_NAMES.USER), isNull(roles.organizationId)),
          organizationId
            ? and(eq(roles.name, ROLE_NAMES.ADMIN), eq(roles.organizationId, organizationId))
            : undefined,
          organizationId
            ? and(eq(roles.isSystem, false), eq(roles.organizationId, organizationId))
            : undefined,
        ),
      )
      .orderBy(roles.name);
  }

  async findRoleById(roleId: string, executor: DatabaseExecutor = this.database) {
    const [role] = await executor.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    return role ?? null;
  }

  async findRoleByIdWithLock(roleId: string, executor: DatabaseExecutor) {
    const [role] = await executor
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .for("update")
      .limit(1);
    return role ?? null;
  }

  async findRolesByIds(roleIds: string[], executor: DatabaseExecutor = this.database) {
    if (roleIds.length === 0) return [];
    return executor.select().from(roles).where(inArray(roles.id, roleIds));
  }

  async findRolesByNames(roleNames: string[], executor: DatabaseExecutor = this.database) {
    if (roleNames.length === 0) return [];
    return executor.select().from(roles).where(inArray(roles.name, roleNames));
  }

  async findRoleByName(
    name: string,
    organizationId: string | null = null,
    executor: DatabaseExecutor = this.database,
  ) {
    const [role] = await executor
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.name, name),
          organizationId ? eq(roles.organizationId, organizationId) : isNull(roles.organizationId),
        ),
      )
      .limit(1);
    return role ?? null;
  }

  async ensureRoles(
    roleValues: {
      name: string;
      description: string;
      organizationId?: string | null;
      isSystem?: boolean;
    }[],
    executor: DatabaseExecutor = this.database,
  ) {
    await executor.insert(roles).values(roleValues).onConflictDoNothing();
    return this.findRolesByNames(
      roleValues.map((role) => role.name),
      executor,
    );
  }

  async createRole(values: typeof roles.$inferInsert, executor: DatabaseExecutor = this.database) {
    const [role] = await executor.insert(roles).values(values).onConflictDoNothing().returning();
    return role ?? null;
  }

  async updateRole(
    roleId: string,
    values: Partial<typeof roles.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [role] = await executor
      .update(roles)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(roles.id, roleId))
      .returning();
    return role ?? null;
  }

  async deleteRole(roleId: string, executor: DatabaseExecutor = this.database): Promise<void> {
    await executor.delete(roles).where(eq(roles.id, roleId));
  }

  async ensureOrganizationSystemRole(
    name: string,
    description: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [role] = await executor
      .insert(roles)
      .values({ name, description, organizationId, isSystem: true })
      .onConflictDoNothing()
      .returning();
    if (role) return role;
    const existing = await this.findRoleByName(name, organizationId, executor);
    if (!existing)
      throw new Error(`Failed to resolve system role "${name}" for organization ${organizationId}`);
    return existing;
  }
}
