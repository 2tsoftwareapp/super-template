const normalizeKey = (key: string): string =>
  key.toLowerCase().replace(/[^a-z0-9]/g, '');

const REDACT_KEY_NORMALIZED = new Set([
  'authorization',
  'cookie',
  'cookies',
  'password',
  'passwordhash',
  'newpassword',
  'oldpassword',
  'passwordconfirmation',
  'accesstoken',
  'refreshtoken',
  'token',
  'resettoken',
  'verificationtoken',
  'apikey',
  'clientsecret',
  'privatekey',
  'secretaccesskey',
  'secretkey',
  'secret',
  'mfastatus',
  'mfasecret',
  'otp',
  'otpsecret',
  'recoverycodes',
  'recoverycode',
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
      if (REDACT_KEY_NORMALIZED.has(normalizeKey(key))) {
        return [key, '[REDACTED]'];
      }

      return [key, redactInternal(nestedValue, seen)];
    }),
  );
};
