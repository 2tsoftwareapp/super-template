import { isPostgresUniqueViolation } from "./postgres-errors";

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

export interface IdempotentInsertManyResult<T> {
  rows: T[];
  created: boolean;
}

/**
 * Batch form of {@link runIdempotentInsert} — the single ensure-once primitive
 * for multi-row idempotent writes (e.g. job-sourced notification inbox rows).
 *
 * `insert` must create only the rows that do not exist yet (`ON CONFLICT DO
 * NOTHING` semantics) and return exactly the rows it created. Every expected
 * key the insert did not return is re-read through `findExisting`, so a retry
 * after a partial failure converges on exactly one row per key instead of
 * duplicating rows or dropping the ones already stored. Rows are keyed by
 * `keyOf` and returned insert-ordered first, then replayed rows.
 */
export const runIdempotentInsertMany = async <TKey, TRow>(params: {
  /** Logical identity the batch must cover — the result holds one row per key. */
  expectedKeys: readonly TKey[];
  keyOf: (row: TRow) => TKey;
  insert: () => Promise<TRow[]>;
  findExisting: (missingKeys: TKey[]) => Promise<TRow[]>;
}): Promise<IdempotentInsertManyResult<TRow>> => {
  const expected = [...new Set(params.expectedKeys)];

  if (expected.length === 0) {
    return { rows: [], created: false };
  }

  let inserted: TRow[] = [];
  try {
    inserted = await params.insert();
  } catch (error) {
    if (!isPostgresUniqueViolation(error)) {
      throw error;
    }
  }

  const insertedKeys = new Set(inserted.map(params.keyOf));
  const missingKeys = expected.filter((key) => !insertedKeys.has(key));

  if (missingKeys.length === 0) {
    return { rows: inserted, created: inserted.length > 0 };
  }

  const existing = await params.findExisting(missingKeys);

  const seen = new Set<TKey>();
  const rows: TRow[] = [];
  for (const row of [...inserted, ...existing]) {
    const key = params.keyOf(row);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push(row);
  }

  return { rows, created: inserted.length > 0 };
};
