import { z } from "zod";

import { IMPORT_TYPES } from "./imports.constants";

const importTypeValues = IMPORT_TYPES.map((option) => option.value) as [string, ...string[]];

export const createImportSchema = z.object({
  fileId: z.string().uuid("Enter a valid file UUID"),
  type: z.enum(importTypeValues),
});

export type CreateImportFormValues = z.infer<typeof createImportSchema>;
