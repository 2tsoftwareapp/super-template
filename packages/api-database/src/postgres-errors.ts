const readPostgresErrorCode = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const directCode = (error as { code?: string }).code;
  if (directCode) {
    return directCode;
  }

  const cause = (error as { cause?: unknown }).cause;
  if (typeof cause === 'object' && cause !== null) {
    return (cause as { code?: string }).code;
  }

  return undefined;
};

export const isPostgresUniqueViolation = (error: unknown): boolean =>
  readPostgresErrorCode(error) === '23505';
