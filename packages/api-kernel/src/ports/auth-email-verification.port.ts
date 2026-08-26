import type { TransactionExecutor } from "../types/transaction-executor";

export interface AuthEmailVerification {
  /**
   * Persist a verification token and enqueue the verify-email outbox message.
   * Implemented by feature-auth; consumed by feature-users without AuthDataModule.
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
