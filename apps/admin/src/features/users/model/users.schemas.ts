import { z } from "zod";

import { canAssignRole } from "@/lib/roles";

export const ASSIGNABLE_ROLES = ["USER", "ADMIN"] as const;

export function createUserSchema(actorRoles: string[]) {
  const allowedRoles = ASSIGNABLE_ROLES.filter((role) =>
    canAssignRole(actorRoles, role),
  );

  const isAdminAllowed = allowedRoles.includes("ADMIN");

  return z
    .object({
      displayName: z
        .string()
        .trim()
        .min(2, "Display name must be at least 2 characters")
        .max(120, "Display name must be at most 120 characters"),
      email: z.email("Enter a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      role: z.enum(allowedRoles.length > 0 ? allowedRoles : ["USER"]),
      organizationId: isAdminAllowed
        ? z.string().uuid("Must be a valid organization UUID")
        : z.string().uuid().optional(),
    })
    .refine(
      (data) => data.role !== "ADMIN" || Boolean(data.organizationId),
      { message: "Organization is required when assigning ADMIN", path: ["organizationId"] },
    );
}

export type CreateUserForm = z.infer<ReturnType<typeof createUserSchema>>;

export const profileSchema = z.object({
  email: z.email(),
  displayName: z.string().min(2),
});

export type ProfileForm = z.infer<typeof profileSchema>;
