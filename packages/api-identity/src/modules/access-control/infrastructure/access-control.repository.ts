import type { DatabaseClient, DatabaseExecutor } from "@repo/api-database";

import { Inject, Injectable } from "@nestjs/common";
import { FIXED_ROLE_NAMES, ROLE_NAMES } from "@repo/api-core";
import { DATABASE } from "@repo/api-database";
import { organizations, permissions, rolePermissions, roles, userRoles } from "@repo/api-database";
import { and, count, eq, ilike, inArray, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";

import type {
  AccessControlRepositoryPort,
  CreatePermissionValues,
  RoleRecord,
} from "../application/ports/access-control.repository.port";

@Injectable()
export class AccessControlRepository implements AccessControlRepositoryPort {
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

    if (params.organizationId) {
      filters.push(eq(roles.organizationId, params.organizationId));
    }

    if (params.scope === "platform") {
      filters.push(isNull(roles.organizationId));
    } else if (params.scope === "organization") {
      filters.push(isNotNull(roles.organizationId));
    }

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

    return {
      rows: rows,
      total: Number(totals[0]?.total ?? 0),
    };
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

  async findAllPermissions(executor: DatabaseExecutor = this.database) {
    return executor.select().from(permissions).orderBy(permissions.name);
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

  async findPermissionIdsForRole(roleId: string, executor: DatabaseExecutor = this.database) {
    const rows = await executor
      .select({
        permissionId: rolePermissions.permissionId,
      })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    return rows.map((row) => row.permissionId);
  }

  async findPermissionsForRoleIds(roleIds: string[], executor: DatabaseExecutor = this.database) {
    if (roleIds.length === 0) {
      return [];
    }

    return executor
      .select({
        roleId: rolePermissions.roleId,
        id: permissions.id,
        name: permissions.name,
        description: permissions.description,
        isSystem: permissions.isSystem,
        scope: permissions.scope,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds))
      .orderBy(permissions.name);
  }

  async findRolesByIds(roleIds: string[], executor: DatabaseExecutor = this.database) {
    if (roleIds.length === 0) {
      return [];
    }

    return executor.select().from(roles).where(inArray(roles.id, roleIds));
  }

  async findRolesByNames(roleNames: string[], executor: DatabaseExecutor = this.database) {
    if (roleNames.length === 0) {
      return [];
    }

    return executor.select().from(roles).where(inArray(roles.name, roleNames));
  }

  async findPermissionsByNames(
    permissionNames: string[],
    executor: DatabaseExecutor = this.database,
  ) {
    if (permissionNames.length === 0) {
      return [];
    }

    return executor.select().from(permissions).where(inArray(permissions.name, permissionNames));
  }

  async findPermissionsByIds(permissionIds: string[], executor: DatabaseExecutor = this.database) {
    if (permissionIds.length === 0) {
      return [];
    }

    return executor.select().from(permissions).where(inArray(permissions.id, permissionIds));
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
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, roleId))
      .returning();
    return role ?? null;
  }

  async deleteRole(roleId: string, executor: DatabaseExecutor = this.database): Promise<void> {
    await executor.delete(roles).where(eq(roles.id, roleId));
  }

  async ensurePermissions(
    permissionValues: {
      name: string;
      description: string;
      isSystem?: boolean;
      scope: "platform" | "organization";
    }[],
    executor: DatabaseExecutor = this.database,
  ) {
    await executor
      .insert(permissions)
      .values(permissionValues)
      .onConflictDoUpdate({
        target: permissions.name,
        set: { scope: sql`EXCLUDED.scope` },
      });
    return this.findPermissionsByNames(
      permissionValues.map((permission) => permission.name),
      executor,
    );
  }

  async replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    await executor.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    if (permissionIds.length > 0) {
      await executor.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      );
    }
  }

  async findUserIdsForRole(
    roleId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const rows = await executor
      .select({
        userId: userRoles.userId,
      })
      .from(userRoles)
      .where(eq(userRoles.roleId, roleId));

    return rows.map((row) => row.userId);
  }

  async findUserIdsForPermission(
    permissionId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const rows = await executor
      .select({
        userId: userRoles.userId,
      })
      .from(rolePermissions)
      .innerJoin(userRoles, eq(userRoles.roleId, rolePermissions.roleId))
      .where(eq(rolePermissions.permissionId, permissionId));

    return [...new Set(rows.map((row) => row.userId))];
  }

  async replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    // Scoped replace: delete roles only within the given organization scope
    // and insert the new ones. Never delete roles from other orgs.
    if (organizationId === null) {
      await executor
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), isNull(userRoles.organizationId)));
    } else {
      await executor
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.organizationId, organizationId)));
    }

    if (roleIds.length > 0) {
      const assignedRoles = await this.findRolesByIds(roleIds, executor).then((roles) =>
        roles.filter(
          (role) => role.organizationId === null || role.organizationId === organizationId,
        ),
      );

      await executor
        .insert(userRoles)
        .values(
          assignedRoles.map((role) => ({
            userId,
            roleId: role.id,
            organizationId: role.organizationId,
          })),
        )
        .onConflictDoNothing();
    }
  }

  async findRoleNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const filters: SQL[] = [];

    if (organizationId !== undefined) {
      if (organizationId === null) {
        filters.push(isNull(userRoles.organizationId));
        filters.push(isNull(roles.organizationId));
      } else {
        filters.push(
          or(isNull(userRoles.organizationId), eq(userRoles.organizationId, organizationId))!,
        );
        filters.push(or(isNull(roles.organizationId), eq(roles.organizationId, organizationId))!);
      }
    }

    const rows = await executor
      .select({
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .leftJoin(organizations, eq(organizations.id, userRoles.organizationId))
      .where(
        and(
          eq(userRoles.userId, userId),
          ...filters,
          or(isNull(userRoles.organizationId), isNull(organizations.deletedAt)),
        ),
      );

    return rows.map((row) => row.roleName);
  }

  async findPermissionNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const filters: SQL[] = [];

    if (organizationId !== undefined) {
      if (organizationId === null) {
        filters.push(isNull(userRoles.organizationId));
        filters.push(isNull(roles.organizationId));
      } else {
        filters.push(
          or(isNull(userRoles.organizationId), eq(userRoles.organizationId, organizationId))!,
        );
        filters.push(or(isNull(roles.organizationId), eq(roles.organizationId, organizationId))!);
      }
    }

    const rows = await executor
      .select({
        permissionName: permissions.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .leftJoin(organizations, eq(organizations.id, userRoles.organizationId))
      .where(
        and(
          eq(userRoles.userId, userId),
          ...filters,
          or(isNull(userRoles.organizationId), isNull(organizations.deletedAt)),
        ),
      );

    return [...new Set(rows.map((row) => row.permissionName))];
  }

  async findRoleNamesForUsers(
    userIds: string[],
    organizationId?: string | null,
    executor: DatabaseExecutor = this.database,
  ) {
    if (userIds.length === 0) {
      return [];
    }

    const filters = [inArray(userRoles.userId, userIds)];
    if (organizationId === null) {
      filters.push(isNull(userRoles.organizationId));
    } else if (organizationId !== undefined) {
      filters.push(
        or(isNull(userRoles.organizationId), eq(userRoles.organizationId, organizationId))!,
      );
    }

    return executor
      .select({
        userId: userRoles.userId,
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(...filters));
  }

  async findRoleIdsForUser(
    userId: string,
    organizationId?: string | null,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const filters = [eq(userRoles.userId, userId)];
    if (organizationId === null) {
      filters.push(isNull(userRoles.organizationId));
    } else if (organizationId !== undefined) {
      filters.push(
        or(isNull(userRoles.organizationId), eq(userRoles.organizationId, organizationId))!,
      );
    }

    const rows = await executor
      .select({
        roleId: roles.id,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(...filters));

    return rows.map((row) => row.roleId);
  }

  async findRoleAssignmentsForUser(
    userId: string,
    organizationId?: string | null,
    executor: DatabaseExecutor = this.database,
  ): Promise<{ roleName: string; roleId: string; organizationId: string | null }[]> {
    const filters = [eq(userRoles.userId, userId)];
    if (organizationId === null) {
      filters.push(isNull(userRoles.organizationId));
    } else if (organizationId !== undefined) {
      filters.push(
        or(isNull(userRoles.organizationId), eq(userRoles.organizationId, organizationId))!,
      );
    }

    const rows = await executor
      .select({
        roleName: roles.name,
        roleId: roles.id,
        organizationId: roles.organizationId,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(...filters));

    return rows.map((row) => ({
      roleName: row.roleName,
      roleId: row.roleId,
      organizationId: row.organizationId,
    }));
  }

  async findRoleIdsForUsers(
    userIds: string[],
    organizationId?: string | null,
    executor: DatabaseExecutor = this.database,
  ) {
    if (userIds.length === 0) {
      return [];
    }

    const filters = [inArray(userRoles.userId, userIds)];
    if (organizationId === null) {
      filters.push(isNull(userRoles.organizationId));
    } else if (organizationId !== undefined) {
      filters.push(
        or(isNull(userRoles.organizationId), eq(userRoles.organizationId, organizationId))!,
      );
    }

    return executor
      .select({
        userId: userRoles.userId,
        roleId: roles.id,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(...filters));
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

  async findPermissionById(permissionId: string, executor: DatabaseExecutor = this.database) {
    const [permission] = await executor
      .select()
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);
    return permission ?? null;
  }

  async createPermission(
    values: CreatePermissionValues,
    executor: DatabaseExecutor = this.database,
  ) {
    const [permission] = await executor.insert(permissions).values(values).returning();
    return permission ?? null;
  }

  async updatePermission(
    permissionId: string,
    values: Partial<typeof permissions.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [permission] = await executor
      .update(permissions)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(permissions.id, permissionId))
      .returning();
    return permission ?? null;
  }

  async deletePermission(
    permissionId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    await executor.delete(permissions).where(eq(permissions.id, permissionId));
  }

  async ensureOrganizationSystemRole(
    name: string,
    description: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<RoleRecord> {
    const [role] = await executor
      .insert(roles)
      .values({ name, description, organizationId, isSystem: true })
      .onConflictDoNothing()
      .returning();

    if (role) {
      return role;
    }

    const existing = await this.findRoleByName(name, organizationId, executor);
    if (!existing) {
      throw new Error(`Failed to resolve system role "${name}" for organization ${organizationId}`);
    }
    return existing;
  }

  async assignUserRole(
    userId: string,
    roleId: string,
    organizationId: string | null,
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    await executor
      .insert(userRoles)
      .values({
        userId,
        roleId,
        organizationId,
      })
      .onConflictDoNothing();
  }
}
