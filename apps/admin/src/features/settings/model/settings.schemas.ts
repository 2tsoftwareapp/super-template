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

/** Scalar card input: raw JSON text that must parse into a valid setting value. */
/** Scalar card input: raw JSON text that must parse into a valid setting value. */
export const settingScalarInputSchema = z.object({
  value: z.string().refine((raw) => {
    try {
      return settingValueSchema.safeParse(JSON.parse(raw)).success;
    } catch {
      return false;
    }
  }, "Enter a valid JSON value (string, number, boolean, null, or flat object)"),
});
export type SettingScalarInput = z.infer<typeof settingScalarInputSchema>;

/** Object card input: flat record of string/boolean fields (numbers arrive as text). */
export const settingObjectInputSchema = z.object({
  fields: z.record(z.string(), z.union([z.string(), z.boolean()])),
});
export type SettingObjectInput = z.infer<typeof settingObjectInputSchema>;
