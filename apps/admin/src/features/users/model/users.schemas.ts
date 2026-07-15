import { z } from "zod";

import { canAssignRole, isOrganizationRole } from "@/lib/roles";

export function createUserSchema(actorRoles: string[], availableRoleNames: string[]) {
  const allowedRoles = availableRoleNames.filter((role) =>
    canAssignRole(actorRoles, role),
  );

  return z
    .object({
      displayName: z
        .string()
        .trim()
        .min(2, "Display name must be at least 2 characters")
        .max(120, "Display name must be at most 120 characters"),
      email: z.email("Enter a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      role: z
        .string()
        .refine((val) => allowedRoles.includes(val), {
          message: `Must be one of: ${allowedRoles.join(", ")}`,
        }),
      organizationId: z.string().uuid().optional().or(z.literal("")),
    })
    .refine(
      (data) => {
        if (!isOrganizationRole(data.role)) return true;
        return Boolean(data.organizationId);
      },
      { message: "Organization is required for this role", path: ["organizationId"] },
    );
}

export type CreateUserForm = z.infer<ReturnType<typeof createUserSchema>>;

export const profileSchema = z.object({
  email: z.email(),
  displayName: z.string().min(2),
});

export type ProfileForm = z.infer<typeof profileSchema>;
