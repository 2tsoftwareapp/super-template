import { z } from "zod";

/**
 * Pure send-mail form contract: shared by the RHF form (ui) and the send
 * mutation input. Framework-free (no React / HTTP / router).
 */
export const sendMailSchema = z.object({
  templateKey: z.string().min(1, "Select a template"),
  to: z.string().email("Enter a valid recipient email"),
  idempotencyKey: z.string().optional(),
  variables: z.record(z.string(), z.string()),
});

export type SendMailFormValues = z.infer<typeof sendMailSchema>;
