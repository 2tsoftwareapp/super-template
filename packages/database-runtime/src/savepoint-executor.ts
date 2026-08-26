import type { TransactionExecutor } from "@repo/api-runtime";

/**
 * Minimal structural view of an executor that can run raw SQL, which is what
 * savepoint management needs. TransactionExecutor is intentionally opaque
 * (`unknown`) outside infrastructure, so this narrows it safely without `any`.
 * The query parameter stays `unknown` because drizzle's SQL class is nominal
 * and its type differs between static (CJS) and dynamic (ESM) imports.
 */
export interface SavepointExecutor {
  execute(query: unknown): Promise<unknown>;
}

export function toSavepointExecutor(executor: TransactionExecutor): SavepointExecutor {
  const candidate = executor as Partial<SavepointExecutor> | null | undefined;
  if (typeof candidate?.execute !== "function") {
    throw new Error(
      "TransactionExecutor does not support savepoints in the current implementation",
    );
  }
  return candidate as SavepointExecutor;
}
