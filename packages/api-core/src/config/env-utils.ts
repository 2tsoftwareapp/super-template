import { z } from 'zod';

export const booleanFromString = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }
  }

  return value;
}, z.boolean());

export const emptyStringToUndefined = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
);

export const isHttpUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// Accepts one origin or a comma-separated list, validating each entry as a URL.
export const commaSeparatedOrigins = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
        .every(isHttpUrl),
    { message: 'must be a comma-separated list of valid origin URLs' },
  );

// Matches the format accepted by durationToMilliseconds (e.g. "15m", "7d").
export const durationString = z
  .string()
  .regex(/^\d+[smhdw]$/, 'must be a duration like "15m" or "7d"');

export const everyOriginIsHttps = (value: string): boolean =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .every((origin) => origin.startsWith('https://'));