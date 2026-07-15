import { z } from "zod";

export function createUserSchema(actorRoles: string[], availableRoleIds: string[]) {
  return z
    .object({
      displayName: z
        .string()
        .trim()
        .min(2, "Display name must be at least 2 characters")
        .max(120, "Display name must be at most 120 characters"),
      email: z.email("Enter a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      roleId: z
        .string()
        .min(1, "Role is required")
        .refine((val) => availableRoleIds.includes(val), {
          message: "Selected role is not available",
        }),
      organizationId: z.string().uuid().optional().or(z.literal("")),
    })
    .refine(
      (data) => {
        if (!data.organizationId) return true;
        return Boolean(data.roleId);
      },
      { message: "Role is required", path: ["roleId"] },
    );
}

export type CreateUserForm = z.infer<ReturnType<typeof createUserSchema>>;

export const profileSchema = z.object({
  email: z.email(),
  displayName: z.string().min(2),
});

export type ProfileForm = z.infer<typeof profileSchema>;
