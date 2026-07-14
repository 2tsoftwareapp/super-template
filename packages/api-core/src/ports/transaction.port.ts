import type { TransactionExecutor } from '../common/types/transaction-executor';

export const TRANSACTION_PORT = Symbol('TRANSACTION_PORT');

export interface TransactionPort {
  run<T>(fn: (executor: TransactionExecutor) => Promise<T>): Promise<T>;
}
