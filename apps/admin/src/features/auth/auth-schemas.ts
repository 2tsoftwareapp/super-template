import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const mfaChallengeSchema = z.object({
  code: z.string().length(6),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type MfaChallengeInput = z.infer<typeof mfaChallengeSchema>;
