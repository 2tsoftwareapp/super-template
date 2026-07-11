import { z } from "zod";

export interface MfaStatus {
  data: { enabled: boolean };
}

export interface MfaSetupResponse {
  data: { secret: string; otpauthUrl: string };
}

export interface MfaConfirmResponse {
  data: { recoveryCodes: string[] };
}

export interface MfaDisableResponse {
  data: { success: boolean };
}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
