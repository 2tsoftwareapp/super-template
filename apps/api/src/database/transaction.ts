import type { DatabaseClient, DatabaseTransaction } from './database.types';

export const runInTransaction = async <T>(
  database: DatabaseClient,
  operation: (transaction: DatabaseTransaction) => Promise<T>,
): Promise<T> => database.transaction((transaction) => operation(transaction));
