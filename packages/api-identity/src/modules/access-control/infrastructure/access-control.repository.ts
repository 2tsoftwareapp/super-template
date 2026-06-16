import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DATABASE } from '@repo/api-database/database.provider';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database/database.types';
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from '@repo/api-database/schema';

@Injectable()
export class AccessControlRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async findAllRoles(executor: DatabaseExecutor = this.database) {
    return executor.select().from(roles).orderBy(roles.name);
  }

  async findRolesByIds(
    roleIds: string[],
    executor: DatabaseExecutor = this.database,
  ) {
    if (roleIds.length === 0) {
      return [];
    }

    return executor.select().from(roles).where(inArray(roles.id, roleIds));
  }

  async findRolesByNames(
    roleNames: string[],
    executor: DatabaseExecutor = this.database,
  ) {
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

    return executor
      .select()
      .from(permissions)
      .where(inArray(permissions.name, permissionNames));
  }

  async ensureRoles(
    roleValues: Array<{ name: string; description: string }>,
    executor: DatabaseExecutor = this.database,
  ) {
    await executor.insert(roles).values(roleValues).onConflictDoNothing();
    return this.findRolesByNames(
      roleValues.map((role) => role.name),
      executor,
    );
  }

  async ensurePermissions(
    permissionValues: Array<{ name: string; description: string }>,
    executor: DatabaseExecutor = this.database,
  ) {
    await executor
      .insert(permissions)
      .values(permissionValues)
      .onConflictDoNothing();
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
    await executor
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    if (permissionIds.length > 0) {
      await executor.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      );
    }
  }

  async replaceUserRoles(
    userId: string,
    roleIds: string[],
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    await executor.delete(userRoles).where(eq(userRoles.userId, userId));

    if (roleIds.length > 0) {
      await executor.insert(userRoles).values(
        roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      );
    }
  }

  async findRoleNamesForUser(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const rows = await executor
      .select({
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return rows.map((row) => row.roleName);
  }

  async findPermissionNamesForUser(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const rows = await executor
      .select({
        permissionName: permissions.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));

    return [...new Set(rows.map((row) => row.permissionName))];
  }

  async findRoleNamesForUsers(
    userIds: string[],
    executor: DatabaseExecutor = this.database,
  ) {
    if (userIds.length === 0) {
      return [];
    }

    return executor
      .select({
        userId: userRoles.userId,
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(userRoles.userId, userIds));
  }

  async findRoleByName(
    name: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [role] = await executor
      .select()
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);
    return role ?? null;
  }
}
