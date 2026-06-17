import { isPostgresUniqueViolation } from './postgres-errors';

export interface IdempotentInsertResult<T> {
  value: T;
  created: boolean;
}

export const runIdempotentInsert = async <T>(
  insert: () => Promise<T | undefined>,
  findExisting: () => Promise<T | null>,
): Promise<IdempotentInsertResult<T> | null> => {
  try {
    const inserted = await insert();

    if (inserted) {
      return { value: inserted, created: true };
    }
  } catch (error) {
    if (!isPostgresUniqueViolation(error)) {
      throw error;
    }
  }

  const existing = await findExisting();

  if (!existing) {
    return null;
  }

  return { value: existing, created: false };
};
