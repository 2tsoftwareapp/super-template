import { uuidParam } from "@repo/web-utils/params";
import { z } from "zod";

/** Route params for `/organizations/[id]` detail pages. */
export const organizationRouteParamsSchema = z.object({
  id: uuidParam,
});

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
});

export type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationForm = CreateOrganizationForm;
