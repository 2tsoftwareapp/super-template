import { z } from "zod";

/** Scalar or flat object values accepted by the settings PATCH endpoint. */
const settingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
]);

export const updateSettingInputSchema = z.object({
  key: z.string().trim().min(1, "Setting key is required"),
  value: settingValueSchema,
});

export type UpdateSettingInput = z.infer<typeof updateSettingInputSchema>;
