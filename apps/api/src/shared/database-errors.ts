const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const MAX_CAUSE_DEPTH = 3;

/** Postgres SQLSTATE of a driver error, also when Drizzle wraps it in `cause`. */
function sqlState(error: unknown): string | undefined {
  let current = error;

  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current instanceof Object; depth += 1) {
    if ("code" in current && typeof current.code === "string") {
      return current.code;
    }

    current = "cause" in current ? current.cause : undefined;
  }

  return undefined;
}

export const isUniqueViolation = (error: unknown): boolean => sqlState(error) === UNIQUE_VIOLATION;

export const isForeignKeyViolation = (error: unknown): boolean =>
  sqlState(error) === FOREIGN_KEY_VIOLATION;
