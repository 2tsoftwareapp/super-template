import type { DatabaseClient, DatabaseExecutor } from "@repo/api-database";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/api-database";
import { organizations, permissions, rolePermissions, roles, userRoles } from "@repo/api-database";
import { and, eq, inArray, isNull, or, type SQL } from "drizzle-orm";

@Injectable()
export class AccessControlAssignmentPersistence {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async findUserIdsForRole(
    roleId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const rows = await executor
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.roleId, roleId));
    return rows.map((row) => row.userId);
  }

  async findUserIdsForPermission(
    permissionId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const rows = await executor
      .select({ userId: userRoles.userId })
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
      const assignedRoles = await executor
        .select()
        .from(roles)
        .where(inArray(roles.id, roleIds))
        .then((rs) =>
          rs.filter(
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
      .select({ roleName: roles.name })
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
      .select({ permissionName: permissions.name })
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
    if (userIds.length === 0) return [];
    const filters = [inArray(userRoles.userId, userIds)];
    if (organizationId === null) filters.push(isNull(userRoles.organizationId));
    else if (organizationId !== undefined)
      filters.push(
        or(isNull(userRoles.organizationId), eq(userRoles.organizationId, organizationId))!,
      );
    return executor
      .select({ userId: userRoles.userId, roleName: roles.name })
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
    if (organizationId === null) filters.push(isNull(userRoles.organizationId));
    else if (organizationId !== undefined)
      filters.push(
        or(isNull(userRoles.organizationId), eq(userRoles.organizationId, organizationId))!,
      );
    const rows = await executor
      .select({ roleId: roles.id })
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
    if (organizationId === null) filters.push(isNull(userRoles.organizationId));
    else if (organizationId !== undefined)
      filters.push(
        or(isNull(userRoles.organizationId), eq(userRoles.organizationId, organizationId))!,
      );
    const rows = await executor
      .select({ roleName: roles.name, roleId: roles.id, organizationId: roles.organizationId })
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
    if (userIds.length === 0) return [];
    const filters = [inArray(userRoles.userId, userIds)];
    if (organizationId === null) filters.push(isNull(userRoles.organizationId));
    else if (organizationId !== undefined)
      filters.push(
        or(isNull(userRoles.organizationId), eq(userRoles.organizationId, organizationId))!,
      );
    return executor
      .select({ userId: userRoles.userId, roleId: roles.id })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(...filters));
  }

  async assignUserRole(
    userId: string,
    roleId: string,
    organizationId: string | null,
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    await executor
      .insert(userRoles)
      .values({ userId, roleId, organizationId })
      .onConflictDoNothing();
  }
}
