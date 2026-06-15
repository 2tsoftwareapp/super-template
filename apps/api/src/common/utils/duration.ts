const DURATION_MULTIPLIER: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

export const durationToMilliseconds = (value: string): number => {
  const match = value.trim().match(/^(\d+)([smhdw])$/);

  if (!match) {
    throw new Error(`Unsupported duration value: ${value}`);
  }

  const [, amount, unit] = match;
  if (!amount || !unit) {
    throw new Error(`Unsupported duration value: ${value}`);
  }

  const multiplier = DURATION_MULTIPLIER[unit];

  if (!multiplier) {
    throw new Error(`Unsupported duration unit: ${unit}`);
  }

  return Number(amount) * multiplier;
};
