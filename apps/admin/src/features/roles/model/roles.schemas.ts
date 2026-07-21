import { z } from "zod";

export interface PermissionDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  scope: "platform" | "organization";
}

export interface ManagedRoleDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionDto[];
  organizationId: string | null;
  scope: "platform" | "organization";
}

export interface EditableRole {
  id: string;
  name: string;
  description: string | null;
  permissions: PermissionDto[];
  organizationId: string | null;
}

export const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(80, "Role name must be at most 80 characters"),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string().uuid()).min(1, "Select at least one permission"),
  organizationId: z.string().uuid().optional(),
});

export const createRoleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(80, "Role name must be at most 80 characters"),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string().uuid()).min(1, "Select at least one permission"),
  organizationId: z.string().uuid("Select an organization"),
});

export type RoleForm = z.infer<typeof roleSchema>;
export type CreateRoleForm = z.infer<typeof createRoleFormSchema>;
