import type { TransactionExecutor } from "../common/types/transaction-executor";

export const PLATFORM_TRANSACTION_PORT = Symbol("PLATFORM_TRANSACTION_PORT");

export interface PlatformTransactionPort {
  /**
   * Executes the provided function within a platform-level database transaction.
   * This bypasses Row Level Security (RLS) policies, allowing operations on global
   * or cross-tenant resources. It should be used ONLY for platform-level actions
   * (e.g. system background jobs, super-admin global exports, generic audit events).
   */
  run<T>(fn: (executor: TransactionExecutor) => Promise<T>): Promise<T>;
  withSavepoint<T>(executor: TransactionExecutor, name: string, fn: () => Promise<T>): Promise<T>;
}
