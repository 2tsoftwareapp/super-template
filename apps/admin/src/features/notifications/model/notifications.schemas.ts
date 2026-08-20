import { z } from "zod";

/**
 * Pure notification-compose contract: shared by the RHF form (ui) and the send
 * mutation input builder. Framework-free (no React / HTTP / router).
 */
export const notificationComposeSchema = z
  .object({
    audience: z.enum(["ALL", "USER", "USERS"]),
    userId: z.string(),
    userIds: z.string(),
    type: z.string().min(1, "Enter a notification type"),
    title: z.string().min(1, "Enter a title"),
    body: z.string().min(1, "Enter a body"),
  })
  .superRefine((value, ctx) => {
    if (value.audience === "USER" && !value.userId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userId"],
        message: "Enter the target user ID",
      });
    }
    if (value.audience === "USERS" && !value.userIds.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userIds"],
        message: "Enter at least one user ID",
      });
    }
  });

export type NotificationComposeFormValues = z.infer<typeof notificationComposeSchema>;
