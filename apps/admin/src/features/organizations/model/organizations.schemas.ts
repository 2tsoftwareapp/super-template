import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
});

export type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationForm = CreateOrganizationForm;
