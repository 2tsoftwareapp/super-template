const REDACT_KEYS = new Set([
  'authorization',
  'cookie',
  'cookies',
  'password',
  'passwordhash',
  'accesstoken',
  'refreshtoken',
  'token',
  'resettoken',
  'verificationtoken',
]);

export const redactSensitive = (value: unknown): unknown =>
  redactInternal(value, new WeakSet<object>());

const redactInternal = (value: unknown, seen: WeakSet<object>): unknown => {
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return '[Circular]';
    }
    seen.add(value);
    return value.map((item) => redactInternal(item, seen));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      if (REDACT_KEYS.has(key.toLowerCase())) {
        return [key, '[REDACTED]'];
      }

      return [key, redactInternal(nestedValue, seen)];
    }),
  );
};
