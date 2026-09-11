import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_PRIMARY } from "@repo/database-runtime";
import { eq, inArray, sql } from "drizzle-orm";

import type { CreatePermissionValues } from "../application/ports/access-control.repository.port";

import { permissions, rolePermissions } from "./persistence";

@Injectable()
export class AccessControlPermissionPersistence {
  constructor(@Inject(DATABASE_PRIMARY) private readonly database: DatabaseClient) {}

  async findAllPermissions(executor: DatabaseExecutor = this.database) {
    return executor.select().from(permissions).orderBy(permissions.name);
  }

  async findPermissionsForRoleIds(roleIds: string[], executor: DatabaseExecutor = this.database) {
    if (roleIds.length === 0) return [];
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

  async findPermissionsByIds(permissionIds: string[], executor: DatabaseExecutor = this.database) {
    if (permissionIds.length === 0) return [];
    return executor.select().from(permissions).where(inArray(permissions.id, permissionIds));
  }

  async findPermissionsByNames(
    permissionNames: string[],
    executor: DatabaseExecutor = this.database,
  ) {
    if (permissionNames.length === 0) return [];
    return executor.select().from(permissions).where(inArray(permissions.name, permissionNames));
  }

  async findPermissionById(permissionId: string, executor: DatabaseExecutor = this.database) {
    const [permission] = await executor
      .select()
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);
    return permission ?? null;
  }

  async findPermissionIdsForRole(roleId: string, executor: DatabaseExecutor = this.database) {
    const rows = await executor
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    return rows.map((row) => row.permissionId);
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
      .onConflictDoUpdate({ target: permissions.name, set: { scope: sql`EXCLUDED.scope` } });
    return this.findPermissionsByNames(
      permissionValues.map((p) => p.name),
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
      await executor
        .insert(rolePermissions)
        .values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
    }
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
      .set({ ...values, updatedAt: new Date() })
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
}
