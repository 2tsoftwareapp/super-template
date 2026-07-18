import type { TransactionExecutor } from '../common/types/transaction-executor';
import type { TenantContext } from './tenant-context.port';

export const TRANSACTION_PORT = Symbol('TRANSACTION_PORT');

export interface TransactionPort {
  run<T>(fn: (executor: TransactionExecutor) => Promise<T>): Promise<T>;
  withTenant<T>(ctx: TenantContext, fn: (executor: TransactionExecutor) => Promise<T>): Promise<T>;
  withSavepoint<T>(executor: TransactionExecutor, name: string, fn: () => Promise<T>): Promise<T>;
}
