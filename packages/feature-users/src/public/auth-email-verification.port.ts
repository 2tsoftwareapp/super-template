import type { TransactionExecutor } from "@repo/api-kernel";

export interface AuthEmailVerification {
  /**
   * Persist a verification token and enqueue the verify-email outbox message.
   * Consumer-owned by feature-users; implemented and bound by feature-auth.
   */
  issueVerificationEmail(
    input: {
      userId: string;
      email: string;
      displayName: string | null;
    },
    executor?: TransactionExecutor,
  ): Promise<void>;
}

export const AUTH_EMAIL_VERIFICATION = Symbol("AUTH_EMAIL_VERIFICATION");
