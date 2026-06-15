const REDACT_KEYS = new Set([
  'authorization',
  'cookie',
  'cookies',
  'password',
  'passwordHash',
  'accessToken',
  'refreshToken',
  'token',
  'resetToken',
  'verificationToken',
]);

export const redactSensitive = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redactSensitive);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      if (REDACT_KEYS.has(key)) {
        return [key, '[REDACTED]'];
      }

      return [key, redactSensitive(nestedValue)];
    }),
  );
};
